const express = require('express');
const leadsRouter = require('./routes/leads');
const campaignsRouter = require('./routes/campaigns');
const healthRouter = require('./routes/health');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/leads', leadsRouter);
app.use('/campaigns', campaignsRouter);
app.use('/health', healthRouter);

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
