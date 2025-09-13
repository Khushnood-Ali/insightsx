const express = require('express');
const { Tenant } = require('../models');
const router = express.Router();

// Get user's tenants
router.get('/', async (req, res) => {
  try {
    const userTenants = await req.user.getTenants();
    res.json(userTenants);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Create new tenant
router.post('/', async (req, res) => {
  try {
    const { id, name, domain, industry, shopify_domain, shopify_access_token } = req.body;

    if (!id || !name || !domain) {
      return res.status(400).json({ error: 'ID, name, and domain are required' });
    }

    // Check if tenant already exists
    const existingTenant = await Tenant.findByPk(id);
    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant already exists' });
    }

    // Create tenant
    const tenant = await Tenant.create({
      id,
      name,
      domain,
      industry,
      shopify_domain,
      shopify_access_token
    });

    // Associate with user
    await req.user.addTenant(tenant);

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Get tenant details
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.params.id;
    
    // Check if user has access
    const userTenants = await req.user.getTenants();
    const tenant = userTenants.find(t => t.id === tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const updates = req.body;

    // Check if user has access
    const userTenants = await req.user.getTenants();
    const tenant = userTenants.find(t => t.id === tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await tenant.update(updates);
    res.json(tenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Delete tenant
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.params.id;

    // Check if user has access
    const userTenants = await req.user.getTenants();
    const tenant = userTenants.find(t => t.id === tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await tenant.destroy();
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

module.exports = router;