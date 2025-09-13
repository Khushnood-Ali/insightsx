const { sequelize, User, Tenant, Customer, Order, Product } = require('../models');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    // Sync database
    console.log('Syncing database...');
    await sequelize.sync({ force: true });

    // Create demo user
    console.log('Creating demo user...');
    const demoUser = await User.create({
      email: 'demo@xeno.com',
      password: 'demo123',
      first_name: 'Demo',
      last_name: 'User',
      role: 'admin'
    });

    // Create tenants
    console.log('Creating tenants...');
    const tenants = [
      {
        id: 'fashion-boutique',
        name: 'Fashion Boutique',
        domain: 'fashion-boutique.myshopify.com',
        industry: 'Fashion & Apparel',
        currency: 'USD',
        status: 'active'
      },
      {
        id: 'tech-gadgets',
        name: 'Tech Gadgets Pro',
        domain: 'tech-gadgets.myshopify.com',
        industry: 'Electronics',
        currency: 'USD',
        status: 'active'
      },
      {
        id: 'home-essentials',
        name: 'Home Essentials',
        domain: 'home-essentials.myshopify.com',
        industry: 'Home & Garden',
        currency: 'USD',
        status: 'active'
      }
    ];

    const createdTenants = [];
    for (const tenantData of tenants) {
      const tenant = await Tenant.create(tenantData);
      await demoUser.addTenant(tenant);
      createdTenants.push(tenant);
    }

    // Create customers for each tenant
    console.log('Creating customers...');
    const customersData = {
      'fashion-boutique': [
        { name: 'Sarah Johnson', email: 'sarah@example.com', total_spent: 2450.00, orders_count: 12, location: 'New York, NY', segment: 'VIP' },
        { name: 'Mike Chen', email: 'mike@example.com', total_spent: 1890.75, orders_count: 8, location: 'Los Angeles, CA', segment: 'Regular' },
        { name: 'Emma Wilson', email: 'emma@example.com', total_spent: 3200.25, orders_count: 15, location: 'Chicago, IL', segment: 'VIP' },
        { name: 'David Brown', email: 'david@example.com', total_spent: 890.50, orders_count: 4, location: 'Houston, TX', segment: 'New' },
        { name: 'Lisa Anderson', email: 'lisa@example.com', total_spent: 1567.89, orders_count: 9, location: 'Phoenix, AZ', segment: 'Regular' }
      ],
      'tech-gadgets': [
        { name: 'Alex Rodriguez', email: 'alex@example.com', total_spent: 3450.00, orders_count: 8, location: 'Seattle, WA', segment: 'VIP' },
        { name: 'Jessica Park', email: 'jessica@example.com', total_spent: 2890.75, orders_count: 6, location: 'Austin, TX', segment: 'Regular' },
        { name: 'Robert Kim', email: 'robert@example.com', total_spent: 4200.25, orders_count: 11, location: 'San Francisco, CA', segment: 'VIP' },
        { name: 'Amanda Lee', email: 'amanda@example.com', total_spent: 1590.50, orders_count: 4, location: 'Denver, CO', segment: 'Regular' },
        { name: 'James Wilson', email: 'james@example.com', total_spent: 2567.89, orders_count: 7, location: 'Boston, MA', segment: 'Regular' }
      ],
      'home-essentials': [
        { name: 'Maria Garcia', email: 'maria@example.com', total_spent: 850.00, orders_count: 18, location: 'Miami, FL', segment: 'Regular' },
        { name: 'John Smith', email: 'john@example.com', total_spent: 1240.75, orders_count: 22, location: 'Atlanta, GA', segment: 'VIP' },
        { name: 'Kate Johnson', email: 'kate@example.com', total_spent: 690.25, orders_count: 12, location: 'Nashville, TN', segment: 'Regular' },
        { name: 'Tom Williams', email: 'tom@example.com', total_spent: 1890.50, orders_count: 28, location: 'Charlotte, NC', segment: 'VIP' },
        { name: 'Susan Davis', email: 'susan@example.com', total_spent: 567.89, orders_count: 9, location: 'Jacksonville, FL', segment: 'New' }
      ]
    };

    const createdCustomers = {};
    for (const tenant of createdTenants) {
      createdCustomers[tenant.id] = [];
      const customersList = customersData[tenant.id];
      
      for (const customerData of customersList) {
        const customer = await Customer.create({
          ...customerData,
          tenant_id: tenant.id
        });
        createdCustomers[tenant.id].push(customer);
      }
    }

    // Create orders for each tenant
    console.log('Creating orders...');
    const ordersData = {
      'fashion-boutique': [
        { order_number: 'ORD-3891', customer_name: 'Sarah Johnson', date: '2024-09-10', amount: 234.50, status: 'Fulfilled' },
        { order_number: 'ORD-3890', customer_name: 'Mike Chen', date: '2024-09-10', amount: 156.75, status: 'Processing' },
        { order_number: 'ORD-3889', customer_name: 'Emma Wilson', date: '2024-09-09', amount: 445.20, status: 'Fulfilled' },
        { order_number: 'ORD-3888', customer_name: 'David Brown', date: '2024-09-09', amount: 89.99, status: 'Pending' },
        { order_number: 'ORD-3887', customer_name: 'Lisa Anderson', date: '2024-09-08', amount: 267.30, status: 'Fulfilled' }
      ],
      'tech-gadgets': [
        { order_number: 'ORD-2156', customer_name: 'Alex Rodriguez', date: '2024-09-10', amount: 649.99, status: 'Fulfilled' },
        { order_number: 'ORD-2155', customer_name: 'Jessica Park', date: '2024-09-10', amount: 399.50, status: 'Processing' },
        { order_number: 'ORD-2154', customer_name: 'Robert Kim', date: '2024-09-09', amount: 899.00, status: 'Fulfilled' },
        { order_number: 'ORD-2153', customer_name: 'Amanda Lee', date: '2024-09-09', amount: 299.99, status: 'Processing' },
        { order_number: 'ORD-2152', customer_name: 'James Wilson', date: '2024-09-08', amount: 549.75, status: 'Fulfilled' }
      ],
      'home-essentials': [
        { order_number: 'ORD-4782', customer_name: 'Maria Garcia', date: '2024-09-10', amount: 67.50, status: 'Fulfilled' },
        { order_number: 'ORD-4781', customer_name: 'John Smith', date: '2024-09-10', amount: 89.25, status: 'Processing' },
        { order_number: 'ORD-4780', customer_name: 'Kate Johnson', date: '2024-09-09', amount: 45.99, status: 'Fulfilled' },
        { order_number: 'ORD-4779', customer_name: 'Tom Williams', date: '2024-09-09', amount: 123.40, status: 'Fulfilled' },
        { order_number: 'ORD-4778', customer_name: 'Susan Davis', date: '2024-09-08', amount: 78.60, status: 'Processing' }
      ]
    };

    for (const tenant of createdTenants) {
      const ordersList = ordersData[tenant.id];
      const tenantCustomers = createdCustomers[tenant.id];
      
      for (const orderData of ordersList) {
        // Find matching customer
        const customer = tenantCustomers.find(c => c.name === orderData.customer_name);
        
        await Order.create({
          ...orderData,
          tenant_id: tenant.id,
          customer_id: customer ? customer.id : null
        });
      }

      // Create additional historical orders for metrics
      for (let i = 0; i < 50; i++) {
        const randomCustomer = tenantCustomers[Math.floor(Math.random() * tenantCustomers.length)];
        const randomDate = new Date(2024, Math.floor(Math.random() * 9), Math.floor(Math.random() * 28) + 1);
        const randomAmount = Math.floor(Math.random() * 500) + 50;
        const statuses = ['Fulfilled', 'Processing', 'Pending', 'Cancelled'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        await Order.create({
          order_number: `ORD-${Date.now()}-${i}`,
          customer_name: randomCustomer.name,
          customer_id: randomCustomer.id,
          tenant_id: tenant.id,
          date: randomDate.toISOString().split('T')[0],
          amount: randomAmount,
          status: randomStatus
        });
      }
    }

    // Create products for each tenant
    console.log('Creating products...');
    const productsData = {
      'fashion-boutique': [
        { name: 'Designer Silk Dress', price: 249.99, category: 'Dresses', inventory: 45, sales: 127 },
        { name: 'Leather Handbag', price: 189.50, category: 'Accessories', inventory: 23, sales: 89 },
        { name: 'Cashmere Sweater', price: 159.99, category: 'Tops', inventory: 67, sales: 156 },
        { name: 'Premium Jeans', price: 129.00, category: 'Bottoms', inventory: 89, sales: 234 },
        { name: 'Statement Necklace', price: 79.99, category: 'Jewelry', inventory: 34, sales: 67 }
      ],
      'tech-gadgets': [
        { name: 'Wireless Headphones', price: 199.99, category: 'Audio', inventory: 125, sales: 567 },
        { name: 'Smartphone Case', price: 29.99, category: 'Accessories', inventory: 456, sales: 890 },
        { name: 'Portable Charger', price: 49.99, category: 'Power', inventory: 234, sales: 456 },
        { name: 'Bluetooth Speaker', price: 89.99, category: 'Audio', inventory: 89, sales: 234 },
        { name: 'Smart Watch', price: 299.99, category: 'Wearables', inventory: 67, sales: 123 }
      ],
      'home-essentials': [
        { name: 'Organic Cotton Towels', price: 34.99, category: 'Bath', inventory: 156, sales: 456 },
        { name: 'Kitchen Utensil Set', price: 45.50, category: 'Kitchen', inventory: 89, sales: 234 },
        { name: 'Scented Candles 3-Pack', price: 24.99, category: 'Decor', inventory: 234, sales: 567 },
        { name: 'Storage Baskets', price: 39.99, category: 'Organization', inventory: 67, sales: 189 },
        { name: 'Throw Pillow Set', price: 29.99, category: 'Decor', inventory: 123, sales: 345 }
      ]
    };

    for (const tenant of createdTenants) {
      const productsList = productsData[tenant.id];
      
      for (const productData of productsList) {
        await Product.create({
          ...productData,
          tenant_id: tenant.id
        });
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('Email: demo@xeno.com');
    console.log('Password: demo123');
    console.log('\n🏪 Available Tenants:');
    createdTenants.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.id})`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;