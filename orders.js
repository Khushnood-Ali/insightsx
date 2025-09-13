const express = require('express');
const { Order, Customer } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Get orders
router.get('/', async (req, res) => {
  try {
    const { limit, offset, sort, status, from, to } = req.query;
    
    // Build query options
    const queryOptions = {
      where: { tenant_id: req.tenantId },
      include: [{
        model: Customer,
        attributes: ['name', 'email']
      }]
    };

    // Add status filter
    if (status) {
      queryOptions.where.status = status;
    }

    // Add date range filter
    if (from || to) {
      queryOptions.where.date = {};
      if (from) queryOptions.where.date[Op.gte] = from;
      if (to) queryOptions.where.date[Op.lte] = to;
    }

    // Add pagination
    if (limit) {
      queryOptions.limit = parseInt(limit);
    }
    if (offset) {
      queryOptions.offset = parseInt(offset);
    }

    // Add sorting
    if (sort) {
      const [field, direction] = sort.split(':');
      queryOptions.order = [[field, direction || 'ASC']];
    } else {
      queryOptions.order = [['date', 'DESC']];
    }

    const orders = await Order.findAll(queryOptions);
    const total = await Order.count({ where: queryOptions.where });

    res.json({
      data: orders,
      total,
      page: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
      totalPages: limit ? Math.ceil(total / limit) : 1
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      },
      include: [{
        model: Customer,
        attributes: ['name', 'email', 'location']
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      tenant_id: req.tenantId
    };

    const order = await Order.create(orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update(req.body);
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.destroy();
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;