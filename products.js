const express = require('express');
const { Product } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Get products
router.get('/', async (req, res) => {
  try {
    const { limit, offset, sort, category, search, status } = req.query;
    
    // Build query options
    const queryOptions = {
      where: { tenant_id: req.tenantId }
    };

    // Add search filter
    if (search) {
      queryOptions.where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add category filter
    if (category) {
      queryOptions.where.category = category;
    }

    // Add status filter
    if (status) {
      queryOptions.where.status = status;
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
      queryOptions.order = [['sales', 'DESC']];
    }

    const products = await Product.findAll(queryOptions);
    const total = await Product.count({ where: queryOptions.where });

    res.json({
      data: products,
      total,
      page: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
      totalPages: limit ? Math.ceil(total / limit) : 1
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const productData = {
      ...req.body,
      tenant_id: req.tenantId
    };

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update(req.body);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        tenant_id: req.tenantId 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: ['category'],
      where: { 
        tenant_id: req.tenantId,
        category: { [Op.not]: null }
      },
      group: ['category'],
      raw: true
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;