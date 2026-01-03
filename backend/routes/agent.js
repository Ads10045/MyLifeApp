const express = require('express');
const router = express.Router();
const sourcingJob = require('../jobs/sourcingJob');
const fulfillmentJob = require('../jobs/fulfillmentJob');
const configManager = require('../utils/configManager');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET /api/agent/status - Retourne les stats des agents
router.get('/status', authenticateToken, isAdmin, (req, res) => {
  res.json({
    sourcing: {
      isRunning: sourcingJob.isRunning,
      activeSources: sourcingJob.activeSources,
      lastRun: sourcingJob.lastRun,
      stats: sourcingJob.stats,
      logs: sourcingJob.logs,
      lastProducts: sourcingJob.lastProducts || [],
      lastProductsBySource: sourcingJob.lastProductsBySource || {}
    },
    fulfillment: {
      isRunning: fulfillmentJob.isRunning,
      lastRun: fulfillmentJob.lastRun,
      logs: fulfillmentJob.logs,
      lastDeletedProducts: fulfillmentJob.lastDeletedProducts || [],
      config: configManager.getFulfillmentConfig()
    }
  });
});

// GET /api/agent/config - Get Agent Config
router.get('/config', authenticateToken, isAdmin, (req, res) => {
  res.json(configManager.config);
});

// POST /api/agent/config - Update Agent Config
router.post('/config', authenticateToken, isAdmin, (req, res) => {
  const { fulfillment } = req.body;
  if (fulfillment) {
    configManager.updateFulfillmentConfig(fulfillment);
  }
  res.json({ message: 'Configuration mise à jour', config: configManager.config });
});

// POST /api/agent/run - Lance manuellement le sourcing
router.post('/run', authenticateToken, isAdmin, async (req, res) => {
  const { source } = req.body;
  
  if (sourcingJob.isRunning) {
    return res.status(409).json({ message: 'L\'agent sourcing travaille déjà !' });
  }
  
  try {
    const result = await sourcingJob.run(source);
    
    if (result.status === 'success') {
      res.json({ 
        message: `✅ Sourcing terminé ! ${result.productsAdded} produits ajoutés${source ? ` depuis ${source}` : ''}.`,
        productsFound: result.productsAdded,
        source: source
      });
    } else {
      res.status(500).json({ message: `❌ Erreur: ${result.message}` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du sourcing' });
  }
});

// POST /api/agent/fulfill - Lance manuellement le fulfillment
router.post('/fulfill', authenticateToken, isAdmin, async (req, res) => {
  if (fulfillmentJob.isRunning) {
    return res.status(409).json({ message: 'L\'agent fulfillment travaille déjà !' });
  }
  fulfillmentJob.run();
  res.json({ message: '📦 Fulfillment Agent démarré' });
});

module.exports = router;
