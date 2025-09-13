const express = require('express');
const { Customer } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Get customers
router.get('/', async (req, res) => {
  try {
    const { limit, offset, sort, search, segment } = req.query;
    
    // Build query options
    const queryOptions = {
      where: { tenant_id: req.tenantId }
    };

    // Add search filter
    if (search) {
      queryOptions.where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add segment filter
    if (segment) {
      queryOptions.where.segment = segment;
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
      queryOptions.order = [['created_at', 'DESC']];
    }

    const customers = await Customer.findAll(queryOptions);
    const total = await Customer.count({ where: queryOptions.where });

    res.json({
      data: customers,
      total,
      page: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
      totalPages: limit ? Math.ceil(total / limit) : 1
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      tenant_id: req.tenantId
    };

    const customer = await Customer.create(customerData);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.update(req.body);
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.destroy();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;