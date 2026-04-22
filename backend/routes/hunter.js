const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { leadId, domain, requestId, hunterApiKey } = req.body;
  if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });
  if (!domain) return res.status(400).json({ success: false, error: 'domain is required' });
  if (!hunterApiKey) return res.status(400).json({ success: false, error: 'hunterApiKey is required' });

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(hunterApiKey)}&limit=10`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      return res.status(400).json({ success: false, error: data.errors[0].details || 'Hunter.io error' });
    }

    const contacts = (data.data?.emails || []).slice(0, 10).map(e => ({
      firstName: e.first_name || '',
      lastName: e.last_name || '',
      email: e.value || '',
      position: e.position || '',
      confidence: e.confidence || 0,
    }));

    res.json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
