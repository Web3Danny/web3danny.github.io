/* ── PCRM Supabase Service Layer ─────────────────────────────────────────────── */
/* Wraps Supabase read/write with localStorage cache fallback for offline use.    */
/* All functions are async and safe to call even when Supabase is not configured. */
(function(){
  'use strict';

  function getClient() {
    return window.supabaseClient || null;
  }

  async function getCurrentUser() {
    var supa = getClient();
    if (!supa) return null;
    try {
      var res = await supa.auth.getUser();
      return (res && res.data && res.data.user) ? res.data.user : null;
    } catch(e) { return null; }
  }

  /* ── DATA LOAD ───────────────────────────────────────────────────────────── */
  async function loadAllData() {
    var supa = getClient();
    if (!supa) return null;
    var user = await getCurrentUser();
    if (!user) return null;

    try {
      var [leadsRes, seqRes, settingsRes] = await Promise.all([
        supa.from('leads').select('id,data').eq('user_id', user.id),
        supa.from('sequences').select('data').eq('user_id', user.id).limit(1),
        supa.from('user_settings').select('key,value').eq('user_id', user.id)
      ]);

      var leads = (leadsRes.data || []).map(function(row){ return row.data; }).filter(Boolean);
      var sequences = (seqRes.data && seqRes.data[0]) ? seqRes.data[0].data : null;
      var settings = {};
      (settingsRes.data || []).forEach(function(row){ settings[row.key] = row.value; });

      return { leads: leads, sequences: sequences, settings: settings, userId: user.id };
    } catch(e) {
      console.warn('PCRM Supabase: loadAllData failed', e);
      return null;
    }
  }

  /* ── DATA SAVE ───────────────────────────────────────────────────────────── */
  async function saveLeads(leads) {
    var supa = getClient();
    if (!supa) return;
    var user = await getCurrentUser();
    if (!user) return;

    try {
      var rows = (leads || []).map(function(l){
        return {
          id: l.id,
          user_id: user.id,
          company: l.company || '',
          industry: l.industry || '',
          pipeline: typeof l.pipeline === 'number' ? l.pipeline : -1,
          total_score: l.totalScore || 0,
          deal_value: l.dealValue || 0,
          is_hot: !!(l.isHot),
          crm_status: l.crmStatus || 'new',
          snoozed_until: l.snoozedUntil || null,
          waiting_until: l.waitingUntil || null,
          data: l
        };
      });
      if (rows.length > 0) {
        await supa.from('leads').upsert(rows, { onConflict: 'id,user_id' });
      }
    } catch(e) {
      console.warn('PCRM Supabase: saveLeads failed', e);
    }
  }

  async function saveSequences(sequences) {
    var supa = getClient();
    if (!supa) return;
    var user = await getCurrentUser();
    if (!user) return;

    try {
      await supa.from('sequences').upsert([{
        id: 'main',
        user_id: user.id,
        data: sequences
      }], { onConflict: 'id,user_id' });
    } catch(e) {
      console.warn('PCRM Supabase: saveSequences failed', e);
    }
  }

  async function saveSetting(key, value) {
    var supa = getClient();
    if (!supa) return;
    var user = await getCurrentUser();
    if (!user) return;

    try {
      await supa.from('user_settings').upsert([{
        user_id: user.id,
        key: key,
        value: value
      }], { onConflict: 'user_id,key' });
    } catch(e) {
      console.warn('PCRM Supabase: saveSetting failed', e);
    }
  }

  /* ── ONE-TIME MIGRATION ──────────────────────────────────────────────────── */
  async function migrateFromLocalStorage() {
    if (localStorage.getItem('pcrm_supa_migrated') === '1') return;
    var supa = getClient();
    if (!supa) return;
    var user = await getCurrentUser();
    if (!user) return;

    console.log('PCRM Supabase: starting localStorage migration...');

    /* Leads */
    try {
      var leadsRaw = localStorage.getItem('pcrm_v9_leads');
      if (leadsRaw) {
        var leads = JSON.parse(leadsRaw);
        if (Array.isArray(leads) && leads.length > 0) {
          await saveLeads(leads);
        }
      }
    } catch(e) { console.warn('PCRM Supabase migration: leads failed', e); }

    /* Sequences */
    try {
      var seqRaw = localStorage.getItem('pcrm_v9_sequences');
      if (seqRaw) await saveSequences(JSON.parse(seqRaw));
    } catch(e) { console.warn('PCRM Supabase migration: sequences failed', e); }

    /* Settings — migrate each pcrm_v9_* key */
    var settingKeys = [
      'pcrm_v9_icp', 'pcrm_v9_weights', 'pcrm_v9_reminders', 'pcrm_v9_apikey',
      'pcrm_v9_strategy', 'pcrm_v9_scheduled', 'pcrm_v9_wgoal', 'pcrm_v9_templates',
      'pcrm_v9_team', 'pcrm_v9_qna', 'pcrm_v9_compintel', 'pcrm_v9_signature',
      'pcrm_v9_campaigns', 'pcrm_v9_hunter_key', 'pcrm_v9_stats',
      'pcrm_v9_daily_reports', 'pcrm_v9_weekly_reports', 'pcrm_v9_active_prompt'
    ];
    for (var i = 0; i < settingKeys.length; i++) {
      try {
        var v = localStorage.getItem(settingKeys[i]);
        if (v) await saveSetting(settingKeys[i], v);
      } catch(e) {}
    }

    localStorage.setItem('pcrm_supa_migrated', '1');
    console.log('PCRM Supabase: migration complete');
  }

  /* ── AUTH HELPERS ────────────────────────────────────────────────────────── */
  async function signIn(email, password) {
    var supa = getClient();
    if (!supa) return { error: { message: 'Supabase not configured' } };
    return supa.auth.signInWithPassword({ email: email, password: password });
  }

  async function signOut() {
    var supa = getClient();
    if (!supa) return;
    return supa.auth.signOut();
  }

  async function resetPassword(email) {
    var supa = getClient();
    if (!supa) return { error: { message: 'Supabase not configured' } };
    return supa.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
  }

  async function updatePassword(newPassword) {
    var supa = getClient();
    if (!supa) return { error: { message: 'Supabase not configured' } };
    return supa.auth.updateUser({ password: newPassword });
  }

  async function getSession() {
    var supa = getClient();
    if (!supa) return null;
    try {
      var res = await supa.auth.getSession();
      return (res && res.data && res.data.session) ? res.data.session : null;
    } catch(e) { return null; }
  }

  /* ── PUBLIC API ──────────────────────────────────────────────────────────── */
  window.pcrmSupabase = {
    getClient: getClient,
    getCurrentUser: getCurrentUser,
    getSession: getSession,
    signIn: signIn,
    signOut: signOut,
    resetPassword: resetPassword,
    updatePassword: updatePassword,
    loadAllData: loadAllData,
    saveLeads: saveLeads,
    saveSequences: saveSequences,
    saveSetting: saveSetting,
    migrateFromLocalStorage: migrateFromLocalStorage
  };
})();
