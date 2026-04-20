const express = require('express');
const { readLeads, readCampaigns } = require('../dataStore');
const { getQueueDepth } = require('../updateQueue');

const router = express.Router();
const startedAt = Date.now();

router.get('/', (req, res) => {
  try {
    const leads = readLeads();
    const campaigns = readCampaigns();
    res.json({
      success: true,
      data: {
        uptime: Math.floor((Date.now() - startedAt) / 1000),
        leadCount: leads.length,
        campaignCount: campaigns.length,
        queueDepth: getQueueDepth(),
        serverTimestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
