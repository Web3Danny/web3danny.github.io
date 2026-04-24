const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

/* ── Supabase client (STEP 28D backend) ──────────────────────────────────── */
/* SECURITY — service role key stored in .env only, never in frontend code.  */
/* Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the .env file on Hetzner */
let supaAdmin = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supaAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    console.log('PCRM backend: Supabase admin client initialized');
  } catch (e) {
    console.warn('PCRM backend: Supabase init failed —', e.message);
  }
}

/* Upsert enrichment/signal data for a lead into Supabase.                   */
/* Falls back gracefully if Supabase is not configured.                      */
async function syncLeadToSupabase(leadId, userId, leadData) {
  if (!supaAdmin || !userId) return;
  try {
    await supaAdmin.from('leads').upsert([{
      id: leadId,
      user_id: userId,
      company: leadData.company || '',
      industry: leadData.industry || '',
      pipeline: typeof leadData.pipeline === 'number' ? leadData.pipeline : -1,
      total_score: leadData.totalScore || 0,
      deal_value: leadData.dealValue || 0,
      data: leadData
    }], { onConflict: 'id,user_id' });
  } catch (e) {
    console.warn('PCRM backend: Supabase sync failed for lead', leadId, e.message);
  }
}

/* ── File store helpers ───────────────────────────────────────────────────── */
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

module.exports = { readLeads, writeLeads, readCampaigns, writeCampaigns, syncLeadToSupabase };
