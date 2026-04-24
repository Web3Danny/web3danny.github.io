-- PCRM Supabase Schema — run this in the Supabase SQL Editor
-- Project: pcrm-gtm
-- Enables Row Level Security on all tables so each user sees only their own data.

-- ─────────────────────────────────────────────────────────────────────────────
-- LEADS
-- Key fields extracted as columns for efficient filtering.
-- All complex nested objects (contacts, logEntries, etc.) stored as JSONB.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                TEXT        NOT NULL,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company           TEXT,
  industry          TEXT,
  website           TEXT        DEFAULT '',
  lead_type         TEXT        DEFAULT 'prospect',
  pipeline          INTEGER     DEFAULT -1,
  total_score       INTEGER     DEFAULT 0,
  deal_value        NUMERIC     DEFAULT 0,
  is_hot            BOOLEAN     DEFAULT FALSE,
  crm_status        TEXT        DEFAULT 'new',
  snoozed_until     TIMESTAMPTZ,
  waiting_until     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  -- Nested objects stored as JSONB
  data              JSONB       NOT NULL DEFAULT '{}',
  PRIMARY KEY (id, user_id)
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads (user_id);
CREATE INDEX IF NOT EXISTS leads_pipeline_idx ON leads (user_id, pipeline);

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own leads"
  ON leads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SEQUENCES
-- Stores the entire sequences object (DEF_SEQUENCES shape) per user.
-- Single row per user with the full sequences JSON.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sequences (
  id          TEXT        NOT NULL DEFAULT 'main',
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own sequences"
  ON sequences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- USER_SETTINGS
-- Key-value store for all per-user settings: API keys, preferences, weights,
-- campaigns, templates, reminders, etc.
-- Each localStorage key (pcrm_v9_*) becomes one row.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL,
  value       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENTS
-- Deal room documents per lead.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id     TEXT,
  title       TEXT,
  type        TEXT,
  url         TEXT,
  notes       TEXT        DEFAULT '',
  status      TEXT        DEFAULT 'draft',
  data        JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS documents_lead_idx ON documents (user_id, lead_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- TEMPLATES
-- Email and document templates per user.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id          TEXT        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  subject     TEXT        DEFAULT '',
  body        TEXT        DEFAULT '',
  channel     TEXT        DEFAULT 'email',
  data        JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own templates"
  ON templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT trigger (auto-update on row change)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sequences_updated_at
  BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
