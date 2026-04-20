const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readCampaigns, writeCampaigns, readLeads, writeLeads } = require('../dataStore');
const { enqueue } = require('../updateQueue');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const campaigns = readCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const campaigns = readCampaigns();
    const campaign = campaigns.find(c => c.id === req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { requestId, name, targetLeads, batchSize, step, ...rest } = req.body;
  if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });

  try {
    const result = await enqueue(requestId, 'CREATE_CAMPAIGN', `name=${name}`, () => {
      const campaigns = readCampaigns();
      const campaign = {
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString(),
        status: 'draft',
        targetLeads: targetLeads || [],
        processedLeads: [],
        failedLeads: [],
        lastRunAt: null,
        batchSize: batchSize || 10,
        step: step || null,
        ...rest,
      };
      campaigns.push(campaign);
      writeCampaigns(campaigns);
      return campaign;
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const { requestId, ...fields } = req.body;
  if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });

  try {
    const result = await enqueue(requestId, 'UPDATE_CAMPAIGN', `id=${req.params.id}`, () => {
      const campaigns = readCampaigns();
      const idx = campaigns.findIndex(c => c.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Campaign not found'), { statusCode: 404 });
      campaigns[idx] = { ...campaigns[idx], ...fields, updatedAt: new Date().toISOString() };
      writeCampaigns(campaigns);
      return campaigns[idx];
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/:id/run', async (req, res) => {
  const reqId = `run-${req.params.id}-${Date.now()}`;

  try {
    const result = await enqueue(reqId, 'RUN_CAMPAIGN', `id=${req.params.id}`, async () => {
      const campaigns = readCampaigns();
      const idx = campaigns.findIndex(c => c.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Campaign not found'), { statusCode: 404 });

      const campaign = campaigns[idx];
      if (campaign.status === 'running') throw Object.assign(new Error('Campaign already running'), { statusCode: 409 });

      const processedIds = new Set([
        ...campaign.processedLeads.map(p => p.leadId || p),
        ...campaign.failedLeads.map(f => f.leadId || f),
      ]);

      const remaining = campaign.targetLeads.filter(id => !processedIds.has(id));
      const batch = remaining.slice(0, campaign.batchSize || 10);

      campaign.status = 'running';
      campaign.lastRunAt = new Date().toISOString();
      campaigns[idx] = campaign;
      writeCampaigns(campaigns);

      const leads = readLeads();
      let newProcessed = [];
      let newFailed = [];

      for (const leadId of batch) {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.status === 'deleted') {
          newFailed.push({ leadId, reason: 'Lead not found or deleted', at: new Date().toISOString() });
        } else {
          newProcessed.push({ leadId, at: new Date().toISOString() });
        }
      }

      const updatedCampaigns = readCampaigns();
      const updatedIdx = updatedCampaigns.findIndex(c => c.id === req.params.id);
      const updatedCampaign = updatedCampaigns[updatedIdx];

      updatedCampaign.processedLeads = [...updatedCampaign.processedLeads, ...newProcessed];
      updatedCampaign.failedLeads = [...updatedCampaign.failedLeads, ...newFailed];

      const totalProcessed = updatedCampaign.processedLeads.length + updatedCampaign.failedLeads.length;
      const totalLeads = updatedCampaign.targetLeads.length;
      const failRate = totalLeads > 0 ? updatedCampaign.failedLeads.length / totalLeads : 0;

      if (totalProcessed >= totalLeads) {
        updatedCampaign.status = failRate > 0.5 ? 'failed' : 'completed';
      } else {
        updatedCampaign.status = 'paused';
      }

      updatedCampaigns[updatedIdx] = updatedCampaign;
      writeCampaigns(updatedCampaigns);
      return updatedCampaign;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/:id/pause', async (req, res) => {
  const reqId = `pause-${req.params.id}-${Date.now()}`;

  try {
    const result = await enqueue(reqId, 'PAUSE_CAMPAIGN', `id=${req.params.id}`, () => {
      const campaigns = readCampaigns();
      const idx = campaigns.findIndex(c => c.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Campaign not found'), { statusCode: 404 });
      campaigns[idx].status = 'paused';
      writeCampaigns(campaigns);
      return campaigns[idx];
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/:id/reset', async (req, res) => {
  const reqId = `reset-${req.params.id}-${Date.now()}`;

  try {
    const result = await enqueue(reqId, 'RESET_CAMPAIGN', `id=${req.params.id}`, () => {
      const campaigns = readCampaigns();
      const idx = campaigns.findIndex(c => c.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Campaign not found'), { statusCode: 404 });
      campaigns[idx].status = 'draft';
      campaigns[idx].processedLeads = [];
      campaigns[idx].failedLeads = [];
      campaigns[idx].lastRunAt = null;
      writeCampaigns(campaigns);
      return campaigns[idx];
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
