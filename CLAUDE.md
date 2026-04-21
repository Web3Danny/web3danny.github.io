# PCRM Project — Claude Instructions

## Project Overview

A single-page CRM app (PCRM) served as static files. All logic is client-side JavaScript compiled with Babel via `index.html`. No build step; editing JS files directly.

## Architecture

### File Layout (2-pass Babel loader)

- **Pass 1** (`comp_*` files, ~192KB): `comp_core.js`, `comp_panels.js`, `comp_ai.js`, `comp_features.js`
- **Pass 2** (`tab_*` + `app.js`, ~308KB): `tab_leads.js`, `tab_outreach.js`, `tab_other.js`, `app.js`
- `index.html` — loader; runs both passes; Pass 1 last line sets `window.__C={all 23 components}`; Pass 2 starts with inject `var ScoreBadge=window.__C.ScoreBadge,...`
- `constants.js` — all constants (24KB)
- `services.js` — shared services, `buildPCRMReport()` global (5KB)
- `styles.css` — global styles (1.2KB)
- `components.js` — archive copy, NOT loaded by index.html

### Critical Size Constraint

Babel input per pass must stay under the limit. Current headroom:
- Pass 1: ~191KB headroom
- Pass 2: ~307KB headroom

**Never combine passes or merge files that would exceed these limits.**

## Three Critical Rules

1. **Additive-only**: Never remove existing features, components, or UI elements unless explicitly instructed. Every session must leave all prior functionality intact.
2. **No regressions**: After any change, all tabs and features from previous sessions must still work. Test the golden path before reporting done.
3. **Size discipline**: Always check combined Babel input sizes after edits. Do not let either pass exceed its headroom.

## Protected Components (Sessions 1–4)

These components were built in Sessions 1–4 and must not be removed or broken:

- `ScoreBadge`, `DealRoom` (`comp_core.js`)
- `CompanyPanel`, `LeadForm`, `ExportPanel`, `GlobalMicPanel` (`comp_panels.js`)
- `ReplyClassifier`, `DailyBriefing`, `EODSummary` (`comp_ai.js`)
- `comp_features.js` exports: all 23 components via `window.__C`
- `tab_leads.js`: full LeadsTab with import, Matrix, HOT/BLOCKED filters
- `tab_outreach.js`: OutreachTab with step editor, sequences, campaigns
- `tab_other.js`: Deal Room, doc rows, Today/other tabs
- `app.js`: main app shell, routing, urgencyData, NowCard

## Frozen Constraints

- `openStep` in `tab_outreach.js` always shows raw `{{variables}}` template, never pre-filled prospect data
- `previewCts` = all enrolled non-bounced contacts (not `stpCts`)
- Prospect selector gated to `stepView==="edit"` only
- AI generate closing strip always strips name/company below "Best regards,"
- Settings: only Current + New password fields (no Confirm field)
- Lock screen: `autoComplete="off"` to suppress browser password manager
- NowCard "STAGE" label uses `C.muted` color (not `#FECA57` yellow)
- ReminderBanner: only truly past-due tasks (not due-within-24h)
- DailyBriefing uses `urgencyData` prop from app.js (same priority queue as Today tab)
- EOD Top 3 extracted via `^\d+\.` lines directly (no "TOMORROW TOP 3" header required)

## Commit Convention

- Commit messages: `PCR-{N}: <description>`
- Co-author line: `Co-Authored-By: Paperclip <noreply@paperclip.ing>`
- Push to both `master` and `main` after every code change

## Key Docs

- `docs/session-history.md` — chronological change log by session
- `docs/data-structures.md` — lead/contact data shape
- `docs/outreach-architecture.md` — OutreachTab internals
- `docs/architect-process.md` — engineering process notes
- `docs/integrations.md` — Gmail/Calendar/Apollo/Luma integration docs
- `docs/editing-guide.md` — how to safely edit JS files
