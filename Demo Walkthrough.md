# Charlotte Training — Demo Walkthrough

**Session:** Building With AI · Customer Obsession Edition
**Date:** May 27, 2026 · Charlotte office
**Format:** Three-hour cohort, repeated 2–3 times depending on headcount
**Audience:** AssetMark engineers, mostly under one year tenure, technical, hungry. Some product folks.

This document is the playbook for the room: what to pre-stage, what to say, what to type, what to do if things break. The deck (`AssetMark_Xano_Training_Deck.pptx`) is the spine; this is the muscle.

---

## 1. Pre-session checklist (T-minus 5 days)

These need to be done by training day. Owner in brackets.

- [ ] **Update Xano on-prem to 2.3** for the agent-mode patch. [Ezra / Adam]
- [ ] **Stand up the Mock Data Hub workspace** in the AssetMark Xano instance. Schema and seed data in §3 of this doc. [Faisal + Josh]
- [ ] **Provision one workspace per attendee.** Naming convention: `pulse-<firstname>-<lastinitial>`. RBAC: attendee gets access only to their own workspace. Verify on a sample attendee before the session. [Faisal]
- [ ] **Confirm OpenAI/ChatGPT enterprise key is wired into Xano agent mode** in each attendee workspace. This is the single biggest failure point — test it on at least three workspaces 48 hours out. [Josh + Xano]
- [ ] **VS Code + Xano plugin pre-installed.** If laptops are locked down, coordinate with Melissa's team to push the install. [Josh]
- [ ] **CLI installed and authenticated** on each laptop. A `xano --version` check at session start is the smoke test. [Josh]
- [ ] **Pick one attendee laptop to dry-run on 48 hours out.** Run the full demo loop end-to-end on it. If anything breaks, you find it now, not in front of 30 people. [Prakash + Josh]
- [ ] **#xano-training Slack channel created**, attendees added, three Xano folks pinned at the top. [Josh]
- [ ] **Print this walkthrough.** When the projector fights you, paper wins. [Prakash]

---

## 2. Session timing (3 hours)

| Time | Block | What's happening |
|------|-------|------------------|
| 0:00 – 0:10 | Open | Slide 1–2. Sue story. Why we're here. |
| 0:10 – 0:25 | Frame | Slides 3–5. Three buckets · build *on* Xano · the modern loop. |
| 0:25 – 0:35 | Demo setup | Slides 6–7. What Advisor Pulse is. The Mock Data Hub architecture. |
| 0:35 – 1:20 | **Live demo** | Slide 8 transition. Switch to VS Code. Full build, push, validate. |
| 1:20 – 1:25 | Break | 5 minutes. People will want coffee. |
| 1:25 – 1:35 | Lab kickoff | Slide 9. Walk the four tracks. Slide 10 — quality bar. |
| 1:35 – 2:50 | **Hands-on lab** | Attendees build in their own workspaces. Floor is open. |
| 2:50 – 3:00 | Show & tell + bridge | 2–3 quick demos. Slide 11. June 1. Done. |

If you run a single cohort with 30 people: keep the live demo tight at 45 minutes. With 70+ across two cohorts, you get this exact structure each round.

---

## 3. The Mock Data Hub

A single shared Xano workspace. Read-only to attendees (no auth needed for the lab — keep friction down; this is mock data only). Exposes REST endpoints attendees query from their own workspaces.

### 3.1 Schema (5 tables)

```
advisors
  id (int, pk)
  first_name (text)
  last_name (text)
  region (text)             // "Pacific", "Southeast", "Northeast", "Midwest"
  joined_date (date)

clients
  id (int, pk)
  advisor_id (int, fk -> advisors.id)
  first_name (text)
  last_name (text)
  household_assets_usd (decimal)
  risk_tolerance (text)     // "conservative", "moderate", "aggressive"
  created_date (date)

account_applications
  id (int, pk)
  client_id (int, fk -> clients.id)
  custodian (text)          // "Schwab", "Fidelity", "Pershing", "BetaNXT"
  account_type (text)       // "IRA", "Roth", "Joint", "Trust"
  status (text)              // "drafted", "submitted", "needs_info", "approved", "funded"
  status_changed_at (datetime)
  created_at (datetime)

engagement_events
  id (int, pk)
  client_id (int, fk -> clients.id)
  advisor_id (int, fk -> advisors.id)
  event_type (text)         // "call", "email", "meeting", "portal_login"
  occurred_at (datetime)
  duration_minutes (int, nullable)
  notes (text, nullable)

call_transcripts
  id (int, pk)
  engagement_event_id (int, fk -> engagement_events.id)
  client_id (int, fk -> clients.id)
  transcript (longtext)
  sentiment_label (text, nullable)   // pre-seeded for some: "positive", "neutral", "negative"
```

### 3.2 Seeded volume

Aim for realism without making the dataset annoying to query.

- 25 advisors across 4 regions
- 300 clients (avg 12 per advisor, range 5–25)
- 180 account_applications, deliberately weighted so ~25% are in `needs_info` for 14+ days
- 1,200 engagement_events spread across 90 days, with realistic gaps (some clients deliberately have nothing in 30+ days)
- 45 call_transcripts attached to call events, mixed sentiment

The seed file lives at: `/training-assets/mock-data-hub-seed.json` (Faisal to drop in shared drive).

### 3.3 Endpoints exposed by the Hub

```
GET  /advisors                       → list all
GET  /advisors/{id}                   → single advisor + nested clients
GET  /advisors/{id}/clients           → just clients
GET  /clients                         → list with optional ?advisor_id filter
GET  /clients/{id}                    → single client + applications + recent events
GET  /clients/{id}/events             → engagement events
GET  /applications                    → list with ?status filter and ?stale_days filter
GET  /transcripts                     → list with ?client_id filter
GET  /transcripts/{id}                → full transcript text
```

The demo uses **two instances on purpose**:

| Role | Instance | Workspace |
|------|----------|-----------|
| Mock Data Hub (shared Snowflake stand-in) | `https://xxmf-qrth-inat.n7d.xano.io` | `128` |
| Advisor Pulse (live demo build target) | `https://x6if-wu0q-dtak.n7.xano.io` | `304` |

Hub base URL (sticky note for attendees): `https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub`

Repo assets:

- Seed data: `training-assets/mock-data-hub-seed.json`
- Hub XanoScript: `AssetMark Data Hub/`
- Pulse XanoScript: `AssetHub Demo/`
- Local tests: `npm run validate`

Cross-instance smoke test:

```bash
curl "https://x6if-wu0q-dtak.n7.xano.io/api:assetmark-advisor-pulse/advisors/3/pulse?hub_base_url=https%3A%2F%2Fxxmf-qrth-inat.n7d.xano.io%2Fapi%3Aassetmark-mock-data-hub" | jq
```

Expected top response item is Maria Vasquez, flagged for a stalled Schwab IRA application in `needs_info`. Pulse runs on Dev Adv; data comes from Sandbox.

---

## 4. The live demo — minute by minute

You'll be at the front, projecting VS Code on one half of the screen and Xano on the other (or alternating). The goal is to make the loop visible: prompt → script → CLI → Xano → response.

### Setup (do this BEFORE the cohort enters the room)

1. Open VS Code with a clean folder: `~/pulse-demo-live`
2. Open Xano in a browser tab pointed at the demo workspace `pulse-demo-live`
3. Terminal open, ready, working dir set
4. Bump font sizes — assume the back row exists
5. Close Slack, email, calendar. Quiet notifications.

### Beat 1 (0:00–0:03) — Frame what you're about to build

> "I'm going to build Advisor Pulse in front of you. From an empty file to a running endpoint, in this session. I'm going to use AI to write almost all of it. I'm going to push it through the CLI. And then we're going to hit it with curl and watch it return real-looking data. Three things I want you to watch for: how much I type, how much I review, and where I push back on the AI when it gets it wrong."

That last sentence sets the tone — this is not a magic show. The AI gets things wrong. The point is the loop, not the autocomplete.

### Beat 2 (0:03–0:10) — Show the Hub first

Open the Mock Data Hub workspace in Xano. Click into the `clients` table, scroll. Click into `account_applications`, filter by `status = needs_info`, sort by `status_changed_at`.

> "This is the data your workspace will see. Notice these — these are real-looking advisors with real-looking clients. Look at this one: stuck in `needs_info` for 23 days. That's a customer-obsession problem hiding in a table."

This grounds the rest of the demo. They've now seen the data with their own eyes.

### Beat 3 (0:10–0:30) — The build

Switch to VS Code. Open agent mode.

**Prompt to type live (verbatim, project it):**

```
I want to build an Advisor Pulse API in Xano.

It exposes one endpoint: GET /advisors/{advisor_id}/pulse

It should return a JSON list of clients for that advisor who need
attention, ranked highest-priority first. A client needs attention if:

1. They have an account application stuck in "needs_info" for 14+ days, OR
2. Their last engagement_event was more than 30 days ago, OR
3. Their most recent call_transcript has sentiment_label = "negative"

The Mock Data Hub is at https://hub.assetmark-xano.local/api:v1 — pull
clients, applications, events, and transcripts from there.

Return each flagged client with: client_id, name, reason (one of the
three above), and days_since_last_contact. Sort by days_since_last_contact
descending.

Write Xano script. Include unit tests.
```

Let the agent generate. As it writes:

- **Narrate** what it's doing. "Notice it's pulling the schema from the Hub via the MCP. It's writing the external API call. There's the scoring logic. Watch the language server flag this — yeah, see, it caught that the field is `status_changed_at`, not `status_changed_date`."
- **Don't fix typos in front of them.** Let the AI miss something, then catch it. This is the most valuable moment of the whole demo. You're showing them that AI-driven dev means *review*, not blind acceptance.
- If the agent produces something close to §5 below, you're in good shape.

### Beat 4 (0:30–0:40) — Push and validate

CLI to the sandbox:

```bash
xano workspace push -d "AssetMark Data Hub" -w 128 -p "AssetMark Sandbox" --sync --force
xano workspace push -d "AssetHub Demo" -w 304 -p "AssetMark Dev Adv" --sync --force
```

Narrate the output. When it succeeds, switch to the Xano browser tab. Show the endpoint in the sandbox. Run the built-in test.

Then from the terminal:

```bash
curl "https://x6if-wu0q-dtak.n7.xano.io/api:assetmark-advisor-pulse/advisors/3/pulse?hub_base_url=https%3A%2F%2Fxxmf-qrth-inat.n7d.xano.io%2Fapi%3Aassetmark-mock-data-hub" | jq
```

Walk through the response slowly. Pick one entry and connect it back to the source data: "This client, Maria Vasquez — her application's been sitting in `needs_info` for 23 days. That's the row we saw five minutes ago. That's why she's at the top of this list."

### Beat 5 (0:40–0:45) — Iterate

This beat is critical. It sells the loop.

> "Now watch. I want to add one more rule. Clients with assets above $1M who haven't been contacted in 14 days should get bumped up. Watch how fast this is."

Prompt:

```
Add a fourth rule: clients with household_assets_usd > 1,000,000 who
have no engagement_event in the last 14 days should also be flagged.
Add a "priority_score" field where stale-high-value clients rank above
stale calls but below negative-sentiment cases.
```

Let it generate. Push. Re-curl. Show the changed response. End demo.

> "That whole loop — added a rule, regenerated logic, ran tests, pushed to sandbox, validated — was three minutes. *That's* why we're here today."

Switch to slide 9.

---

## 5. Reference Xano script (recovery aid)

If the AI flubs badly and you need to recover gracefully, this is what "good output" looks like. Don't pre-type this — keep it on a second monitor or printed copy for emergency.

```javascript
// Advisor Pulse — flag clients needing attention
//
// Endpoint: GET /advisors/{advisor_id}/pulse
// Returns: ranked list of clients with reason + recency

input advisor_id: int

const HUB_BASE = env.MOCK_DATA_HUB_BASE_URL
const STALE_APP_DAYS = 14
const STALE_CONTACT_DAYS = 30
const HIGH_VALUE_THRESHOLD = 1000000

// --- Pull data from the Hub ---
const clients = http.get(`${HUB_BASE}/clients?advisor_id=${advisor_id}`).json()

const flagged = []

for (const client of clients) {
  const apps = http.get(`${HUB_BASE}/applications?client_id=${client.id}`).json()
  const events = http.get(`${HUB_BASE}/clients/${client.id}/events`).json()
  const transcripts = http.get(`${HUB_BASE}/transcripts?client_id=${client.id}`).json()

  const now = datetime.now()
  const lastEvent = events.length ? events.sort_desc("occurred_at")[0] : null
  const daysSinceContact = lastEvent
    ? datetime.diff_days(now, lastEvent.occurred_at)
    : 999

  // Rule 1: stalled application
  const stalledApp = apps.find(a =>
    a.status === "needs_info" &&
    datetime.diff_days(now, a.status_changed_at) >= STALE_APP_DAYS
  )
  if (stalledApp) {
    flagged.push({
      client_id: client.id,
      name: `${client.first_name} ${client.last_name}`,
      reason: "stalled_application",
      days_since_last_contact: daysSinceContact,
      priority_score: 90 + datetime.diff_days(now, stalledApp.status_changed_at)
    })
    continue
  }

  // Rule 2: no contact in 30+ days
  if (daysSinceContact >= STALE_CONTACT_DAYS) {
    // Rule 4 bump: high-value AND no contact in 14+ days
    const bump = client.household_assets_usd > HIGH_VALUE_THRESHOLD && daysSinceContact >= 14
    flagged.push({
      client_id: client.id,
      name: `${client.first_name} ${client.last_name}`,
      reason: bump ? "high_value_stale" : "no_recent_contact",
      days_since_last_contact: daysSinceContact,
      priority_score: bump ? 80 : 60
    })
    continue
  }

  // Rule 3: latest transcript sentiment is negative
  const latestTranscript = transcripts.length
    ? transcripts.sort_desc("id")[0]
    : null
  if (latestTranscript?.sentiment_label === "negative") {
    flagged.push({
      client_id: client.id,
      name: `${client.first_name} ${client.last_name}`,
      reason: "negative_sentiment",
      days_since_last_contact: daysSinceContact,
      priority_score: 95
    })
  }
}

return flagged.sort_desc("priority_score")
```

### Sample expected response

```json
[
  {
    "client_id": 47,
    "name": "Maria Vasquez",
    "reason": "stalled_application",
    "days_since_last_contact": 18,
    "priority_score": 113
  },
  {
    "client_id": 112,
    "name": "Daniel Okafor",
    "reason": "negative_sentiment",
    "days_since_last_contact": 6,
    "priority_score": 95
  },
  {
    "client_id": 89,
    "name": "Patricia Lim",
    "reason": "high_value_stale",
    "days_since_last_contact": 22,
    "priority_score": 80
  }
]
```

---

## 6. The lab (90 minutes)

### Track A — Stalled Application Detector

**Prompt starter (give to attendees):**

> Build an API endpoint `GET /stalled?days=N` that queries `account_applications` in the Mock Data Hub and returns any application in the same status for more than N days. Return `advisor_name`, `client_name`, `status`, `days_stuck`. Sort by `days_stuck` descending.

**What "done" looks like:** Endpoint returns valid JSON, accepts `days` query param with a sensible default (14), joins applications back to advisor and client names.

### Track B — Call Sentiment Tracker

**Prompt starter:**

> Build an API endpoint `GET /advisors/{id}/sentiment-trend?weeks=4` that pulls all call_transcripts for the given advisor's clients over the last N weeks. Score sentiment for any transcripts where `sentiment_label` is null (use the AI inside Xano to score). Return weekly aggregates: `{ week, total_calls, positive, neutral, negative, net_score }`.

**What "done" looks like:** Returns weekly bucket aggregates. Net score calculation reasonable (e.g. positive minus negative). Handles weeks with no calls gracefully.

### Track C — Advisor Engagement Score

**Prompt starter:**

> Build an API endpoint `GET /advisors/{id}/risk-list` that scores each client of the advisor for "risk of being forgotten." Score formula: recent events score higher, older events decay. Calls weight more than emails. Return the bottom 10 clients with `client_id`, `name`, `engagement_score`, `last_event_type`, `last_event_at`.

**What "done" looks like:** Score uses time decay (clients with events last week score higher than last month). Different weights for event types. Returns exactly 10 results.

### Track D — Next Best Action

**Prompt starter (intentionally open-ended):**

> Combine signals from the Mock Data Hub to produce a per-client recommended next action. Examples: "Call to follow up on stalled IRA application," "Schedule a check-in — no contact in 6 weeks," "Send portfolio review — recent negative call." Return up to 20 actions sorted by urgency.

**What "done" looks like:** Action text is generated (not just enum mapped). Pulls from multiple tables. Urgency ranking is defensible. Bonus: thin UI on top via static HTML or quick Vue/React snippet.

### Floor rules during the lab

- **Xano team circulates.** Don't sit at the front. Walk the room.
- **No silent rooms.** If someone is stuck for 10 minutes, sit down with them. The lab is about momentum.
- **Common-issue ledger.** When you fix a problem at one desk, post the issue + fix in `#xano-training`. Saves the next three people.
- **No correcting AI output for them.** Show them how to read and fix it. The whole point.

---

## 7. Quality rubric (slide 10, expanded)

When attendees show what they built, use this rubric in your head — and out loud if you're picking a winner.

| Check | Lower bar | Higher bar |
|-------|-----------|------------|
| It runs | Endpoint returns 200 with JSON | Endpoint handles edge cases (no clients, no events) without 500ing |
| Real signal | Queries the Hub | Joins data across 2+ tables |
| Logic | Has a filter or sort | Has weighted scoring with defensible reasoning |
| AI-driven | Mostly written by the agent | Demonstrably iterated — visible diffs from initial generation |
| Story | Can explain who uses it | Can name the AssetMark workflow it would replace |

The fifth row is the customer-obsession test. If they can name Sue's actual job or describe the Monday-morning triage someone does today, they've got it.

---

## 8. Troubleshooting (the panic page)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Agent mode greyed out in Xano | OpenAI key not provisioned for this workspace | Pull Faisal aside; he can hot-patch from a checklist on his laptop |
| `xano push` returns 401 | CLI not authenticated for this instance | `xano login` and re-auth; takes 30 seconds |
| Hub returns 502 | Mock Data Hub workspace went to sleep | Hit the Xano admin UI; resume; refresh |
| Language server squiggles everywhere | VS Code plugin out of date | `code --install-extension xano.xano-vscode --force` |
| AI generates Postgres SQL instead of Xano script | Prompt wasn't specific enough | Add "Use Xano script syntax. Do not write raw SQL." |
| Curl returns the script source as a string | Endpoint not actually deployed; you're hitting the studio | Check the URL — sandbox URLs include `:sandbox`, prod URLs don't |
| Attendee gets 403 on their own workspace | RBAC not applied during provisioning | Faisal can fix in 60 seconds via admin |
| Whole room loses internet | Building wifi flaked | Have a hotspot ready; do the demo from your laptop on cell data |

---

## 9. After the session (within 24 hours)

- [ ] Post the recording (if you recorded) in `#xano-training`.
- [ ] Drop a "what to do next" message in the channel — link to the hackathon, a few of the prompts from §6, the Mock Data Hub URL.
- [ ] Schedule office hours: one Xano person available for 1 hour mid-week between training and June 1.
- [ ] If something broke during the session, write a one-paragraph postmortem and put it in the runbook. The second cohort or the hackathon shouldn't hit the same issue.

---

## 10. The bridge to June 1

The training is the prototype. The hackathon is the ship. Three things to say at the end of the session that you actually mean:

1. Their workspace stays alive between the training and June 1. They can keep building.
2. The Mock Data Hub stays online. They can keep querying.
3. Between today and June 1, they should talk to one person in ops or sales and ask "what's the worst part of your Monday?" That answer is their hackathon project.

The job isn't to teach them Xano. The job is to get them ready to ship something on June 1 that someone in the business will actually want.

Now go.