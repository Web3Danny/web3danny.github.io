const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const TRACKING_FILE = path.join(__dirname, '../data/tracking.json');

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

function readEvents() {
  try { return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8')); } catch (e) { return []; }
}

function writeEvents(events) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(events, null, 2));
}

function requireKey(req, res, next) {
  const key = req.headers['x-pcrm-key'];
  const secret = process.env.PCRM_API_SECRET;
  if (!key || key !== secret) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}

// Public — tracking pixel (no auth required)
router.get('/pixel/:token', function(req, res) {
  const token = req.params.token;
  const events = readEvents();
  events.push({
    token,
    openedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.ip,
    ua: req.headers['user-agent'] || ''
  });
  writeEvents(events);
  res.set({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
  });
  res.send(PIXEL);
});

// Auth-protected
router.post('/register', requireKey, function(req, res) {
  const { token, leadId, contactEmail, docName } = req.body || {};
  if (!token) return res.status(400).json({ success: false, error: 'token required' });
  const events = readEvents();
  events.push({ token, leadId, contactEmail, docName, registeredAt: new Date().toISOString(), type: 'register' });
  writeEvents(events);
  res.json({ success: true });
});

router.get('/events', requireKey, function(req, res) {
  res.json({ success: true, events: readEvents() });
});

module.exports = router;
