const express = require('express');
const { Customer, Order, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const router = express.Router();

// Get dashboard metrics
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Calculate date ranges for growth comparison
    const currentMonth = moment().startOf('month');
    const lastMonth = moment().subtract(1, 'month').startOf('month');
    const currentMonthEnd = moment().endOf('month');
    const lastMonthEnd = moment().subtract(1, 'month').endOf('month');

    // Get overview metrics
    const [
      totalCustomers,
      totalOrders,
      totalRevenue,
      lastMonthCustomers,
      lastMonthOrders,
      lastMonthRevenue
    ] = await Promise.all([
      Customer.count({ where: { tenant_id: tenantId } }),
      Order.count({ where: { tenant_id: tenantId } }),
      Order.sum('amount', { where: { tenant_id: tenantId } }) || 0,
      Customer.count({ 
        where: { 
          tenant_id: tenantId,
          created_at: { [Op.lt]: currentMonth.toDate() }
        } 
      }),
      Order.count({ 
        where: { 
          tenant_id: tenantId,
          date: { [Op.lt]: currentMonth.format('YYYY-MM-DD') }
        } 
      }),
      Order.sum('amount', { 
        where: { 
          tenant_id: tenantId,
          date: { [Op.lt]: currentMonth.format('YYYY-MM-DD') }
        } 
      }) || 0
    ]);

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const lastMonthAvgOrderValue = lastMonthOrders > 0 ? lastMonthRevenue / lastMonthOrders : 0;

    // Calculate growth rates
    const customerGrowth = lastMonthCustomers > 0 
      ? ((totalCustomers - lastMonthCustomers) / lastMonthCustomers) * 100 
      : 0;
    
    const orderGrowth = lastMonthOrders > 0 
      ? ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0;
    
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    
    const aovGrowth = lastMonthAvgOrderValue > 0 
      ? ((avgOrderValue - lastMonthAvgOrderValue) / lastMonthAvgOrderValue) * 100 
      : 0;

    // Get revenue data for last 6 months
    const revenueData = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%b'), 'month'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
      ],
      where: {
        tenant_id: tenantId,
        date: {
          [Op.gte]: moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD')
        }
      },
      group: [sequelize.fn('MONTH', sequelize.col('date'))],
      order: [['date', 'ASC']],
      raw: true
    });

    // Get order status distribution
    const orderStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { tenant_id: tenantId },
      group: ['status'],
      raw: true
    });

    // Add colors to order status
    const statusColors = {
      'Fulfilled': '#10B981',
      'Processing': '#F59E0B',
      'Pending': '#EF4444',
      'Cancelled': '#6B7280'
    };

    const orderStatusWithColors = orderStatus.map(status => ({
      ...status,
      color: statusColors[status.status] || '#6B7280'
    }));

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: { tenant_id: tenantId },
      include: [{
        model: Customer,
        attributes: ['name']
      }],
      order: [['date', 'DESC']],
      limit: 5
    });

    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.order_number || `#ORD-${order.id}`,
      customer: order.Customer?.name || order.customer_name || 'Unknown',
      date: order.date,
      amount: parseFloat(order.amount),
      status: order.status
    }));

    const overview = {
      totalCustomers,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      customerGrowth: parseFloat(customerGrowth.toFixed(1)),
      orderGrowth: parseFloat(orderGrowth.toFixed(1)),
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
      aovGrowth: parseFloat(aovGrowth.toFixed(1))
    };

    res.json({
      overview,
      revenueData: revenueData.map(item => ({
        month: item.month,
        revenue: parseFloat(item.revenue) || 0,
        orders: parseInt(item.orders) || 0
      })),
      orderStatus: orderStatusWithColors.map(item => ({
        status: item.status,
        count: parseInt(item.count),
        color: item.color
      })),
      recentOrders: formattedRecentOrders
    });

  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get customer metrics
router.get('/customers', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Get customer segment distribution
    const segments = await Customer.findAll({
      attributes: [
        'segment',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { tenant_id: tenantId },
      group: ['segment'],
      raw: true
    });

    // Get top customers by spend
    const topCustomers = await Customer.findAll({
      where: { tenant_id: tenantId },
      order: [['total_spent', 'DESC']],
      limit: 10
    });

    // Get customer growth over time
    const customerGrowth = await Customer.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%b'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'newCustomers']
      ],
      where: {
        tenant_id: tenantId,
        created_at: {
          [Op.gte]: moment().subtract(11, 'months').startOf('month').toDate()
        }
      },
      group: [sequelize.fn('MONTH', sequelize.col('created_at'))],
      order: [['created_at', 'ASC']],
      raw: true
    });

    res.json({
      segments: segments.map(s => ({
        segment: s.segment,
        count: parseInt(s.count)
      })),
      topCustomers,
      customerGrowth: customerGrowth.map(c => ({
        month: c.month,
        newCustomers: parseInt(c.newCustomers)
      }))
    });

  } catch (error) {
    console.error('Get customer metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch customer metrics' });
  }
});

// Get product metrics
router.get('/products', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Get top selling products
    const topProducts = await Product.findAll({
      where: { tenant_id: tenantId },
      order: [['sales', 'DESC']],
      limit: 10
    });

    // Get category performance
    const categoryPerformance = await Product.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'productCount'],
        [sequelize.fn('SUM', sequelize.col('sales')), 'totalSales'],
        [sequelize.fn('AVG', sequelize.col('price')), 'avgPrice']
      ],
      where: { 
        tenant_id: tenantId,
        category: { [Op.not]: null }
      },
      group: ['category'],
      raw: true
    });

    // Get low inventory products
    const lowInventoryProducts = await Product.findAll({
      where: { 
        tenant_id: tenantId,
        inventory: { [Op.lt]: 10 }
      },
      order: [['inventory', 'ASC']],
      limit: 10
    });

    res.json({
      topProducts,
      categoryPerformance: categoryPerformance.map(c => ({
        category: c.category,
        productCount: parseInt(c.productCount),
        totalSales: parseInt(c.totalSales) || 0,
        avgPrice: parseFloat(c.avgPrice) || 0
      })),
      lowInventoryProducts
    });

  } catch (error) {
    console.error('Get product metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch product metrics' });
  }
});

module.exports = router;