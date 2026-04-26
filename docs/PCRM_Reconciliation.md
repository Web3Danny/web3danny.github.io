# PCRM — Pre-Build Reconciliation & Build Guide
### Architecture lock, hardening rules, and every Claude Code prompt in order

---

## HOW TO USE THIS DOCUMENT

This document has two purposes. The first half defines
what is frozen, what changes, and what gets built. The
second half gives you every Claude Code prompt in exact
order with clear labels showing when to paste, when to
wait, and when to test before moving on.

Every prompt that goes into Claude Code is marked:
SEND TO CLAUDE CODE — STEP [N]

Every test checkpoint is marked:
TEST BEFORE CONTINUING

Every step that happens outside Claude Code is marked:
DO THIS MANUALLY

IMPORTANT FOR AI AGENT BUILDS:
If agents are building via Paperclip instead of you
building manually, the TEST BEFORE CONTINUING blocks
still apply. The QA agent runs these checks and writes
a report. You read the report and approve before the
next step begins. Session-level checkpoints in the
Paperclip Handover Guide require you personally
testing the app before agents continue to the next
session. No checkpoint is skipped regardless of
whether a human or an agent did the building.

---

## PART 1 — ARCHITECTURE DECISIONS

---

### What Is Permanently Frozen

The following things never change under any circumstance.
Claude Code must treat any instruction that would touch
them as an error, even if it seems like an improvement.

The seven tabs stay exactly as they are in ID, display
name, and purpose. The execution tab runs the urgency
queue and is called Today. The leads tab shows the
pipeline table and scoring. Accounts handles renewals
for stage four leads only. Deal Room stores documents,
QnA, and company intelligence. Matrix handles ease and
value scoring. The outreach tab holds sequences and
compose. Activity shows logs, reminders, and blockers.
The outreach tab will eventually be renamed GTM Engine
but only after the Campaigns sub-tab is fully built and
tested. That rename is the very last action.

The five pipeline stages are frozen at the integer level.
Unstarted is minus one, Signal is zero, Echo is one,
Locked is two, Deep Dive is three, On The Wire is four.
These integers are embedded inside scoring weights,
urgency calculations, milestone tracking, and the
Accounts tab filter. If they change, everything breaks.

All scoring and urgency functions are frozen. The static
score, the dynamic ICP-weighted score, the urgency signal
weights, and the composite execution score are locked.
The NOW versus QUEUE versus NOTTODAY split depends on
these entirely.

The Gmail OAuth flow is frozen. The auth popup, token
writing, email sending mechanism, thirty-second scheduled
email interval, token refresh, and internal versus
external email detection are all locked.

All six existing AI prompts are frozen in structure,
location, and purpose. The deal action suggestion, the
capture classifier, the deal diagnosis, the compose draft
generator, the end-of-day debrief, and the morning
briefing stay exactly as they are.

All twenty existing localStorage keys are frozen. Never
deleted, never renamed, never given a different shape.

The sequence send functions are frozen. Step advancement,
unlock time calculation, enrollment, schedule handler,
variable substitution, and the five-path reply classifier
modal are all locked.

---

### Three Status Systems — Keep Them Separate

There are three completely separate status systems. They
must always be labelled differently in the UI.

Pipeline stage is an integer on the lead ranging from
minus one to four, shown as stage names.

Lead CRM status is a string on the lead with values like
new, contacted, qualified, and not fit.

Outreach step status is a per-step string inside sequence
progress with values new, drafted, sent, replied, booked.

Always label the third one as Step Status in the UI,
never just Status.

---

### What Gets Added to the Data Model

Three new fields on the lead object, set to defaults
by a v8 migration and by the lead factory function.

An enrichment object, initially null. Holds data from
n8n — source, timestamp, and an open key-value store.

A signals array, initially empty. Holds signal events
with a type, value, strength, detection timestamp, and
source. Capped at fifty entries. Signals older than
thirty days are pruned before the cap is enforced.

An outreach outcome object, initially null. Records the
result of the most recent reply classification — the
outcome status and two timestamps.

Three new fields on the sequence progress object for
each enrolled contact.

A step status map recording new, drafted, sent, replied,
or booked per step index. Missing keys default to new.

A step outcome map recording no reply, replied positive,
call booked, bounced, or opted out per step index.
Missing keys default to null.

A drafts map storing AI-generated draft content per step.
Cleared on send to protect localStorage space.

Three new localStorage keys following the existing
naming convention. A daily reports key capped at seven
entries rolling. A weekly reports key capped at four
entries rolling. An active prompt key holding the
structured system state prompt.

ADDITIONAL DATA MODEL ADDITIONS — from feedback audit:

A role field on every contact object in the contacts
array. Values: champion, economic_buyer, blocker,
influencer, neutral, unknown. Default: unknown.
This enables stakeholder mapping at the account level
and cross-contact awareness in sequences.

A callOutcomes array on each lead. Append-only log of
call events. Each entry contains: timestamp, contact
name or number, duration in minutes, source of the
log entry (granola, mac_facetime, manual), a summary
written by Claude or manually, and deal progression
outcome. Deal progression outcome values are:
no_outcome, call_happened, meeting_booked,
proposal_discussed, deal_advanced, deal_closed,
relationship_maintained.

A stageAlias map in constants.js mapping each pipeline
stage integer to a conventional BD label.
  0 Signal      → Qualified
  1 Echo        → Engaged
  2 Locked      → Committed
  3 Deep Dive   → Proposal
  4 On The Wire → Verbal / Closing
The underlying integers never change. The alias is
display-only and shown alongside the internal name.

A snoozedUntil field on each lead, initially null.
A snoozeReason field on each lead, initially null.
When a lead is snoozed, both are set. When the snooze
wakes up, snoozeReason surfaces prominently on the lead
card in the Today tab alongside why it was snoozed.

A stageProgressionRules object in user settings stored
in localStorage under pcrm_v9_settings. This defines
the minimum signal thresholds required before the system
suggests advancing a lead to the next stage. Default
rules are:
  Signal → Echo: at least one medium or strong signal
    plus one sent sequence step
  Echo → Locked: a positive reply classified in the
    ReplyClassifier
  Locked → Deep Dive: at least one call logged in
    callOutcomes
  Deep Dive → On The Wire: proposal document prepared
    and sent via the document layer
  On The Wire → Closed: user manually confirms close
These thresholds are configurable per user in settings.
When a lead meets the threshold for its current stage,
a subtle advancement suggestion appears on the lead card.
The user still confirms all stage changes manually.

A notificationChannel field in user settings with
values: telegram, whatsapp, email, none. Default: none.
This controls where the morning briefing and hot signal
alerts are pushed. The content is identical regardless
of channel. Setup instructions appear in settings when
a channel other than none is selected. This is optional
and the system works fully without any push channel set.

The weekly learning loop triggers on Friday EOD
instead of a fixed Sunday night schedule. When the
user runs the EOD Summary on a Friday, the system
automatically also runs the weekly patterns analysis
and rewrites the active prompt. The n8n Sunday
schedule is removed and replaced with a day-of-week
check inside the Friday EOD flow.

---

### What Gets Extended in Existing Functions

These touch existing code but only add writes after
existing logic completes. Nothing existing changes.

The reply classifier gets two additional writes per
classification branch after all existing writes finish.
The lead's outreach outcome gets updated. The step
outcome map in sequence progress gets updated.

The step send function gets one additional write after
existing logic. Step status is set to sent. Draft for
that step is cleared.

The end-of-day summary gets one additional write after
AI generation completes. The daily output is appended
to the rolling daily reports array.

The log entry handler gets a keyword scanner added. When
a log entry is saved, keywords are checked and matching
signals are appended to the lead's signals array. This
is the highest-risk extension because it is the most
frequently called function in the app.

The weekly analysis prompt is extended to read call
outcome data from callOutcomes[] alongside email
metrics. Call activity — calls made, outcomes reached,
deal progression events — feeds the learning loop
equally with email reply rates. The active prompt
serializer also includes call activity in section two.

The snooze mechanism in comp_features.js is extended
to require a snoozeReason when snoozing. When the
snooze wakes up in the Today tab, the reason appears
on the lead card with context: "Snoozed: They said
call back in Q2 — 47 days ago."

---

### What Gets Built From Scratch

An active prompt serializer function in constants.js.
Reads current system state and produces the structured
string. Triggered by a five-second debounced effect.

A weekly report generator in services.js. Reads the
last seven daily reports, calls Claude, stores the
result. Manual trigger only.

Step status display UI in the sequences tab. Status
badge per enrolled contact per step. One-click override.

Draft persistence UI in the step accordion. Saves on
generate, restores on re-open, clears on send.

Storage size check utility. Warns at three megabytes,
alerts at four and a half megabytes.

The Campaigns sub-tab. Built last. Full orchestration
layer with campaign lifecycle management.

The backend API. Separate Express.js service on your Hetzner server
Cloud Always Free. Receives data from n8n. Serves it
to the CRM. CRM falls back to localStorage if
backend is unreachable.

ADDITIONAL NEW BUILDS — from feedback audit:

Stakeholder map panel in the deal room tab. Shows all
contacts at a lead with their role badges. Warns
visually when two contacts at the same company are in
active sequences simultaneously. Allows setting role
on any contact with one click.

Call outcome logging system. Three-layer architecture:
  Layer 1 — CaptureBar quick capture (PRIMARY): a
  post-call note button on every lead card uses the
  existing CaptureBar voice input. You speak for
  thirty seconds after a call, it transcribes and
  saves permanently to callOutcomes[] in your PCRM.
  This is the foundation layer. Data is owned by your
  system forever regardless of any third party.
  Layer 2 — Mac FaceTime sync: detects calls to known
  prospect phone numbers from the Mac call history
  database, creates a prompt in the PCRM asking for
  quick post-call notes via the CaptureBar.
  Layer 3 — Granola MCP (CONVENIENCE ENHANCEMENT):
  reads meeting transcripts from Granola after recorded
  calls and logs them automatically without manual
  action. Granola's 30-day retention limit is
  irrelevant because the data is captured into your
  PCRM immediately and stored permanently there.
  If Granola is unavailable or the plan expires,
  this layer stops working and nothing else breaks.

Deal progression outcome tracking. The outcome model
is extended beyond reply classification to track the
full cycle: call happened, meeting booked, proposal
discussed, deal advanced, deal closed. These feed the
weekly learning analysis so the system learns which
signals, contact roles, and opener patterns convert
across the full cycle not just to first reply.

Stage alias display layer. A small mapping shown in
the pipeline view and lead cards showing the
conventional BD label alongside the internal stage
name. Purely display-only. Underlying integers frozen.

Enrichment-to-deal-room connection. When a lead has
enrichment data from n8n, the deal room tab surfaces
it in a read-only Enrichment section alongside manual
documents. No duplication — one section is automatic,
one is manual. Both visible in the same place.

Configurable topic domain for Workflow 5. The viral
content scraper reads topic keywords from a settings
value rather than hardcoded Web3 strings. Set it
once in PCRM settings and all workflow runs use it.

---

## CRITICAL ARCHITECTURE FIXES

---

### Fix 1 — Campaigns Is the Only Automation Entry Point

All automated workflows start from Campaigns only. No
other tab triggers multi-step automation.

Campaigns is the orchestration layer. The only place
where research, enrichment, sequence generation, and
outreach execution begin.

Sequences is passive. Execution templates and enrolled
contact display only. No workflow triggering.

Compose is manual only. One-off messages and replies.
No automation of any kind.

Leads is data only. Pipeline management and editing.
No workflow triggering.

---

### Fix 2 — Deterministic Field-Level Merge Rules

When merging backend data with localStorage on CRM load,
these exact rules apply in every case.

Enrichment replaces the local value only if the backend
timestamp is newer. If local is newer or equal, keep
local.

Signals append only. Each incoming signal is checked
against existing signals by type, normalised value
(lowercase and trimmed), and a forty-eight hour window.
Duplicates within the window are skipped. New signals
are appended. The array is capped at fifty after pruning
signals older than thirty days.

Contacts merge by contact ID. New contacts are appended.
Existing contacts are updated only if the backend
timestamp is newer.

All outreach data including drafts, step status, and
sequence progress is never overwritten by the backend.
The CRM owns this entirely.

Pipeline stage, CRM status, notes, and deal room data
always use localStorage as the winner.

Leads that exist only in the backend are added to
localStorage as new leads.

Leads that exist only in localStorage remain unchanged.

---

### Fix 3 — Active Prompt Has a Fixed Structure

The active prompt is a structured string used only by
outreach AI generation. It contains six sections always
in the same order.

Section one is the pipeline snapshot. Count of leads
at each stage right now.

Section two is top signals from the last seven days.
Grouped by type, sorted by frequency. Only signals
within fourteen days are included here — older signals
are excluded from prompt generation even if still in
the array.

Section three is sequence performance. Current reply
rate, positive reply rate, and call booked rate across
all active sequences.

Section four is best-performing patterns. Derived from
the most recent weekly report.

Section five is current focus. Top five leads by urgency
score right now.

Section six is trend indicators. This section is only
included once the system has at least seven days of data.
It shows reply rate change versus the prior seven-day
period, call booked rate change, signal volume change,
and average time from first signal to reply. These must
be computed values expressed as readable statements, not
raw numbers.

Hard rules: two thousand character maximum total. Always
overwritten never appended. Five-second debounced update.
No raw logs or large text blobs. If trends section causes
the total to exceed two thousand characters, reduce
detail in other sections to fit — trends are always
included once enough data exists.

---

## CAMPAIGN ENTRY MODEL — DUAL SOURCE DEFINITION

---

### Purpose

This section defines how campaigns are created and where
leads come from. It resolves the ambiguity between using
existing leads and generating new ones through automated
search. Without this definition, the system risks
inconsistent entry points, unclear control flow, and
loss of visibility into which leads are being processed.

---

### Core Principle

Every campaign starts from an explicit intent, but all
execution always happens on explicit leads that exist
inside the CRM. No outreach or sequence execution may
occur on entities that are not first created and stored
as leads.

---

### Dual Entry Model

The campaigns system supports exactly two entry modes.
Both are initiated exclusively from the campaigns tab.
No other entry point exists.

Entry mode one is using existing leads. The user selects
leads that already exist in the CRM. Selection is done
manually or through filters such as pipeline stage,
score, signals, or recent activity. These leads are
passed directly into the campaign workflow starting at
the first enabled step, which is typically enrichment
or sequence generation.

This mode is used for pipeline acceleration, re-engagement
of known opportunities, and working with leads already
in the system.

Entry mode two is finding new leads. The user defines
a search intent instead of selecting existing leads.
This intent describes the type of companies to target
using criteria such as industry, geography, hiring
signals, funding stage, technology usage, or free-text
descriptions parsed by Claude. The campaign then begins
with a lead discovery phase executed by external
workflows outside the CRM. Those workflows identify
matching companies and create new lead entries inside
the CRM. These newly created leads are then enriched,
processed, and moved through the rest of the campaign
lifecycle.

This mode is used for top-of-funnel generation and
autonomous prospecting.

The campaign status remains in the discovery phase and
no sequence steps begin for any lead until that lead
has been fully materialised as a lead object inside
the CRM. Discovery and materialisation must complete
before enrichment begins. This is not implied — it is
enforced.

---

### Mandatory Lead Materialisation Rule

Regardless of entry mode, all leads must exist as full
lead objects inside the CRM before any enrichment,
sequence generation, or outreach execution begins.

The enforced flow for every campaign is: search or
selection, then lead creation in the CRM, then
enrichment, then sequence generation, then ready for
review, then launch.

At no point may outreach be executed directly on
externally discovered data without first creating and
storing a corresponding lead in the CRM. This rule
guarantees that every entity being contacted has a
persistent state, a history, and an audit trail inside
the system.

---

### Control and Visibility Guarantee

All leads processed within a campaign must be visible
in the CRM before outreach is launched. The user must
be able to inspect, validate, and understand which
companies and contacts are being targeted before
anything sends.

The system must never operate as a black box where
outreach is triggered without the user being able to
trace back to a specific lead object. If you cannot
find the lead in the CRM, outreach cannot be sent.

---

### Campaign-to-Lead Linkage

Every lead created or processed through a campaign must
carry a reference to the campaign that initiated it.
This linkage is stored on the lead object and is
permanent. It enables campaign performance analysis,
failure diagnosis, and outcome attribution to always
trace back to the originating campaign.

Without this linkage, debugging campaign performance
and diagnosing which campaign produced which outcomes
becomes unreliable.

---

### Failure Modes This Prevents

This model prevents three critical failure modes.

It prevents uncontrolled outreach by enforcing lead
visibility in the CRM before any sequence executes.

It prevents loss of traceability by ensuring every
contacted entity exists as a lead with a full history
and a campaign reference.

It prevents architectural drift by keeping all
automation strictly within the campaigns system and
prohibiting any other tab or workflow from initiating
outreach.

---

### Partial Discovery Handling

In entry mode two, discovery does not require all
requested leads to be found before execution can
proceed. The system operates on successfully materialised
leads only.

Each campaign tracks three counts during discovery: the
number of leads requested, the number successfully
materialised, and the number of failed discovery
attempts. A campaign may proceed to enrichment and
sequence generation once at least one lead has been
successfully materialised. Leads that fail discovery
are recorded with a failure reason and are not retried
automatically unless the user explicitly triggers a
retry.

Discovery is considered complete when either all
attempts have resolved, or when no new lead has been
successfully materialised for a continuous period
defined as the greater of ten minutes or three times
the average interval between successful materialisations
within the current campaign run.

This adaptive threshold ensures discovery does not
terminate prematurely when a data source is slow but
still actively returning results, while still preventing
indefinite waiting when no progress is being made.

The ten-minute floor applies until at least two
successful materialisations have occurred. With fewer
than two data points there is no meaningful average
interval to compute, so the fixed floor is used. Once
two or more leads have materialised, the adaptive
calculation takes over and the threshold adjusts to
reflect the actual pace of the data source being used.

Once discovery is complete by either condition, the
campaign advances to enrichment for all successfully
materialised leads. Failed leads remain in the failed
array and are retryable individually from the campaign
detail view.

This rule ensures campaigns remain productive even
when external data sources are incomplete or unreliable.

---

### Duplicate Prevention Rule

Before creating a new lead during discovery, the system
must check whether a lead with the same company identity
already exists in the CRM.

Matching follows a deterministic hierarchy. The primary
match is company domain. If no domain match is found,
the secondary match is normalised company name, meaning
lowercase and trimmed. If either match succeeds, the
existing lead is linked to the campaign and continues
through the workflow from its current state. Its
existing pipeline stage, history, signals, and sequence
progress are fully preserved. The campaign adopts the
lead as it is — nothing is reset.

No campaign may create a duplicate lead object under
any condition. This rule preserves data integrity,
sequence history, and signal accumulation across all
campaigns that touch the same lead over time.

---

### Campaign Ownership Rule

A lead may be associated with multiple campaigns over
time, but at any given moment only one campaign may
actively control its automated execution state.

When a campaign launches, it becomes the active campaign
for all leads it is processing. If another campaign
attempts to include a lead that is already active in
a running campaign, the system requires explicit user
confirmation before proceeding.

Confirmation happens at the campaign level, not the
lead level. When launching, the system checks all target
leads and surfaces a single conflict summary showing
how many leads are active in other campaigns and which
campaigns they belong to. The user makes one decision:
exclude all conflicting leads from this campaign, or
take execution control of all of them. Individual
lead-by-lead confirmation is not required, as this
would create a blocking experience at scale.

If the user confirms taking control, the system records
which campaign now has execution priority for those
leads. If the user declines, the conflicting leads are
excluded from the new campaign and noted as excluded
in the campaign detail view.

Once a campaign is completed or paused, it releases
execution control over its leads and those leads become
available for future campaigns.

This rule prevents conflicting automation, overlapping
outreach to the same contact from two simultaneous
campaigns, and inconsistent state transitions caused
by two campaigns advancing the same lead through
different paths at the same time.

---

### Validation Against Existing Rules

These three additions have been evaluated against the
existing system rules and are confirmed to be compatible.

Campaigns remain the only automation entry point. Both
partial discovery and ownership checks happen inside
the campaign flow and do not introduce any new trigger
points in other tabs.

The lead materialisation rule is never violated.
Duplicate prevention strengthens it by ensuring that
even discovered leads which match existing records go
through the same materialised lead object rather than
bypassing it.

Merge logic remains deterministic and unchanged. Linking
an existing lead to a campaign uses the existing lead
object and does not trigger any additional merge
operations beyond what the backend already performs.

No existing localStorage structures are modified. The
three new campaign tracking fields — requested count,
materialised count, failed count — are stored on the
campaign object which is new, not on any existing key.

No existing sequence execution logic is altered. The
ownership rule governs which campaign controls
automated execution state, but the actual sequence
send functions, markSent, and the Gmail flow are
completely unchanged.

---

### Final Rule

Campaigns define intent and orchestrate execution.
Leads define entities and hold state. The system must
never bypass leads, even when operating in fully
automated discovery mode. Discovery creates leads first.
Execution follows after.

---

## SEQUENCE STATE INTERACTION
### Deferred Specification with Safe Defaults

---

### Purpose

This section defines how campaign execution interacts
with existing sequence state on a lead. This is a known
edge case that introduces real complexity and is
intentionally not fully specified at this stage. A safe
default behaviour and a decision framework are defined
now. Advanced behaviours are deferred until real usage
patterns have been observed.

---

### Core Principle

A lead may already be enrolled in an active sequence
when a campaign attempts to take control. The system
must handle this deterministically and visibly. Under
no condition may a lead have two active sequences
executing in parallel at any time.

---

### Safe Default Behaviour

When a campaign takes control of a lead that is
currently in an active sequence, the existing sequence
is immediately paused. The system writes sequenceStatus
as paused, sequencePauseReason as campaign_override,
and sequencePausedAt as the current timestamp. No
further steps from the previous sequence may be sent
once the campaign has taken control.

The campaign then proceeds to generate and execute its
own sequence flow for that lead. This ensures there is
always exactly one active execution path per lead at
any moment.

---

### Preservation of State

The previous sequence is not deleted, reset, or
modified beyond being paused. All history, step
progress, drafts, and outcomes remain intact and
available for future analysis or resumption.

The campaign-generated sequence operates independently
and does not overwrite any previous sequence data.

---

### Visibility After Campaign Release

When a campaign completes or releases control of a
lead, the lead must surface in the UI with a visible
indicator that a previously paused sequence is waiting
for a decision. This indicator is not automatic
resumption — it is visibility only. It prevents leads
from sitting indefinitely in a state where nothing is
executing without the user being aware of it.

---

### Future Behaviour Options — Not Yet Implemented

The following behaviours are intentionally not locked
at this stage. They must be evaluated during the
campaign engine build based on real usage patterns
before any are implemented.

Continue means resuming the previous sequence from
where it was paused after the campaign completes.

Restart means restarting the original sequence from
step zero after the campaign completes.

Replace means permanently replacing the previous
sequence with the campaign sequence.

Merge means incorporating remaining steps from the
original sequence into the campaign sequence flow.

These four options introduce meaningful complexity.
None of them may be implemented until real execution
patterns have been observed and it is confirmed that
the chosen option does not introduce ambiguity or
conflicting execution paths.

---

### Campaign Completion Behaviour

When a campaign completes or releases control of a
lead, the system must not automatically resume any
previously paused sequence. Resumption, restart, or
replacement requires explicit user action or a clearly
defined rule introduced in a later phase. This prevents
unintended outreach from being triggered without the
user being aware of it.

---

### Validation Constraints

Any implementation of sequence interaction must respect
four rules without exception. Only one sequence may be
active per lead at any time. Existing sequence history
must never be overwritten. Campaign execution must
remain deterministic and traceable. No silent state
transitions may occur without being written to the
lead's event log.

---

### Implementation Timing

The safe default behaviour — pausing the existing
sequence when a campaign takes control — must be
implemented during the campaign engine build in
Session 6. The four advanced future behaviours must
only be added after observing real usage and confirming
they do not introduce ambiguity. They are not part of
the current build scope.

---

## FIVE HARDENING IMPROVEMENTS

---

### Improvement 1 — Signal Quality and Decay Model

Each signal now includes a strength field with three
possible values. Weak covers low-intent activity like
email opens and generic engagement. Medium covers reply
detection and direct engagement. Strong covers meeting
booked, explicit interest, and funding events.

Signal deduplication is updated from exact string match
to type plus normalised value (lowercase and trimmed)
within a forty-eight hour window. This prevents duplicate
signals from minor wording variations.

Signal decay rules are added. Signals older than fourteen
days are excluded from active prompt generation. Signals
older than thirty days are automatically pruned from the
signals array. Pruning happens before the fifty-entry
cap is enforced, so the cap always reflects current
relevant signals rather than old noise.

Without this model, the signals array accumulates noise
over time, the active prompt starts reflecting stale
reality, and AI decisions are based on outdated context.

---

### Improvement 2 — Active Prompt Trend Indicators

The active prompt gains a sixth section called trend
signals as described in Fix 3 above. This section is
critical because it gives Claude momentum information,
not just a static snapshot. A system where reply rates
are improving and signal volume is growing should
generate different outreach than one where both are
declining. Without trends, the AI always operates with
a snapshot but never understands direction.

---

### Improvement 3 — Campaign Lifecycle Definition

Each campaign has a strict set of fields and execution
rules that prevent ambiguity and enable safe retries.

The campaign fields are an ID, a name, a created
timestamp, a status of draft, running, paused, completed,
or failed, an array of target lead IDs, an array of
processed lead IDs, an array of failed lead IDs with
reasons, a last run timestamp, a batch size capped at
ten, and a current step showing research, enrichment,
sequence generation, ready for review, or launched.

Execution rules are strict. Campaigns run in batches of
maximum ten leads. After each batch, processed leads are
updated immediately. Failed leads are written to the
failed array with their reason. A campaign can be
resumed and will only process leads not yet in the
processed or failed array. A campaign is marked completed
only when every lead is either processed or failed.

A failed lead never stops the campaign. Failures are
visible in the UI and retryable per lead individually.
The campaign status only becomes failed if more than
fifty percent of leads fail.

Without this lifecycle model, there is no way to safely
retry a partially completed campaign, no way to know
exactly which leads were processed, and no way to
distinguish a campaign that is stuck from one that
completed.

---

### Improvement 4 — Idempotent Backend Writes

All writes from n8n to the backend must be idempotent.
This means the same write operation can be received
multiple times and will only be applied once.

Every request sent from n8n to the backend includes a
unique requestId generated once per operation. If the
same request is retried due to a network timeout or
n8n error, it reuses the same requestId rather than
generating a new one. The requestId must be stable
across retries — it is generated at the start of the
workflow execution and stored in that execution's
context.

The backend maintains a rolling log of processed
requestIds. When a request arrives, the backend checks
this log before processing. If the requestId has already
been processed, the request is acknowledged with a
success response but no data is changed. The rolling
log is kept in memory during a session and is sufficient
for the JSON file storage level of this system.

This rule applies to all payload types — enrichment
updates, signal writes, contact additions, and sequence
generation. Every write endpoint checks for duplicate
requestIds before executing.

Without this rule, n8n retries caused by network
timeouts or workflow errors create duplicate signals,
duplicate contacts, and inconsistent lead states with
no visible errors to indicate it happened. The system
appears to be working while the data is slowly becoming
corrupted.

---

### Improvement 5 — Per-Lead Sequential Write Processing

All backend writes that affect the same lead must be
processed sequentially in the order they are received.

The backend maintains a per-lead queue. When multiple
updates for the same lead arrive at the same time, they
are held in a first-in first-out queue for that lead
and executed one at a time. Each write completes fully
before the next one begins.

This queue is per-lead only. Updates affecting different
leads are not serialised against each other and can
process concurrently. The sequencing only applies within
a single lead.

The file-level mutex described elsewhere handles
protection of the leads.json file during each individual
write. The per-lead queue handles the ordering of those
writes when multiple updates arrive for the same lead
in quick succession.

These are two separate mechanisms with two separate jobs.
The mutex prevents file corruption. The queue ensures
deterministic ordering. Both are required.

Without the per-lead queue, concurrent updates from
the signal detector and the contact finder arriving for
the same lead at the same moment can interleave and
produce a non-deterministic result depending on which
write completes first. The data will appear valid but
will reflect only one of the two updates rather than
both applied in sequence.

---

## SEVEN CONFLICTS RESOLVED

Conflict one is backend versus localStorage as source
of truth. Resolved by Fix 2. localStorage stays primary
for all existing data. Backend is additive. Merge follows
the deterministic rules exactly.

Conflict two is Drive sync versus backend intake. The
existing Drive sync stays exactly as-is for backup and
restore. The backend is a separate intake path for n8n
data only. They never overlap.

Conflict three is outreach tab rename timing. Not renamed
until Campaigns sub-tab is fully built and tested. Tab
ID stays outreach in code forever. Display label changes
last.

Conflict four is model IDs scattered across files.
Centralised in constants.js before any new AI calls.
This is the first code change.

Conflict five is the five megabyte localStorage limit.
Signals capped at fifty after pruning. Daily reports
capped at seven. Weekly reports capped at four. Drafts
cleared on send. Size check utility added.

Conflict six is multiple automation entry points.
Resolved by Fix 1. Campaigns is the only trigger.

Conflict seven is inconsistent AI context. Resolved by
Fix 3. Active prompt has a fixed six-section structure
with a two thousand character cap.

---

## PART 2 — THE COMPLETE BUILD GUIDE

Every step below is numbered and labelled. Steps marked
SEND TO CLAUDE CODE contain the exact text to paste.
Steps marked DO THIS MANUALLY are done outside Claude Code.
Steps marked TEST BEFORE CONTINUING must be verified
before moving to the next step.

---

### SESSION 0 — CONTEXT AND PREPARATION

DO THIS MANUALLY — Read and understand this full document
before starting. Have your PCRM project open in your
editor. Have Claude Code ready.

---

SEND TO CLAUDE CODE — STEP 1 (Context Prompt)

Paste this as the very first message. Wait for Claude
Code to confirm it understood before sending anything else.

---

I have an existing CRM called PCRM that I built with you.

ARCHITECTURE: Browser-only React SPA. Babel runtime, no
build step. Ten source files totalling approximately five
hundred kilobytes. All state in localStorage. Optional
Google Drive backup. No server, no backend, no API exists.

TABS — frozen, never rename or reorder:
execution (Today) | leads (Leads) | accounts (Accounts) |
dealroom (Deal Room) | matrix (Matrix) |
outreach (Outreach) | activity (Activity)

PIPELINE STAGES — frozen, integers embedded in all scoring:
minus one Unstarted | zero Signal | one Echo | two Locked |
three Deep Dive | four On The Wire

FROZEN FUNCTIONS — never touch these:
computeUrgency, computeCompositeScore, calcScore,
calcDynamicScore, markSent, isStepReady, addContactToSeq,
handleSchedule, fillVars, startGoogleAuth, sendViaGmail,
all five ReplyClassifier classification paths

FROZEN LOCALSTORAGE KEYS — never delete or rename:
pcrm_v9_leads, pcrm_v9_sequences, pcrm_v9_reminders,
pcrm_v9_apikey, pcrm_v9_scheduled, pcrm_v9_templates,
pcrm_gtoken, pcrm_gtoken_time, pcrm_gclient_id,
pcrm_auth, pcrm_pw_hash, pcrm_top3_tomorrow,
and all other pcrm_v9_ prefixed keys currently in use

TERMINOLOGY:
Lead means a company in the pipeline.
Contact means a person at that company.
Sequence means a multi-step outreach plan per contact.
leadProgress means the per-contact state within a sequence.

WHAT WE ARE ADDING — additive only, nothing removed:
New fields on lead: enrichment object, signals array,
outreachOutcome object.
New fields on leadProgress: stepStatus map, stepOutcome
map, drafts map.
New localStorage keys: pcrm_v9_daily_reports,
pcrm_v9_weekly_reports, pcrm_v9_active_prompt.
Express.js backend API on your Hetzner server as a separate system.
CRM reads from backend on load with localStorage fallback.
Campaigns sub-tab in outreach tab built last.

THREE FIXED RULES that apply to everything:

Rule one — Campaigns is the only automation entry point.
All automated workflows start from Campaigns only. No
other tab triggers multi-step automation. Leads tab is
data only. Sequences tab is templates only. Compose tab
is manual only.

Rule two — Deterministic merge when backend data arrives.
Enrichment replaces local only if backend timestamp is
newer. Signals append only, deduplicated by type plus
normalised value within forty-eight hour window, pruned
after thirty days, capped at fifty. Contacts merge by
ID, updated only if backend is newer. Outreach data
including drafts and step status is never overwritten by
backend. Pipeline stage, CRM status, notes, deal room
always use localStorage as winner. Backend-only leads
are added. Local-only leads stay unchanged.

Rule three — Active prompt has a fixed structure with
six sections: pipeline snapshot, top signals last seven
days excluding signals older than fourteen days, sequence
performance, best-performing patterns from weekly report,
current focus top five leads by urgency, and trend
indicators once seven days of data exist. Maximum two
thousand characters. Always overwritten, never appended.
Five-second debounced update. No raw logs or large blobs.

Signals also include a strength field: weak, medium, or
strong. Signals older than fourteen days are excluded
from active prompt generation. Signals older than thirty
days are pruned from the signals array before cap
enforcement.

GENERAL RULES:
Every change is additive. Nothing existing is removed.
Existing fields, functions, and keys are never renamed.
New code handles missing new fields as null or empty.
v8 migration in app.js adds new fields to existing leads.
Backend is separate — CRM falls back to localStorage
if backend is unreachable.
The outreach tab is not renamed until Campaigns is done.

Confirm you have read and understood all of this before
I give you any instructions.

---

TEST BEFORE CONTINUING — Claude Code must explicitly
confirm it understands before you send Step 2.

---

### SESSION 1 — ZERO RISK FOUNDATIONS

These four changes touch nothing existing. Do them all
in one session in the order listed.

---

SEND TO CLAUDE CODE — STEP 2 (Centralise Model IDs)

In constants.js, add two named constants at the top of
the file for the Claude model IDs currently hardcoded
in tab_outreach.js, services.js, and comp_ai.js.

The constant for the Haiku model should be named
CLAUDE_HAIKU and hold the current Haiku model string.
The constant for the Sonnet model should be named
CLAUDE_SONNET and hold the current Sonnet model string.

Then replace every hardcoded model string in
tab_outreach.js, services.js, and comp_ai.js with the
appropriate constant.

Do not change any other code. Do not change any prompts.
Do not change any logic. This is a string replacement only.
Confirm when done and show me the two constant definitions.

---

SEND TO CLAUDE CODE — STEP 3 (Storage Size Utility)

In constants.js, add a new function called checkStorageSize
that reads the pcrm_v9_leads and pcrm_v9_sequences keys
from localStorage, adds their character lengths together,
and takes the following actions based on the total.

If the total exceeds three million characters, log a
warning to the console saying storage is above three
megabytes and listing the size of each key.

If the total exceeds four million five hundred thousand
characters, show an alert to the user saying storage is
approaching the limit and they should export their data.

Call this function in app.js on app load and after any
write to pcrm_v9_leads or pcrm_v9_sequences.

Do not change any existing code. This is a new function
and two new call sites only.

---

SEND TO CLAUDE CODE — STEP 4 (Active Prompt Serializer)

In constants.js, add a new function called
serializeActivePrompt that takes the current leads array
and sequences object as parameters.

The function must produce a string of maximum two
thousand characters containing six sections in this
exact order.

Section one: count of leads at each pipeline stage
right now.

Section two: the most frequent signal types detected
across all leads in the last seven days. Only include
signals where detectedAt is within the last seven days.
Group by type and sort by frequency descending.

Section three: sequence performance across all active
sequences. Calculate the overall reply rate, positive
reply rate, and call booked rate from stepOutcome values
in leadProgress.

Section four: best-performing patterns. If
pcrm_v9_weekly_reports has at least one entry, extract
the best opener pattern and best signal type from the
most recent report. Otherwise write not enough data yet.

Section five: top five leads by urgency score from the
current leads array sorted descending.

Section six: trend indicators. Only include this section
if pcrm_v9_daily_reports has at least seven entries.
Compare reply rate and signal volume between the last
seven days and the seven days before that. Express each
as a readable sentence such as reply rate increased by
eighteen percent in the last seven days. If total
length exceeds two thousand characters, shorten sections
one through five to fit but always include section six
once data exists.

Store the result to pcrm_v9_active_prompt in localStorage.

Do not trigger this function yet. Just define it.

---

SEND TO CLAUDE CODE — STEP 5 (New localStorage Keys)

In app.js, add persistence for three new localStorage
keys following the exact same pattern used for all
existing keys.

Add pcrm_v9_daily_reports as a state variable initialised
by reading from localStorage, defaulting to an empty
array. Add a useEffect that writes it to localStorage
when it changes, with the key name pcrm_v9_daily_reports.

Add pcrm_v9_weekly_reports the same way, also an empty
array by default.

Add pcrm_v9_active_prompt the same way, defaulting to
an empty string.

Also add a useEffect that calls serializeActivePrompt
with the current leads and sequences whenever leads
changes. Debounce this effect by five seconds so it
does not run on every keystroke.

Do not change any existing useEffect or state. Only add.

---

TEST BEFORE CONTINUING — Open the PCRM in your browser.
Open DevTools. Confirm pcrm_v9_daily_reports,
pcrm_v9_weekly_reports, and pcrm_v9_active_prompt all
appear in localStorage after a few seconds. Confirm no
existing functionality is broken. Confirm the app loads
and all tabs work exactly as before.

---

### SESSION 2 — DATA MODEL

---

SEND TO CLAUDE CODE — STEP 6 (Lead Factory Defaults)

In constants.js, in the makeLead function, add these
new fields to the object it returns.

Add enrichment with a default value of null.
Add signals with a default value of an empty array.
Add outreachOutcome with a default value of null.
Add callOutcomes with a default value of an empty array.
Add snoozedUntil with a default value of null.
Add snoozeReason with a default value of null.

Also add a STAGE_ALIASES constant object in constants.js
mapping each pipeline stage integer to a conventional
BD label:
  0: 'Qualified'
  1: 'Engaged'
  2: 'Committed'
  3: 'Proposal'
  4: 'Verbal / Closing'

This alias map is display-only. The underlying integer
pipeline values never change and must not be touched.

Also update the makeContact function to add a role field
with a default value of the string 'unknown'.
Allowed values: champion, economic_buyer, blocker,
influencer, neutral, unknown.

Do not change any existing fields. Do not change any
existing function signatures or logic.

---

SEND TO CLAUDE CODE — STEP 7 (v8 Migration)

In app.js, following the exact same pattern as the
existing v5, v6, and v7 migration blocks, add a new
v8 migration block.

The v8 migration should run once on app load if it has
not run before. It should loop through all leads and:
  - Add enrichment: null if missing
  - Add signals: [] if missing
  - Add outreachOutcome: null if missing
  - Add callOutcomes: [] if missing
  - Add snoozedUntil: null if missing
  - Add snoozeReason: null if missing

Loop through all contacts in every lead and:
  - Add role: 'unknown' if missing

After migrating, save and mark v8 done using the
existing migration flag pattern.

Do not change any existing migration blocks.

---

TEST BEFORE CONTINUING — Open the PCRM. Open a lead.
Confirm all six new lead fields exist. Open a contact
and confirm the role field exists. Confirm all existing
fields are intact. Export your data as a backup.

---

### SESSION 3 — LOGIC EXTENSIONS

These steps touch existing functions. Do one at a time
and test after each.

---

SEND TO CLAUDE CODE — STEP 8 (Extend markSent)

In tab_outreach.js, find the markSent function. After
all existing logic in the function completes, add two
things.

First, write the sent status to the step status map. In
the leadProgress object for the contact being processed,
if stepStatus does not exist yet set it to an empty
object. Then set stepStatus at the current step index
to the string sent.

Second, if the drafts map exists in the leadProgress
object and has an entry for the current step index,
delete that entry to free up localStorage space.

Do not change any existing logic in markSent. These
two writes happen after everything else completes.

---

TEST BEFORE CONTINUING — Send a test step in a sequence.
Verify the step advances correctly as before. Open
localStorage and verify stepStatus shows sent for that
step index. Verify the app functions exactly as before.

---

SEND TO CLAUDE CODE — STEP 9 (Extend ReplyClassifier)

In comp_ai.js, find the ReplyClassifier component. For
each of the five classification paths, after all existing
writes complete, add two additional writes.

The first write updates the lead's outreachOutcome field.
Set it to an object with a status field containing the
outcome code for that classification, a lastOutcomeAt
field containing the current ISO timestamp, and a
lastMessageAt field containing the lead's
sequencePausedAt value if it exists.

Use these outcome codes: positive classification maps
to replied_positive. Future and objection and no all
map to no_reply. Noreply maps to no_reply.

The second write updates the stepOutcome map in the
active leadProgress. Find the leadProgress for the lead
being classified. If stepOutcome does not exist set it
to an empty object. Set stepOutcome at the current step
index to the same outcome code.

Do not change any of the five existing classification
paths. Do not change the modal UI. Do not change any
existing writes. These two writes happen after everything
else in each branch.

---

TEST BEFORE CONTINUING — Trigger the reply classifier
on a test lead. Verify the existing classification
behaviour is identical. Verify the outreachOutcome field
on the lead is updated correctly. Verify stepOutcome is
set in the sequence progress.

---

SEND TO CLAUDE CODE — STEP 9B (BD Reply Classifier)

The existing reply classifier uses five sales-oriented
categories. BD conversations produce different reply
types that do not map cleanly to these categories.
Misclassification corrupts the learning data over time.

Add a second classification layer to the ReplyClassifier
modal that runs alongside the existing five-path model.
Do not remove or change the existing five paths. Add a
BD context field below the existing buttons.

The BD context field is a single-select with these values:
  exploring_fit — they are interested but assessing
  wants_intro_call — explicit request for a call
  conflicting_arrangement — already have something similar
  interested_specific_aspect — only part of the offer
    resonates, note which aspect
  passed_to_team — forwarded to partnerships, commercial,
    or BD team internally
  warm_needs_alignment — positive but needs internal
    buy-in before proceeding
  relationship_building — no immediate deal but wants
    to stay connected
  no_bd_context — does not fit any BD category above

Default value is no_bd_context. The field is optional —
the existing five-path classification still completes
normally regardless of BD context selection.

When a BD context value other than no_bd_context is
selected, write it to lead.outreachOutcome.bdContext.
This field feeds the weekly learning analysis separately
from the main reply classification.

The weekly report generator should read bdContext values
and report on which BD context types most frequently
precede deal progression events.

Do not change any existing reply classifier logic.
This is additive only.

---

TEST BEFORE CONTINUING — Trigger the reply classifier.
Verify the existing five paths work exactly as before.
Verify the BD context selector appears below. Select
a BD context and verify it writes to outreachOutcome.

---


In comp_ai.js, find the EODSummary component. Find where
the AI generation completes and the top three is saved
to pcrm_top3_tomorrow. Immediately after that save,
add one new write.

Read the current pcrm_v9_daily_reports array from
the state variable added in Step 5. Create a new entry
object containing today's date as an ISO string, the
full AI output text, and the top three array. Push this
entry to the daily reports array. If the array now has
more than seven entries, slice it to keep only the last
seven. Save the updated array back to the daily reports
state variable.

Do not change the AI generation. Do not change the top
three save. Do not change the EOD UI or download button.

---

SEND TO CLAUDE CODE — STEP 11 (Signal Detection in Log Handler)

In app.js, find the handleAddLogEntry function. After
the existing log entry is created and saved, add a signal
detection pass.

Define a signal keyword map with the following entries.
The word replied maps to signal type reply_received
with strength medium. The word opened maps to
email_opened with strength weak. The word meeting maps
to meeting_scheduled with strength strong. The word
interested maps to positive_intent with strength medium.
The word funding maps to funding_signal with strength
strong. The word hired or hiring maps to hiring_signal
with strength medium. The word booked maps to
call_booked with strength strong.

Check the log entry content in lowercase against each
keyword. If a match is found, create a signal object
with the type, the matched value, the strength, the
current ISO timestamp as detectedAt, and the source
string manual.

Before appending the new signal, check the lead's
existing signals array for an entry with the same type
and normalised value within the last forty-eight hours.
If a duplicate exists within that window, skip it.

If no duplicate exists, append the new signal. Then
prune any signals with a detectedAt older than thirty
days. Then if the array exceeds fifty entries, keep
only the fifty most recent.

Do not change any existing logic in handleAddLogEntry.
This detection pass runs after all existing code.

---

TEST BEFORE CONTINUING — Add a log entry on a test lead
containing the word replied. Verify the log entry is
created exactly as before. Verify a new signal appears
in the lead's signals array with the correct type and
strength. Add the same entry again immediately and verify
the signal is not duplicated. Verify all existing app
functionality is intact.

---

### SESSION 4 — NEW UI

---

SEND TO CLAUDE CODE — STEP 12 (Draft Persistence)

In tab_outreach.js, in the sequence step accordion
where AI draft generation happens, make the following
changes.

When AI generates a draft for a step, immediately after
generation save it to the leadProgress drafts map. In
the leadProgress for the active contact, if drafts does
not exist set it to an empty object. Set drafts at the
current step index to an object containing the subject,
the body, the current ISO timestamp as generatedAt, and
approved set to false.

When the step accordion opens for a step that already
has a draft in the drafts map, populate the subject and
body fields with the saved draft and show a label
indicating this is a saved draft from its generatedAt
timestamp.

Change the send flow so there are two distinct actions:
Generate Draft and Approve and Send. Generate Draft saves
to the drafts map. Approve and Send requires a draft to
exist, shows a confirmation, then calls the existing send
logic and clears the draft.

Do not change the existing send logic. Do not change
markSent. Only add the draft save, restore, and the
two-step UI flow.

---

SEND TO CLAUDE CODE — STEP 13 (Step Status Badges)

In tab_outreach.js, in the prospects view that shows
enrolled contacts for a sequence, add a step status
badge next to each contact's current step indicator.

The badge reads the stepStatus map from that contact's
leadProgress for the current step index. If the field
is missing or the step has not been reached yet, show
new. Otherwise show the stored value.

Show these as small coloured labels. New is grey.
Drafted is blue. Sent is dark grey. Replied is green.
Booked is purple.

Also add a one-click manual override. Clicking the badge
opens a small dropdown with the five status options.
Selecting one writes the chosen value to
stepStatus at that step index in leadProgress and saves
to pcrm_v9_sequences. Label this section clearly as
Step Status to distinguish it from pipeline stage and
lead CRM status.

Do not change any existing prospects view layout.
Do not change any existing send logic. This is display
and a manual override only.

---

SEND TO CLAUDE CODE — STEP 14 (Weekly Report Generator)

In services.js, add a new function called
generateWeeklyReport that takes the daily reports array
and the Anthropic API key as parameters.

The function reads the last seven entries from the daily
reports array. It calls the Claude Sonnet model using
the same fetch pattern used by existing AI functions in
the file. The prompt asks Claude to analyse the seven
daily summaries and return a structured weekly insight
with these fields: what is working best right now in
both email and calls, what is not working, the best
signal type by conversion, the best opener pattern
observed, the best contact role by full-cycle conversion
not just first reply, and average time from first signal
to deal progression event.

Store the result as an object with a generatedAt
timestamp and all insight fields.

In comp_ai.js or tab_other.js, add a Generate Weekly
Report button near the EOD Summary. When clicked, it
calls generateWeeklyReport, pushes the result to
pcrm_v9_weekly_reports sliced to last four, saves.

Show the most recent weekly report below the button.

---

SEND TO CLAUDE CODE — STEP 14A (Stage Alias Display)

In tab_leads.js, in every place where a pipeline stage
name is displayed — lead cards, the pipeline table,
the deep panel header — add a small secondary label
showing the conventional BD alias from STAGE_ALIASES.

Display as: "Signal · Qualified" or "Deep Dive · Proposal"
The internal name comes first, the alias second in
smaller or muted text.

Do not change any stage logic, any colours, or any
existing pipeline functionality. This is display-only.

---

SEND TO CLAUDE CODE — STEP 14B (Stakeholder Map Panel)

In the deal room tab for each lead, add a Stakeholders
section above the existing document list.

Show all contacts from the lead's contacts[] array.
Each contact shows: name, role badge (champion,
economic_buyer, blocker, influencer, neutral, unknown),
and their current sequence step status if enrolled.

Add a one-click role selector on each contact card.
Selecting a role writes it to contact.role and saves
to pcrm_v9_leads.

Add a warning banner at the top of the stakeholders
section if two or more contacts at this lead are
currently enrolled in active sequences simultaneously.
The banner reads: "Multiple contacts in active sequences
— ensure messaging is coordinated."

Do not change any existing deal room functionality.
This section is additive only.

---

SEND TO CLAUDE CODE — STEP 14C (Context-Aware Snooze)

Find the snooze mechanism in comp_features.js.

When a user snoozes a lead, require them to type a
snooze reason before the snooze is confirmed. The
reason field should have example placeholder text:
"They said call back in Q2" or "Waiting for budget
decision in March." The field is required — snooze
cannot be confirmed without it.

When the snooze wakes up and the lead surfaces in the
Today tab execution queue, display the snooze reason
prominently on the lead card alongside how long ago
the snooze was set: "Snoozed 47 days ago: They said
call back in Q2."

Do not change any existing snooze timing logic. Only
add the reason field and the wake-up display.

---

SEND TO CLAUDE CODE — STEP 14D (Deal Progression Outcomes)

Extend the outcome model in the PCRM.

Add a dealProgression field to lead.outreachOutcome
with these possible values:
  not_tracked, call_happened, meeting_booked,
  proposal_discussed, deal_advanced, deal_closed,
  relationship_maintained

Add a deal progression selector to the ReplyClassifier
modal. After the existing five classification buttons,
add a second row labelled "Deal Progression" with
buttons for the values above. Default is not_tracked.

When a classification is submitted, write the selected
deal progression value to lead.outreachOutcome.dealProgression.

Also add a manual deal progression selector to each
lead card in the Today tab. A small dropdown that lets
you update the deal progression at any time without
going through the reply classifier.

Do not change any existing ReplyClassifier logic.
These additions happen after all existing code.

---

TEST BEFORE CONTINUING — Generate an EOD summary a few
times. Verify pcrm_v9_daily_reports accumulates entries.
Click Generate Weekly Report. Verify it calls Claude
and stores a result. Verify the active prompt now
includes a best-performing patterns section.
Test the stage alias display on a lead card.
Test setting a role on a contact in the deal room.
Test snoozing a lead — confirm reason is required.
Test the deal progression selector in ReplyClassifier.

---

### SESSION 4.5 — GMAIL MCP SETUP

This session makes zero changes to your PCRM code.
It is a Claude Code configuration step and three manual
actions. It sits here deliberately — after your PCRM
code is stable and before the backend build — so that
Session 5 and Session 6 both benefit from full Gmail
read and thread control being active.

---

DO THIS MANUALLY — STEP 14.5A (Switch to Permanent Email)

Open your PCRM. Go to settings. Click connect Gmail.
Log in with the email address you intend to use for
real BD work long-term. The new OAuth token overwrites
the old one in pcrm_gtoken automatically. Send a test
email to yourself to confirm the correct address is now
sending. If your work email runs on Google Workspace,
the OAuth flow is identical to personal Gmail — no
extra steps. If your company uses Outlook, skip this
step for now and revisit after joining. It is a
one-session Claude Code update at that point.

---

DO THIS MANUALLY — STEP 14.5B (Create BD Replies Label)

Open Gmail. Create a new label called BD Replies.
Find any existing email threads where you have sent
outreach to prospects. Apply the BD Replies label to
each of those threads. This is the only label Claude
will ever watch. Any email thread without this label
is completely invisible to the automation. Going
forward, every outreach email sent through your PCRM
and campaigns will have this label applied automatically.

---

DO THIS MANUALLY — STEP 14.5C (Install Gmail MCP)

Why option 1 and not a managed service: your prospect
emails contain sensitive BD conversations and deal
information. Option 1 is self-hosted and open source.
Your data never leaves your machine or your Google
account. Managed services route your emails through
their servers. For confidential BD work option 1 is
the right choice.

Run this in your terminal to authenticate:
npx @gongrzhe/server-gmail-autoauth-mcp auth

A browser window opens. Log in with your BD email.
Approve the Gmail permissions. Credentials are saved
to a folder called .gmail-mcp in your home directory.

Then add the MCP server to Claude Code using the
command shown after authentication completes. It will
look like: claude mcp add gmail-local followed by
the server configuration details.

Restart Claude Code after adding the server.

---

SEND TO CLAUDE CODE — STEP 14.5D (Smart Inbox Filter)

Build an inbox monitoring function that uses Gmail MCP
to check for prospect replies.

The function must apply three filter layers simultaneously.
Only read emails from sender addresses that exist in
the contacts arrays of leads stored in pcrm_v9_leads.
Only search within the Gmail label called BD Replies.
Only return emails that are replies to threads
containing a message previously sent from this account.

When a matching email is found, identify which lead it
belongs to by matching the sender address against
contact email fields in pcrm_v9_leads. Associate the
reply with that lead. Feed it automatically to the
ReplyClassifier flow.

Run this check on a schedule — every thirty minutes
during working hours is sufficient. Never read any
email that does not pass all three filter layers.
Never surface personal emails under any condition.

Store the last checked timestamp so each run only
looks at emails received since the previous check.

When complete, run one manual check and show me what
it found, which leads matched, and confirm no personal
emails were surfaced.

---

TEST BEFORE CONTINUING — Ask Claude Code to run one
manual inbox check. Verify it only finds emails from
CRM contact addresses inside the BD Replies label.
Verify no personal emails appear. If a matched reply
exists verify it is associated with the correct lead.
Confirm the ReplyClassifier receives it correctly.

---

DO THIS MANUALLY — STEP 14.5E (Install Granola MCP)

Granola is your meeting recorder. Every call it joins
gets transcribed and summarised. The Granola MCP
connects those transcripts directly to Claude Code
so call outcomes flow into your PCRM automatically.

First ensure Granola is installed and you have at least
the Basic free plan. The free plan gives 30 days of
history without transcripts. Business plan at
$14/user/month unlocks full history and transcripts.
Transcripts are what make automatic outcome extraction
work well — worth upgrading when you are ready.

Connect Granola MCP to Claude Code:
Go to granola.ai and open Settings then Integrations.
Find the MCP section and follow the authentication flow.
This uses OAuth — you approve access once and it is done.

The MCP endpoint is: https://mcp.granola.ai/mcp

Add to Claude Code:
  claude mcp add --transport http granola https://mcp.granola.ai/mcp

Restart Claude Code after adding.

What this unlocks:
Claude Code can now query your meeting notes by date,
by participant name, or by company. After a call with
a prospect, Claude can read the Granola transcript,
extract what was discussed and agreed, match it to
the correct lead in your PCRM, and log a structured
call outcome to that lead's callOutcomes[] array.

---

SEND TO CLAUDE CODE — STEP 14.5F (Call Outcome Integration)

Build the call outcome logging system for my PCRM.
It has three layers. Layer 1 is the primary data owner.
Layers 2 and 3 reduce friction around it.

LAYER 1 — CAPTUREBAR QUICK CAPTURE (PRIMARY LAYER):
Add a phone icon button to every lead card in the
Leads tab and Today tab.
Clicking it opens a compact panel pre-filled with:
  - Contact selector (contacts at this lead)
  - Duration field (minutes)
  - Deal progression dropdown
  - Notes field with voice input using the existing
    CaptureBar microphone functionality

When submitted, immediately append to lead.callOutcomes[]:
  { timestamp, contactName, duration, source: 'manual',
    summary: the transcribed and typed notes combined,
    dealProgression: selected value }
Add a log entry with category 'call'.
Update lead.outreachOutcome.status if deal progression
is call_happened, meeting_booked, proposal_discussed,
deal_advanced, or deal_closed.

This layer owns the data permanently in pcrm_v9_leads.
No third party retention limit applies. Data lives
here forever regardless of what other tools do.

Do not change any existing CaptureBar or log entry logic.

LAYER 2 — MAC FACETIME SYNC DETECTION:
On Mac, the FaceTime call history syncs from iPhone
via iCloud and is stored at:
~/Library/Application Support/CallHistoryDB/CallHistory.storedata
This is a SQLite database.

Read this database on PCRM load via the backend.
Look for calls to phone numbers matching any contact
in pcrm_v9_leads contacts[].phone.
For any match in the last 48 hours not already logged:
  - Show a notification in the PCRM:
    "Recent call with [contact] at [lead] — add notes?"
  - Clicking opens the Layer 1 CaptureBar capture panel
    pre-filled with contact name and detected duration

This requires Full Disk Access permission on Mac.
Add a prompt for this permission in settings.

LAYER 3 — GRANOLA AUTO-LOGGING (CONVENIENCE LAYER):
After every call, check Granola for new meeting notes
from the last 24 hours using the Granola MCP.
For each new meeting, look for participant names or
company names that match leads in pcrm_v9_leads.
If a match is found:
  - Call Claude API to read the transcript summary
    and extract: what was discussed, commitments made,
    the deal progression outcome, and a one paragraph
    summary
  - Append to lead.callOutcomes[] with:
    { timestamp, contactName, duration, source: 'granola',
      summary: extracted summary,
      dealProgression: extracted outcome,
      meetingId: granola meeting id }
  - Add a log entry with category 'call'
  - Update lead.outreachOutcome.status if progression
    value warrants it

Granola's 30-day retention limit does not matter here.
The data is captured into pcrm_v9_leads immediately
and stored permanently in your system. If Granola is
unavailable, this layer simply does not run. Layer 1
and Layer 2 continue working independently.

Run the Granola check on PCRM load and every 2 hours.
Show a small notification badge when auto-logged.

Do not change any existing log entry or CaptureBar logic.
All three layers are additive only.

---

TEST BEFORE CONTINUING — Test the CaptureBar call
capture button on a lead card. Speak a note and verify
it transcribes and saves to callOutcomes[]. Verify the
log entry is created with category call. If Granola
is connected, have a test recorded call and verify the
outcome appears automatically in callOutcomes[].

---

NOTE — GRANOLA AUTO-SYNC REQUIRES MAC SETUP

The Granola Layer 3 auto-sync cannot run in the browser
directly. The browser has no access to local MCP servers
or the Granola SQLite database at:
~/Library/Application Support/granola/db.sqlite

When you are on your Mac, complete this additional step:

DO THIS ON MAC — STEP 14.5G (Granola Local Bridge)

Create a small Node.js script called granola_bridge.js
in your project folder. This script reads the Granola
SQLite database directly and exposes a local endpoint
at http://localhost:3001/granola/recent that the PCRM
polls every 15 minutes.

Tell Claude Code:
"Build a granola_bridge.js Node script for Mac. It reads
the Granola SQLite database at
~/Library/Application Support/granola/db.sqlite and
exposes a GET endpoint at localhost:3001/granola/recent
returning the last 10 meetings as JSON with title,
participants, summary, and date. Add CORS headers so
the browser can fetch it. The PCRM should poll this
endpoint every 15 minutes when available, fall back
gracefully if the bridge is not running, and show a
small notice in the Granola import panel saying
'Auto-sync available — run granola_bridge.js to enable'
when the bridge is not detected."

Run the bridge on Mac with: node granola_bridge.js
It runs in the background while you work.

---

### SESSION 5 — BACKEND BUILD

These steps are done outside the PCRM codebase in a
new folder. Risk to existing CRM is zero.

---

DO THIS MANUALLY — Create a new folder called backend
next to your existing PCRM project files. This is where
the Express.js API will live. It is a completely separate
service.

---

SEND TO CLAUDE CODE — STEP 15 (Build Backend API)

Create a new Express.js backend in the folder called
backend. This is a completely separate system from the
PCRM. It runs independently on your Hetzner server.

Read the full backend specification from the Master
Playbook Phase 1 Step 2. Build exactly what is specified
there including all ten architecture rules, the extended
lead status model, the per-lead event log, all endpoints,
the dataStore.js module, the updateQueue.js FIFO queue,
the async-mutex for file safety, the idempotency using
requestId, and the updates.log append-only log.

The campaign endpoints must also be included. A campaign
has the fields id, name, createdAt, status of draft,
running, paused, completed, or failed, targetLeads array,
processedLeads array, failedLeads array with reasons,
lastRunAt timestamp, batchSize defaulting to ten, and
step showing the current phase.

Campaign execution rules: runs in batches of maximum
ten. After each batch processedLeads updates immediately.
Failed leads go to failedLeads with reason. Campaign
resumes from where it left off. Campaign is completed
only when all leads are processed or failed. Campaign
status becomes failed only if more than fifty percent
of leads fail.

When done, show me the folder structure and confirm
every endpoint is in place.

---

DO THIS MANUALLY — Deploy the backend to your Hetzner server.

Your Hetzner server is already running from the Server
Setup Guide you completed before starting the build.
n8n is already installed and running on it.
Now you deploy the backend API alongside it.

YOUR SERVER IP is the IP address you saved during
server setup. It looks like 65.21.xxx.xxx.

STEP A — Copy your backend to the server:
On your Mac, run this from your project folder:
  scp -r ./backend root@YOUR_SERVER_IP:/home/pcrm/backend

STEP B — Install and start the backend:
SSH into your server:
  ssh root@YOUR_SERVER_IP
Then run:
  cd /home/pcrm/backend
  npm install
  pm2 start index.js --name pcrm-backend
  pm2 save

STEP C — Verify it is running:
  pm2 status
You should see both pcrm-backend and n8n listed
with status online.

YOUR BACKEND URL IS:
  http://YOUR_SERVER_IP:3000

Save this URL. Every n8n workflow and the CRM uses it.
Your n8n URL is:
  http://YOUR_SERVER_IP:5678

Both services restart automatically if the server reboots.
Both run at the fixed monthly cost of your Hetzner server.

---

TEST BEFORE CONTINUING — Using a tool like Postman or
curl, send a test POST to http://YOUR_SERVER_IP:3000 at the
api/leads endpoint with a minimal valid payload. Confirm
it returns a leadId. Confirm leads.json is created with
the entry. Confirm the updates.log has the write logged.

---

SEND TO CLAUDE CODE — STEP 16 (Connect CRM to Backend)

In app.js, update the app load sequence to fetch leads
from the backend in addition to reading from localStorage.

Follow the exact merge rules defined in this document.
On load, fetch from the backend URL stored in a new
environment variable. If the fetch succeeds, merge the
backend leads with localStorage leads using these rules:
enrichment replaces if backend timestamp is newer.
Signals append only, deduplicate by type and normalised
value within forty-eight hours, prune signals older than
thirty days, cap at fifty. Contacts merge by ID. Outreach
data including drafts and step status is never overwritten
by backend. Pipeline stage, CRM status, notes, deal room
always use localStorage. Backend-only leads are added.
Local-only leads stay unchanged.

If the backend is unreachable, show a small offline badge
in the header and continue with localStorage data only.
Do not block the render. Do not show an error modal.

Add a manual refresh button that re-runs the same fetch
and merge. Add a silent auto-refresh every ninety seconds
that runs the same fetch and merge without showing any
loading indicator, but only if no unsaved edits are open.

Do not change the existing load sequence for other data.
Do not change any existing useEffect. This is an addition
to the load flow only.

---

TEST BEFORE CONTINUING — Open the PCRM. Verify it loads
as before. Verify the offline badge does not appear when
the backend is running. Disconnect from the internet and
reload. Verify the PCRM loads from localStorage with the
offline badge showing. Verify all existing functionality
works in offline mode.

---

### SESSION 6 — GTM ENGINE TAB

These steps are done last. Everything above must be
working before starting this session.

---

SEND TO CLAUDE CODE — STEP 17 (Add Campaigns Sub-Tab)

In tab_outreach.js, add a third sub-tab called Campaigns
to the existing Sequences and Compose sub-tabs.

Build the Campaigns sub-tab exactly as specified in
Master Playbook Phase 7. This includes the campaigns
list view with campaign cards, the campaign creator with
four steps, the criteria parsing using inline Claude API
calls, the campaign detail view with the leads table and
contact rows, the approve and launch flow, and the
campaign status badges showing the full lifecycle from
draft through completed.

Campaign status must follow the lifecycle model defined
in this document: draft, running, paused, completed,
failed. The step field tracks research, enrichment,
sequence generation, ready for review, and launched.

Campaign cards show the current status with appropriate
colour coding. The primary action button changes based
on the current status. Draft shows Start Research.
Running shows View Progress. Ready for review shows
Approve and Launch in a highlighted style. Live shows
View Live. Completed shows View Results.

The campaign creator uses Claude API inline to parse
free-text target descriptions into structured criteria.
Show the parsed result for confirmation before saving.

Do not change the Sequences sub-tab. Do not change the
Compose sub-tab. Do not change any existing outreach
logic. The Campaigns sub-tab is purely additive.

---

TEST BEFORE CONTINUING — Create a test campaign with
free-text criteria. Verify Claude parses it correctly.
Verify the campaign saves with status draft. Verify
the existing Sequences and Compose tabs still work
exactly as before.

---

SEND TO CLAUDE CODE — STEP 18 (Build n8n Intelligence Workflow)

In n8n, build the Intelligence Campaign Workflow as
specified in Master Playbook Phase 7 under the n8n
Intelligence Campaign Workflow section.

This workflow is triggered by a webhook from the CRM
when a campaign starts research. It takes the campaignId
and parsed criteria. It searches Apollo for matching
leads, validates with Serper, scores each lead with
Claude, and for qualifying leads posts to the backend
api/leads endpoint. It then triggers contact finding
and sequence building per lead. It updates the campaign
status through each phase. It ends by posting
ready_for_review status and sending a Gmail notification.

Every POST to the backend must include requestId as a
new uuid, updatedAt as the current timestamp, source as
n8n, and the correct payloadType.

---

SEND TO CLAUDE CODE — STEP 19 (Rename Tab Display Name)

This is the very last change in the entire build.

In app.js, find where the outreach tab display name is
defined. Change the display label from Outreach to
GTM Engine.

Do not change the tab ID. The tab ID remains outreach
in code. Only the visible label shown to the user changes.

Confirm when done.

---

TEST BEFORE CONTINUING — Verify the tab shows GTM Engine
in the UI. Verify the tab ID is still outreach in the
code. Verify clicking it still opens the same tab with
Campaigns, Sequences, and Compose sub-tabs all working.

---

SEND TO CLAUDE CODE — STEP 20 (Health Panel)

Add the system health panel to the PCRM as specified in
Master Playbook Phase 6. This is a compact read-only
panel always visible in a corner of the UI.

It calls the backend api/health endpoint every sixty
seconds silently. It shows six sections: processing
status counts, stuck leads with orange indicators,
failed leads with retry buttons, queue status, last
activity timestamps for backend and n8n, and the last
three errors collapsed by default.

Colour rules: green means all clear. Orange means needs
attention soon including stuck leads. Red means needs
attention now including failed leads and n8n offline.
The panel title dot shows the worst colour across all
sections.

Stuck detection reads the timeInStatus value from the
health response. Enriching is stuck after ten minutes.
Contacts found is stuck after fifteen minutes. Sequences
built is stuck after fifteen minutes. Stuck is always
orange, never red. It means check this, not this broke.

---

SEND TO CLAUDE CODE — STEP 20B (URL Drop Enrichment)

Add URL drop enrichment to the campaign research flow
and to the New Lead import flow.

When a user pastes a company URL anywhere in the PCRM
— in the campaign criteria field, in the import leads
modal, or in the New Lead form — the system should
automatically read the website and extract:
  - Company name
  - Industry and product/service description
  - Company size indicators from the site
  - Key personnel mentioned on the site (About, Team pages)
  - Recent news or announcements
  - Technology signals from the site content

Use the backend to fetch and parse the URL. Pass the
extracted text to the AI to structure it into the lead
enrichment object. Show the extracted data to the user
for confirmation before saving.

This means a user can drop a URL and get a pre-filled
lead with real data in under 30 seconds — no manual
research needed.

Store the source URL in lead.enrichment.sourceUrl.
Store extraction timestamp in lead.enrichment.updatedAt.

Add a URL field to the New Lead form and to the import
modal. When a URL is detected in the paste field during
import, trigger enrichment automatically for that row.

Do not change any existing lead creation logic.

---

SEND TO CLAUDE CODE — STEP 20C (Hunter.io Integration)

Add Hunter.io to the integrations hub alongside Apollo.

Hunter.io finds and verifies email addresses by company
domain. When Apollo returns a contact without a verified
email, automatically try Hunter.io as a fallback.

Add Hunter.io API key field to the Settings integrations
section under pcrm_v9_hunter_key.

Integration points:
  - During campaign enrichment: after Apollo finds a
    contact, if email is missing or unverified, query
    Hunter.io domain search with the company domain
  - In the lead detail view: add a Find Email button
    on any contact that has no email address — clicking
    it queries Hunter.io for that contact's email
  - Hunter.io free tier: 25 searches per month

Hunter.io endpoint: https://api.hunter.io/v2
Key endpoints: domain-search, email-finder, email-verifier

Show verification status on each contact email:
  verified (green), unverified (yellow), invalid (red)

---

SEND TO CLAUDE CODE — STEP 20C2 (Clay Integration and Enrichment Waterfall)

Add Clay.com to the integrations hub alongside Apollo and
Hunter.io as the third provider in the enrichment stack.

Clay endpoint: https://api.clay.com/v1
Store key in pcrm_v9_clay_key.

Enrichment waterfall logic:

  Company data:
    1. Apollo first
    2. Clay second if Apollo returns nothing

  Email addresses:
    1. Apollo first
    2. Hunter.io second if Apollo has no verified email
    3. Clay third if both Apollo and Hunter fail

  Email verification:
    1. Hunter.io first
    2. Clay second if Hunter monthly limit reached

Monthly usage tracking:

  Track usage in localStorage under pcrm_v9_enrichment_usage
  with the following shape:
    {
      month: "YYYY-MM",
      apollo:  { contacts: 0, exports_today: 0, export_date: "YYYY-MM-DD" },
      hunter:  { searches: 0 },
      clay:    { credits: 0 }
    }

  Free tier limits:
    - apollo: 50 contacts per month, 5 exports per day
    - hunter: 25 searches per month
    - clay:   100 credits per month

  Reset counts when the stored month value differs from the
  current month. Reset apollo.exports_today when export_date
  differs from today.

Limit handling:
  - When a provider's limit is reached, skip that provider
    in the waterfall and continue with the next one.
  - Show a warning badge on the provider card in the
    integrations hub when its limit is reached.
  - Show usage meters as progress bars in Settings for each
    provider (current / limit), colour-coded:
      green   < 70%
      yellow  70%–95%
      red     ≥ 95% or limit reached.

Do not change Apollo or Hunter.io behaviour beyond inserting
Clay into the waterfall and wiring the usage counters.

---

SEND TO CLAUDE CODE — STEP 20D (Intent-Based Timing)

Wire the existing signals array to trigger campaign
outreach automatically when buying intent signals appear.

Currently signals are detected and stored but nothing
happens automatically. Add an intent trigger layer:

When a lead receives a new strong signal — funding,
hiring_signal, positive_intent, or reply_received —
and the lead has an active campaign or sequence paused:
  - Show a notification in the Today tab: "Intent signal
    detected for [company] — resume outreach?"
  - One tap resumes the sequence or campaign
  - The outreach timing adapts to the signal — funding
    signal triggers immediate outreach, hiring signal
    triggers outreach within 24 hours

Add a signal timing rules object to pcrm_v9_settings:
  funding_signal: reach out within 2 hours
  hiring_signal: reach out within 24 hours
  positive_intent: reach out within 4 hours
  reply_received: reach out immediately

These are defaults — user can adjust in settings.

This is the intent-based timing layer. It means outreach
happens when the prospect is most likely to respond,
not on a fixed schedule.

Do not change any existing signal detection or sequence
logic. This layer is purely additive.

---

TEST BEFORE CONTINUING — Drop a company URL into the
New Lead import modal. Verify it extracts company data
automatically. Verify Hunter.io finds an email for a
contact missing one. Verify an intent signal on a
paused lead shows the resume notification in Today tab.

---

SEND TO CLAUDE CODE — STEP 20E (GTM Hub Redesign)

Redesign the Outreach tab as a unified GTM hub modelled
on Gmail's layout. This replaces the current Sequences,
Compose, and Campaigns sub-tabs with one unified
sidebar-driven layout.

The tab keeps its ID as outreach in code forever.
The display label changes to GTM Engine only as the
very last action in the entire build — Step 19.

LAYOUT:

Left sidebar — four sections in order:

  1. Compose button at the very top. Clicking it opens
     a compose panel in the centre area — exactly like
     Gmail's compose button. No sub-tab navigation.

  2. Inbox section with these folders:
       Replies — emails from BD contacts via Gmail MCP
       Sent — all emails sent from the PCRM
       Scheduled — emails queued but not yet sent
       Starred — emails manually starred by the user
       Labels — user-created labels with + New Label
       option at the bottom

  3. Sequences section listing all sequences by name.
     A + New Sequence option at the bottom.
     Clicking a sequence opens it in the centre panel
     showing the sequence steps and enrolled contacts.

  4. Campaigns section — visually distinct from all
     other sections. Use a different icon (automation
     or rocket), a subtle separator above it, and a
     slightly different background treatment to signal
     this is an automation engine not manual email.
     List all campaigns by name with status indicator.
     A + New Campaign option at the bottom.
     Clicking a campaign opens the full campaign detail
     view with research controls, leads table, and
     automation status — not just an email thread.

Centre panel — content area that changes based on
what is selected in the sidebar:
  - Compose selected: compose panel with To, Subject,
    Body, tone selector, generate draft button
  - Inbox folder selected: email list with sender,
    subject, preview, timestamp
  - Sequence selected: sequence step list and
    enrolled contacts
  - Campaign selected: campaign detail with leads
    and automation controls

Right panel — detail view:
  - Email selected: full email content with reply
    button
  - Sequence step selected: step editor
  - Campaign lead selected: lead detail

The visual distinction between Inbox/Sequences and
Campaigns must be immediately obvious. A BDM looking
at the sidebar should instantly understand that
Inbox and Sequences are things they control manually,
while Campaigns is the autonomous engine that runs
on its own.

Data sources:
  Replies: Gmail MCP BD Replies label
  Sent: pcrm_v9_scheduled sent log
  Scheduled: pcrm_v9_scheduled where status pending
  Starred: new pcrm_v9_starred_emails in localStorage
  Labels: new pcrm_v9_email_labels in localStorage

Star button on each email in the list.
Label button lets user assign custom labels.
BD contacts only — emails from or to contacts in
pcrm_v9_leads. No personal emails ever shown.

Do not change any existing sequence logic.
Do not change any existing campaign logic.
Do not change any existing send or Gmail logic.
This is a layout and navigation redesign only.
All existing functionality stays exactly the same —
it is just accessed through the new sidebar structure.

Update CLAUDE.md after building.

---

TEST BEFORE CONTINUING — Verify the sidebar shows
all four sections. Click Compose and verify it opens
in the centre panel. Click a sequence and verify it
shows the sequence detail. Click a campaign and verify
it shows the campaign detail with the distinct visual
treatment. Click Replies in the Inbox section and
verify BD reply emails appear. Verify no personal
emails appear. Verify all existing sequence and
campaign functionality still works.

---

### SESSION 7 — INSTALL AS APP ON IPHONE AND MACBOOK

This session makes your PCRM feel like a native app on
both devices. No new features. No logic changes. Two
small additions that change how you access the tool.

Your PCRM is already responsive for mobile and large
screens so Step 21 is skipped. Only Step 22 is needed.

---

SEND TO CLAUDE CODE — STEP 22 (Add PWA Support)

Add Progressive Web App support to my PCRM so it can
be installed as a native-feeling app on iPhone and MacBook.

Add a Web App Manifest file called manifest.json at the
root of the project with these fields:
  name: PCRM GTM Engine
  short_name: PCRM
  start_url: /
  display: standalone
  background_color: the current background colour
  theme_color: the current header colour
  icons: generate icons at 192x192 and 512x512 pixels
    using a simple P lettermark in the app's colour scheme

Add a Service Worker file called sw.js that:
  - Caches all app files on first load for offline use
  - Serves cached files when offline
  - When online, always fetches fresh data from the
    backend but falls back to cache if unreachable
  - Clears old caches when a new version is deployed

In index.html:
  - Link the manifest.json in the head section
  - Add meta tags for apple-mobile-web-app-capable,
    apple-mobile-web-app-status-bar-style, and
    apple-mobile-web-app-title
  - Register the service worker at the bottom of the page

Do not change any existing logic, styles, or functionality.
This is purely additive. Confirm when done.

---

DO THIS MANUALLY — Install on iPhone:
Open Safari on your iPhone.
Go to your PCRM Netlify URL.
Tap the Share button (the box with an arrow pointing up).
Tap Add to Home Screen.
Name it PCRM and tap Add.
It now appears as an app icon on your home screen.
Opens full screen with no browser bar — exactly like a
native app.

DO THIS MANUALLY — Install on MacBook:
Open Safari on your MacBook.
Go to your PCRM Netlify URL.
Click File in the menu bar.
Click Add to Dock.
A PCRM icon appears in your dock permanently.
Click it anytime to open PCRM in its own window
without any browser chrome around it.

---

HOW SYNC WORKS BETWEEN DEVICES:

Both your iPhone and MacBook open the same Netlify URL.
Both read from the same Hetzner backend API.
Both auto-refresh every 90 seconds silently.

If you add a lead on your iPhone at 9am, by 9:01:30am
it appears on your MacBook automatically with no action
needed. If you approve a sequence on your MacBook, your
iPhone shows it updated within 90 seconds.

There is no separate sync setup required. The shared
backend is the sync mechanism. Both devices always
see the same data because they both read from the
same single source.

When offline — on a plane or with no signal — both
devices still open and show your last cached data.
Any changes you make while offline queue up and sync
automatically when connection returns.

---

TEST BEFORE CONTINUING — Install on both devices.
Make a change on your iPhone and verify it appears on
your MacBook within 90 seconds. Make a change on your
MacBook and verify it appears on your iPhone. Verify
the app opens correctly when offline.

---

### SESSION 8 — DOCUMENT LAYER

This session adds document preparation and sharing
capability to the deal room. It is active from the
first meaningful interaction — you can generate a
one-pager before a first call and a cost overview
before a second meeting. It is not an end-stage tool.

The deal room tab already exists. All additions are
inside it. Nothing outside the deal room changes.

---

SEND TO CLAUDE CODE — STEP 23 (Template Library)

In the deal room tab, add a Templates section above
the existing document list.

Build a template library with the following structure:
  - An upload button that accepts .docx, .pdf, .txt,
    and .md files
  - Each uploaded template is stored on your Hetzner server
    Cloud backend at /templates/:templateId
  - Templates have a name, a type (one-pager, proposal,
    cost-overview, term-sheet, nda, other), and a list
    of variable fields the BDM defines after upload
  - Variable fields are defined using double curly brace
    syntax: {{company_name}}, {{contact_name}},
    {{industry}}, {{deal_terms}}, {{partnership_model}}
  - The system maps known variable names automatically
    to lead object fields — {{company_name}} maps to
    lead.company, {{contact_name}} to the selected
    contact's name, {{industry}} to lead.enrichment data

Show uploaded templates in a small library panel. Each
template shows its name, type, and last used date.
Clicking a template opens the document editor for that
lead with the template loaded.

Templates are global — not per lead. They are defined
once and used for any lead.

Do not change any existing deal room functionality.

---

SEND TO CLAUDE CODE — STEP 24 (Document Editor)

Inside the deal room tab, add a document editor panel
that opens when a template is selected or when the
BDM clicks New Document.

The editor is a simple rich text editor supporting:
  - Headings h1, h2, h3
  - Paragraphs
  - Bullet lists
  - Tables
  - Bold and italic text

The editor has three action buttons:
  - Export PDF: converts the document to PDF using
    the browser's native print-to-PDF capability and
    saves it to the lead's deal room document list
  - Get Shareable Link: sends the document content
    to the Hetzner backend which stores it at
    /documents/:documentId and returns a read-only
    URL. The URL is copied to clipboard and logged
    against the lead with a prepared timestamp.
  - Send via Gmail: opens the Gmail compose flow
    pre-addressed to the contacts at this lead with
    the document attached as PDF and the shareable
    link included in the email body.

All generated documents are stored per lead in the
deal room document list with: name, type, created
timestamp, status (draft, prepared, sent).

Do not change existing deal room document storage.
The editor is additive alongside it.

---

SEND TO CLAUDE CODE — STEP 25 (AI Document Generation)

Add AI document generation to the document editor.

When the BDM opens a template for a specific lead,
add a Generate button that triggers a three-step
generation sequence.

STEP ONE — AUDIT:
Read all available data for this lead:
  - lead.enrichment (company data from n8n)
  - lead.signals[] (filtered to last 30 days)
  - lead.callOutcomes[] (any call notes)
  - lead.contacts[] with their roles
  - lead.outreachOutcome and bdContext
  - Any existing deal room notes

Build an inventory object of confirmed facts.

STEP TWO — CONDITIONAL SECTION EVALUATION:
Each template section is tagged as one of:
  always_present — always included regardless of data
  conditional — only included if its required data
    field exists and is non-empty on this lead
  research_driven — generated fresh from web search

For conditional sections, check the inventory.
If the required data does not exist, that section
is excluded entirely. No placeholder, no blank,
no mention. It is simply absent from the document.

Examples:
  - Funding section: only present if a funding_signal
    exists in lead.signals[]
  - Hiring section: only present if hiring_signal exists
  - Competitor section: only present if competitor
    signal exists
  - Recent news section: always research_driven

STEP THREE — RESEARCH PASS (for research_driven sections):
For sections tagged research_driven, run a targeted
web search using Serper for:
  - "[company name] recent news"
  - "[company name] product launch OR announcement"
  - "[company name] [contact name] LinkedIn"

Extract relevant findings. Attach source and date to
each finding. These feed only this document generation
and are not stored on the lead.

GENERATION:
Call Claude API with:
  - The template structure
  - The confirmed facts inventory
  - The conditional section decisions
  - The research findings
  - Instruction to match language to the contact's
    industry and seniority level

For cost overview and term sheet documents specifically:
  - Generate a draft structure only
  - Flag all commercial terms as REVIEW REQUIRED
  - Do not send or share until the BDM has reviewed
    and confirmed the commercial terms manually
  - Show a prominent review banner in the editor

For all other document types the generated draft is
ready for review and adjustment before sending.

Show a source panel alongside the generated document
listing every data point used and where it came from
— CRM field, signal date, or web search result with
URL and date. This tells the BDM how fresh the data is.

Do not automate sending. The BDM always reviews before
any document leaves the system.

---

TEST BEFORE CONTINUING — Upload a simple template with
two or three variable fields. Open a lead with some
signals. Click Generate. Verify conditional sections
appear only when their data exists. Verify the cost
overview shows a REVIEW REQUIRED banner. Verify the
source panel lists the data used. Export as PDF and
verify it downloads. Generate a shareable link and
verify it opens in a browser as read-only.

---

### SESSION 9 — DISTRIBUTION AND SHEETS

---

SEND TO CLAUDE CODE — STEP 26 (Document Status Tracker)

In the deal room tab, add a Document Status section
that shows all documents prepared for this lead.

Each entry shows:
  - Document name and type
  - Created timestamp
  - Status: draft, prepared, sent
  - If sent: when it was sent and to which contact
  - A re-send button that opens the Gmail compose
    flow pre-filled

Status updates automatically:
  - Created in editor → draft
  - PDF exported or link generated → prepared
  - Sent via Gmail → sent with timestamp and contact

This gives a clear audit trail of what was shared
with which prospect and when. Nothing is hidden.

---

SEND TO CLAUDE CODE — STEP 27 (Sheet Templates)

Add sheet template support to the template library
alongside text documents.

Sheet templates are defined as structured CSV files
with named columns and optional formula rows. Examples:
  - Co-sell tracker with columns for prospect, status,
    owner, deal size, close date
  - Revenue share calculator with deal terms variables
  - Joint pipeline view

When a sheet template is selected for a lead, the
same generation sequence runs — audit, conditional
evaluation, variable substitution. The output is a
pre-populated CSV file that downloads immediately.

The BDM attaches it to an email or uploads to Drive
manually. The system does not connect to Google Drive
directly — that dependency is out of scope.

Sheet generation uses variable substitution only.
No research pass for sheets — structured data only.

---

TEST BEFORE CONTINUING — Create a simple sheet template.
Open a lead and generate it. Verify the CSV downloads
with lead data substituted. Verify it opens correctly
in Excel or Google Sheets.

---

SEND TO CLAUDE CODE — STEP 27B (Proposal Tracking)

Add proposal tracking to all documents sent from the
PCRM. This is one of the highest-value features in the
entire build — it tells you who opened your proposal,
how long they spent on each section, and whether they
forwarded it to other stakeholders.

When a document is sent via Gmail from the PCRM:
  - Generate a unique tracking token for this send
  - Embed a 1x1 pixel tracking image in the document
    or HTML email pointing to the backend tracking
    endpoint: GET /api/track/:token
  - Store the token mapped to the lead, contact, and
    document in the backend

When the backend receives a tracking hit:
  - Record: timestamp, IP address, user agent
  - Identify the device type (desktop/mobile/tablet)
  - Append to the document's tracking log

Show tracking data in the deal room document status:
  - Opened: yes/no with timestamp of first open
  - View count: how many times opened
  - Last viewed: timestamp
  - Devices: which device types opened it
  - Time spent: estimated from multiple hits

Forward detection:
  - If the same document is opened from a different
    email client or IP not matching the original
    contact, flag it as "Possibly forwarded — new
    viewer detected" in the deal room
  - This surfaces unknown stakeholders

Trigger notifications in Today tab:
  - "VaultChain opened your proposal 3 times today —
    follow up now"
  - "New viewer on your Blueberry proposal — possible
    forwarding to decision maker"

Store all tracking data in the backend under
/data/tracking.json append-only log.

This is purely additive — existing document and Gmail
send flows stay exactly as they are. Tracking is
layered on top.

---

TEST BEFORE CONTINUING — Send a test document to
yourself. Open it. Verify the tracking hit appears
in the backend tracking log. Verify the deal room
shows opened status. Verify the Today tab notification
appears.

---

This session moves your data from localStorage and
Hetzner JSON files to a proper Supabase database,
and replaces the basic password auth with real
authentication. Supabase is free forever at your
scale. Hetzner stays exactly as is — Supabase only
replaces the storage and auth layers.

After this session your data survives browser clears,
works across multiple devices automatically, supports
multiple client accounts with full data isolation,
and has proper login with email and password reset.

---

DO THIS MANUALLY — STEP 28A (Create Supabase Project)

Go to supabase.com and create a free account.
Click New Project.
Name it pcrm-gtm.
Choose a strong database password and save it.
Select the region closest to your location.
Click Create new project and wait about two minutes.

Once created, go to Settings then API.
Copy two values and save them somewhere safe:
  Project URL — looks like https://xxx.supabase.co
  Anon public key — a long JWT string

These are your Supabase credentials. They are safe
to use in browser code.

---

SEND TO CLAUDE CODE — STEP 28B (Create Database Schema)

In Supabase, go to the SQL Editor and run the schema
creation script. Ask Claude Code to generate the
complete SQL schema that matches the current PCRM
lead data model including all fields added through
the v8 migration — enrichment, signals, outreachOutcome,
callOutcomes, snoozedUntil, snoozeReason, contacts
with role field, and all existing lead fields.

Also create tables for:
  sequences — matches current sequence structure
  user_settings — stores per-user API keys and preferences
  documents — stores generated documents per lead
  templates — stores document and sheet templates

Each table must have a user_id column that links to
Supabase Auth so each user only sees their own data.
Row Level Security must be enabled on every table.

---

SEND TO CLAUDE CODE — STEP 28C (Add Supabase Auth)

Add Supabase authentication to the PCRM.

Install the Supabase JavaScript client via CDN in
index.html — no build step required.

Replace the existing localStorage password check
with Supabase Auth. Add a login screen that appears
before the app loads if no session exists. The login
screen has email, password, and a sign in button.
Add a forgot password link that triggers Supabase
password reset email.

On successful login, store the Supabase session.
On logout, clear the session and return to login screen.

The Supabase project URL and anon key are stored as
constants in constants.js. Never hardcode the service
role key anywhere in the frontend.

Do not change any existing PCRM functionality.
Auth is a wrapper around the existing app.

---

SEND TO CLAUDE CODE — STEP 28D (Migrate Data to Supabase)

Replace localStorage as the primary data store with
Supabase for leads, sequences, settings, documents,
and templates.

On app load, fetch data from Supabase instead of
localStorage. Keep localStorage as a local cache
for offline use — the same offline fallback pattern
used for the Hetzner backend.

When data changes, write to Supabase first, then
update localStorage cache. On load, if Supabase is
reachable fetch from there. If offline, use cache.

Migrate the existing localStorage data to Supabase
on first login — read from localStorage, write to
Supabase, mark migration as done.

Update the Hetzner backend to write enrichment and
signal data to Supabase instead of leads.json. The
backend needs the Supabase service role key as an
environment variable — store it in the .env file
on the Hetzner server, never in frontend code.

---

SEND TO CLAUDE CODE — STEP 28E (Multi-Client Support)

Now that data is isolated by user_id in Supabase,
each client gets their own account. Add a simple
admin flow:

When you want to create a client account, go to
the Supabase dashboard, Authentication section,
and invite a new user by email. They receive an
invitation email and set their own password.

Each client logs in to the same PCRM URL with their
own credentials and sees only their own data. No
data ever crosses between accounts.

For your own account, you see only your data. For
a client account, they see only theirs.

No additional code is needed beyond Step 28D —
Row Level Security in Supabase handles the isolation
automatically.

---

TEST BEFORE CONTINUING — Log out and log back in.
Verify your data is still there after login.
Clear localStorage completely using:
  localStorage.clear()
Reload the app. Verify all your data loads from
Supabase correctly without the localStorage cache.
Create a second test account and verify it sees
no data from the first account.
Verify the Hetzner backend writes go to Supabase
and appear in the PCRM on next load.

---

### SESSION 11 — MODULAR LAYOUT (FUTURE PLACEHOLDER)

This session is not built until Sessions 1 through 10
are complete and the system has real users.

Every major UI panel becomes repositionable — pipeline
overview can move to left, centre, right, or hidden.
Header elements can be reordered. Tab order is
configurable. Today tab layout adapts to preference.
All settings stored per user in Supabase and persist
across devices.

Deferred because layout preferences can only be
designed well after understanding how real users
actually work. Building it now means guessing.

---

### SESSION 12 — MULTI-DEAL, PARTNER, AND STAKEHOLDER GRAPH (FUTURE PLACEHOLDER)

This session is not built until Sessions 1 through 10
are complete and real usage patterns show which
scenario appears most frequently.

The architectural placeholders are already in the
data model from Session 4. Three fields exist but
are empty and inactive:

The deals array on each lead supports multiple
simultaneous opportunities at the same company.
Each deal has its own stage, contacts, notes, and
progression independent of the others. Deals can
share stakeholders. One deal can be flagged as
having a positive or negative dependency on another.

The relationships array on each contact supports
cross-deal stakeholder mapping. A contact can be
marked as reports_to, influences, blocks, or
collaborates with another contact — even across
different leads. This enables a stakeholder graph
showing how influence flows between people and deals.

The leadType field supports partner companies.
A partner is a company you work with to co-sell,
refer, or collaborate — not a prospect you are
selling to. Partners have their own contact list,
relationship history, and activity log but the
pipeline stages and outreach sequences are different
from prospect leads. Partner-specific workflows
are defined when this session is built.

Deferred because these scenarios need real usage
data to design correctly. The wrong multi-deal
architecture is worse than no multi-deal support.
Build it only after observing how these situations
actually arise in practice.

---

### FINAL TEST — FULL SYSTEM CHECK

DO THIS MANUALLY — Go through every tab and verify
nothing has changed in existing functionality. Run a
full EOD summary. Send a test email via Gmail. Advance
a lead through a pipeline stage. Create and send a
sequence step. Verify the active prompt updates in
localStorage after a few seconds. Create a campaign and
run it through the research phase. Verify the health
panel shows green. Check localStorage size with the
size utility.

---

## SUMMARY

Thirty-two steps across ten sessions plus Session 11
as a future placeholder. Sessions one and two are zero
to low risk. Session three extends existing functions.
Session four builds new UI including BD reply
classifier, stakeholder map, stage aliases, snooze,
deal progression, configurable stage progression
thresholds, and notification channel selector.
Session four point five adds Gmail MCP, three-layer
call outcome system, and push notification setup.
Session five builds the backend on Hetzner. Session
six builds the GTM Engine with weekly learning on
Friday EOD. Session seven installs the app on devices.
Sessions eight and nine build the document layer.
Session ten adds Supabase for real auth and database.
Session eleven adds modular layout after real usage
patterns are understood.

After Session 10 your data survives browser clears,
works across all devices automatically, supports
multiple client accounts, and has proper login with
email and password reset. Hetzner stays as the
compute layer. Supabase handles storage and auth.

Total monthly cost: Hetzner €3.79 plus Claude API
approximately five to fifteen dollars. Supabase is
free forever at this scale. Everything else is free.

The three critical rules — Campaigns as sole trigger,
deterministic merge, fixed active prompt structure — are
enforced from Step 1 and never relax.

The campaign entry model defines exactly two ways a
campaign can start — from existing leads or from a
search intent — and enforces that all leads must be
materialised as CRM objects before any execution begins.
This prevents the system from ever sending outreach to
an entity that does not exist as a traceable lead.

The five hardening improvements are built into the
foundations so they do not need retrofitting later.
Signal quality and decay keeps the signals array clean
and relevant over time. Trend indicators give the active
prompt direction not just state. Campaign lifecycle makes
automation deterministic and resumable. Idempotent writes
prevent silent data corruption from n8n retries.
Per-lead sequential processing prevents race conditions
from concurrent updates to the same lead.

When something breaks, the build order tells you exactly
where to look. If a problem appears in session three,
it is in one of the four extended functions. If it
appears in session five, it is in the backend connection
or the merge logic. If duplicate data appears, it is
an idempotency issue — check requestId generation in
the n8n workflow. If a lead has inconsistent state,
it is a queue ordering issue — check the per-lead
queue in the backend. If outreach fired without a
visible lead in the CRM, the materialisation rule was
bypassed — check the campaign entry flow. Nothing is
ambiguous.

---

This document is the single source of truth for the
entire build. The Master Playbook contains the detailed
specifications for each feature. The Prospect Engine
contains the detailed specification for the enrichment
flow. When in doubt: additive only, never remove,
always test.
