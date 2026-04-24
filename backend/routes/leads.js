const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readLeads, writeLeads, syncLeadToSupabase } = require('../dataStore');
const { enqueue } = require('../updateQueue');

const router = express.Router();

const VALID_STATUSES = ['active', 'not_fit', 'contacted', 'enriched', 'sequenced', 'converted', 'churned', 'deleted'];

router.get('/', (req, res) => {
  try {
    let leads = readLeads();
    const { status } = req.query;
    if (status) {
      leads = leads.filter(l => l.status === status);
    }
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const leads = readLeads();
    const lead = leads.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { requestId, ...fields } = req.body;
  if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });

  try {
    const result = await enqueue(requestId, 'CREATE_LEAD', `name=${fields.name}`, () => {
      const leads = readLeads();
      const lead = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        status: 'active',
        events: [],
        ...fields,
      };
      leads.push(lead);
      writeLeads(leads);
      return lead;
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
    const result = await enqueue(requestId, 'UPDATE_LEAD', `id=${req.params.id}`, () => {
      const leads = readLeads();
      const idx = leads.findIndex(l => l.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

      const event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: 'updated',
        payload: fields,
      };
      leads[idx] = { ...leads[idx], ...fields, updatedAt: new Date().toISOString() };
      leads[idx].events = [...(leads[idx].events || []), event];
      writeLeads(leads);
      return leads[idx];
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { requestId } = req.body || {};
  const reqId = requestId || `delete-${req.params.id}-${Date.now()}`;

  try {
    const result = await enqueue(reqId, 'DELETE_LEAD', `id=${req.params.id}`, () => {
      const leads = readLeads();
      const idx = leads.findIndex(l => l.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

      const event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: 'deleted',
        payload: {},
      };
      leads[idx].status = 'deleted';
      leads[idx].deletedAt = new Date().toISOString();
      leads[idx].events = [...(leads[idx].events || []), event];
      writeLeads(leads);
      return leads[idx];
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/:id/signals', async (req, res) => {
  const { requestId, type, payload } = req.body;
  if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });
  if (!type) return res.status(400).json({ success: false, error: 'type is required' });

  try {
    const result = await enqueue(requestId, 'LEAD_SIGNAL', `id=${req.params.id} type=${type}`, () => {
      const leads = readLeads();
      const idx = leads.findIndex(l => l.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

      const event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type,
        payload: payload || {},
      };
      leads[idx].events = [...(leads[idx].events || []), event];
      writeLeads(leads);
      return leads[idx];
    });
    /* STEP 28D — sync signal update to Supabase (fire and forget) */
    const userId = req.headers['x-pcrm-user-id'];
    syncLeadToSupabase(req.params.id, userId, result).catch(() => {});
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

router.post('/:id/enrich', async (req, res) => {
  const { requestId, ...enrichmentData } = req.body;
  if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });

  try {
    const result = await enqueue(requestId, 'ENRICH_LEAD', `id=${req.params.id}`, () => {
      const leads = readLeads();
      const idx = leads.findIndex(l => l.id === req.params.id);
      if (idx === -1) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

      const event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: 'enriched',
        payload: enrichmentData,
      };
      leads[idx].enrichment = { ...((leads[idx].enrichment) || {}), ...enrichmentData };
      leads[idx].status = 'enriched';
      leads[idx].events = [...(leads[idx].events || []), event];
      writeLeads(leads);
      return leads[idx];
    });
    /* STEP 28D — sync enrichment to Supabase (fire and forget) */
    const userId = req.headers['x-pcrm-user-id'];
    syncLeadToSupabase(req.params.id, userId, result).catch(() => {});
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
