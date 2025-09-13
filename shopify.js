const express = require('express');
const { ShopifyService } = require('../services/shopify_service');
const { Tenant } = require('../models');
const router = express.Router();

// Trigger manual sync
router.post('/sync/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const shopifyConfig = {
      storeDomain: tenant.shopify_domain,
      accessToken: tenant.shopify_access_token
    };

    const service = new ShopifyService(tenantId, shopifyConfig);
    const result = await service.fullSync();

    res.json({
      success: true,
      message: 'Sync completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
});

// Get sync status
router.get('/status/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      lastSync: tenant.last_sync,
      syncStatus: tenant.sync_status,
      isConnected: !!tenant.shopify_access_token
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

module.exports = router;
