const express = require('express');
const router = express.Router();
const sourcingJob = require('../jobs/sourcingJob');
const fulfillmentJob = require('../jobs/fulfillmentJob');
const { isAdmin } = require('../middleware/auth');

// GET /api/agent/status - Retourne les stats des agents
router.get('/status', isAdmin, (req, res) => {
  res.json({
    sourcing: {
      isRunning: sourcingJob.isRunning,
      lastRun: sourcingJob.lastRun,
      stats: sourcingJob.stats,
      logs: sourcingJob.logs,
      lastProducts: sourcingJob.lastProducts || []
    },
    fulfillment: {
      isRunning: fulfillmentJob.isRunning,
      lastRun: fulfillmentJob.lastRun,
      logs: fulfillmentJob.logs
    }
  });
});

// POST /api/agent/run - Lance manuellement le sourcing
router.post('/run', isAdmin, async (req, res) => {
  if (sourcingJob.isRunning) {
    return res.status(409).json({ message: 'L\'agent sourcing travaille déjà !' });
  }
  sourcingJob.run();
  res.json({ message: '🚀 Sourcing Agent démarré' });
});

// POST /api/agent/fulfill - Lance manuellement le fulfillment
router.post('/fulfill', isAdmin, async (req, res) => {
  if (fulfillmentJob.isRunning) {
    return res.status(409).json({ message: 'L\'agent fulfillment travaille déjà !' });
  }
  fulfillmentJob.run();
  res.json({ message: '📦 Fulfillment Agent démarré' });
});

module.exports = router;
