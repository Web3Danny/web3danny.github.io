# PCRM Project — Claude Instructions

## Project Overview

A single-page CRM app (PCRM) served as static files. All logic is client-side JavaScript compiled with Babel via `index.html`. No build step; editing JS files directly.

## Architecture

- **Pass 1** (`comp_*` files, ~192KB headroom): `comp_core.js`, `comp_panels.js`, `comp_ai.js`, `comp_features.js`
- **Pass 2** (`tab_*` + `app.js`, ~308KB headroom): `tab_leads.js`, `tab_outreach.js`, `tab_other.js`, `app.js`
- `index.html` — loader; Pass 1 last line sets `window.__C={all 23 components}`; Pass 2 injects `var ScoreBadge=window.__C.ScoreBadge,...`
- `constants.js`, `services.js`, `styles.css` — shared. `components.js` — archive, NOT loaded.

**Never combine passes or merge files that would exceed pass size limits.**

## FROZEN — Tabs

Never rename, reorder, or change the tab ID. `outreach` tab ID stays `outreach` in code forever. Display label changes to **GTM Engine** only after Campaigns sub-tab is fully built and tested — that rename is the very last action.

| ID | Display | Purpose |
|---|---|---|
| `execution` | Today | Urgency queue, NowCard, CaptureBar |
| `leads` | Leads | Pipeline table, scoring, lead CRUD |
| `accounts` | Accounts | Renewals — stage 4 leads only |
| `dealroom` | Deal Room | Documents, QnA, company intelligence |
| `matrix` | Matrix | Ease/value scoring grid |
| `outreach` | Outreach → GTM Engine (last) | Sequences, Compose, Campaigns |
| `activity` | Activity | Logs, reminders, blockers |

## FROZEN — Pipeline Stages

Never change these integers. Embedded in all scoring, urgency, and filtering.

| Integer | Label | Code | Colour |
|---|---|---|---|
| −1 | Unstarted | — | — |
| 0 | Signal | SIG | #48DBFB |
| 1 | Echo | ECH | #0BE881 |
| 2 | Locked | LCK | #FFE066 |
| 3 | Proposal | PRO | #FF9F43 |
| 4 | Closed | CLO | #888888 |

`PIPE_NONE = -1`

## FROZEN — Functions

Never modify. Additive writes *after* all existing logic are allowed per `docs/PCRM_Reconciliation.md`.

`computeUrgency`, `computeCompositeScore`, `calcScore`, `calcDynamicScore`, `markSent`, `isStepReady`, `addContactToSeq`, `handleSchedule`, `fillVars`, `startGoogleAuth`, `sendViaGmail`, all five ReplyClassifier classification paths.

## FROZEN — localStorage Keys

Never delete, rename, or change shape.

`pcrm_v9_leads`, `pcrm_v9_sequences`, `pcrm_v9_reminders`, `pcrm_v9_apikey`, `pcrm_v9_scheduled`, `pcrm_v9_templates`, `pcrm_gtoken`, `pcrm_gtoken_time`, `pcrm_gclient_id`, `pcrm_auth`, `pcrm_pw_hash`, `pcrm_top3_tomorrow`, and all other `pcrm_v9_*` prefixed keys.

## Three Critical Rules

1. **Additive-only**: Never remove existing features, components, or UI elements unless explicitly instructed. Every session must leave all prior functionality intact.
2. **No regressions**: After any change, all tabs and features from previous sessions must still work. Test the golden path before reporting done.
3. **Size discipline**: Always check combined Babel input sizes after edits. Do not let either pass exceed its headroom.

## Three Architecture Rules

**Rule A — Campaigns is the only automation entry point.** Leads = data only. Sequences = templates only. Compose = manual only. No other tab triggers multi-step automation.

**Rule B — Deterministic merge (backend → localStorage).** Enrichment: replace only if backend timestamp newer. Signals: append-only, dedup by type + normalised value within 48 h, prune >30 days, cap 50. Contacts: merge by ID. Outreach data (drafts, step status): never overwritten by backend. Pipeline stage, CRM status, notes, deal room: localStorage always wins.

**Rule C — Active prompt fixed 6-section structure.** Pipeline snapshot → top signals (last 14 days only) → sequence performance → best patterns → top 5 leads by urgency → trend indicators (once 7+ days data). Max 2 000 chars, always overwritten, 5 s debounce. Full spec in `docs/PCRM_Reconciliation.md`.

## Protected Components (Sessions 1–4)

These must not be removed or broken:

- `ScoreBadge`, `DealRoom` (`comp_core.js`)
- `CompanyPanel`, `LeadForm`, `ExportPanel`, `GlobalMicPanel` (`comp_panels.js`)
- `ReplyClassifier`, `DailyBriefing`, `EODSummary` (`comp_ai.js`)
- `comp_features.js` exports: all 23 components via `window.__C`
- **`CaptureBar` / `GlobalMicPanel`**: conversational Q&A command interface; routes to lead summary, pipeline queries, quick actions, question detection, `parseCapture` log flow — do not change routing logic
- **`NowCard`**: layout locked to SITUATION + WHY TODAY + action row only; cold lead card is minimal; **ASSESSMENT block hidden unless lead has 14+ days of data** (`createdAt` age); action buttons always visible when contact exists
- **Smart channel button**: keyword-driven (calendar/document/linkedin/telegram/whatsapp); falls back: `preferredChannel` → most recent log → email
- **`summarizeLead()`** (`services.js`): 3-block AI brief (SITUATION / WHY TODAY / ASSESSMENT) from stored data only — never live web search
- **`ReActivationPanel`** (`comp_features.js`): stuck-deal thresholds by stage: Unstarted/Signal = 7 d, Echo = 14 d, Locked = 21 d, Proposal = 10 d; top 5 only; returns `null` when none
- **Deal Room** (`tab_other.js`, `comp_core.js`): Stakeholders section above document list; role badge per contact (champion / economic_buyer / blocker / influencer / neutral / unknown); warning banner when 2+ contacts at same lead in active sequences
- **Stage progression suggestions**: appear when lead meets threshold; user confirms all stage changes manually; thresholds configurable in `pcrm_v9_settings`
- **Three status systems — keep separate, label differently:** Pipeline stage (integer −1–4) | Lead CRM status (new/contacted/qualified/not_fit) | Outreach step status (new/drafted/sent/replied/booked) — always labelled **Step Status** in UI, never just "Status"
- `tab_leads.js`: full LeadsTab with import, Matrix, HOT/BLOCKED filters
- `tab_outreach.js`: OutreachTab — Gmail-style sidebar layout: Compose button + Inbox section (Replies/Sent/Scheduled/Starred) + Sequences list + Campaigns section (visually distinct). Clicking any item opens content in the centre panel.
- `tab_other.js`: Deal Room, doc rows
- `app.js`: main app shell, routing, urgencyData, NowCard

## Frozen Constraints (locked, do not revert)

**OutreachTab** (`tab_outreach.js` — locked 2026-04-17):
- `openStep` always shows raw `{{variables}}` template, never pre-filled with prospect data
- `previewCts` = all enrolled non-bounced contacts (not `stpCts`)
- Prospect selector gated to `stepView==="edit"` only — hidden in preview
- Generate Draft / Save / Copy / Use Template row sits directly under Tone row
- `showFormatBar` initialises to `false` — hidden by default
- "Draft saved" banner fires on explicit Save only — not on AI generate
- AI generate always strips name/company closing lines below "Best regards,"
- Settings: Current + New password only — no Confirm field
- Lock screen: `autoComplete="off"` — suppresses browser password manager

**DailyBriefing** (`comp_ai.js` — locked 2026-04-12): Exactly 4 sections — Yesterday's Top 3, OVERDUE tasks, Today's meetings, STARTING WITH. "Let's go →" navigates to Today tab. No scoreL, no AI Plan, no stats grid, no pipeline coverage.

**EOD Summary** (`comp_ai.js` — locked 2026-04-12): Kept: day stats, Tomorrow's Agenda, Top 3, AI Debrief, download. Removed and must not return: Pipeline Health block, "Going Cold" section, `topForTomorrow` variable.

**ReminderBanner** (`comp_core.js` — locked 2026-04-12): Only truly past-due tasks. No blockers >3 days section. Keeps: overdue tasks, scheduled emails, stale docs.

**NowCard stage label**: uses `C.muted` colour, not `#FECA57` yellow.

**DailyBriefing** receives `urgencyData` prop from `app.js` (same priority queue as Today tab). EOD Top 3 extracted via `^\d+\.` lines directly — no "TOMORROW TOP 3" header required.

**Pipeline tab (Leads tab) — locked 2026-04-22:** Pipeline tab default view must show ALL leads. HOT box filters to hot leads only (clears all other active filters when toggled on). BLOCKED box filters to blocked leads only (clears all other active filters when toggled on). Both are clickable toggles. The pipeline stage pills are clickable toggles that filter by stage. This must never be changed. Filter state persists in `pcrm_v11_lead_filter` localStorage key — bump the key version if stale filters cause leads to disappear (this has happened twice: PCR-22 bumped v9→v10, PCR-48 bumped v10→v11).

## Commit Convention

- Message format: `PCR-{N}: <description>`
- Co-author line: `Co-Authored-By: Paperclip <noreply@paperclip.ing>`
- Push to both `master` and `main` after every code change

## Key Docs

- `docs/session-history.md` — chronological change log by session
- `docs/PCRM_Reconciliation.md` — complete build guide, campaign architecture, three rules
- `docs/data-structures.md` — lead/contact/sequence data shapes
- `docs/outreach-architecture.md` — OutreachTab internals
- `docs/architect-process.md` — engineering process and design principles
- `docs/integrations.md` — Gmail/Calendar/Apollo/Luma integration docs
- `docs/editing-guide.md` — how to safely edit JS files
