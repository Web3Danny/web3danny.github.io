const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

function readFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function readLeads() {
  return readFile(LEADS_FILE);
}

function writeLeads(leads) {
  writeFile(LEADS_FILE, leads);
}

function readCampaigns() {
  return readFile(CAMPAIGNS_FILE);
}

function writeCampaigns(campaigns) {
  writeFile(CAMPAIGNS_FILE, campaigns);
}

module.exports = { readLeads, writeLeads, readCampaigns, writeCampaigns };
