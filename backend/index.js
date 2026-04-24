require('dotenv').config();
const express = require('express');
const leadsRouter = require('./routes/leads');
const campaignsRouter = require('./routes/campaigns');
const healthRouter = require('./routes/health');
const hunterRouter = require('./routes/hunter');
const trackingRouter = require('./routes/tracking');

const app = express();
const PORT = 3000;

const API_SECRET = process.env.PCRM_API_SECRET;
if (!API_SECRET) {
  console.error('FATAL: PCRM_API_SECRET not set in .env');
  process.exit(1);
}

app.use(express.json());

// Public tracking pixel — no auth required
app.use('/track', trackingRouter);

app.use(function requireApiKey(req, res, next) {
  const key = req.headers['x-pcrm-key'];
  if (!key || key !== API_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
});

app.use('/leads', leadsRouter);
app.use('/campaigns', campaignsRouter);
app.use('/health', healthRouter);
app.use('/hunter', hunterRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`PCRM backend running on port ${PORT}`);
});
