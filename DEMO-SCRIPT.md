# Advisor Pulse — Live Demo Script (Run & Debug)

Use this at the podium. The hub is pre-staged; you build **Advisor Pulse** live on Dev Adv using VS Code **Run & Debug**.

---

## Sticky note (keep visible)

```
HUB (read-only, Sandbox):
https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub

YOU BUILD HERE (Dev Adv):
https://x6if-wu0q-dtak.n7.xano.io
workspace: AssetMark Advisor Pulse Demo (304)

Demo advisor_id: 3
Demo client to call out: Maria Vasquez (client_id 47)
```

Hub endpoints the pulse service calls:

- `GET /clients?advisor_id=3`
- `GET /applications?client_id={id}`
- `GET /clients/{id}/events`
- `GET /transcripts?client_id={id}`

---

## Architecture (say this once)

| Role | Instance | Workspace |
|------|----------|-----------|
| Mock Data Hub (Snowflake stand-in) | `xxmf-qrth-inat.n7d.xano.io` (Sandbox) | **128** |
| Advisor Pulse (what you build) | `x6if-wu0q-dtak.n7.xano.io` (Dev Adv) | **304** |

Pulse on Dev Adv calls the hub on Sandbox over REST. Attendees do the same in the lab.

---

## Before the room (5 min)

1. Open this repo in VS Code (Xano plugin + language server enabled).
2. CLI profiles ready: `AssetMark Sandbox`, `AssetMark Dev Adv`.
3. Hub seeded on Sandbox workspace **128** (re-seed only if tables look empty).
4. Empty-ish folder mindset: you'll generate into `AssetHub Demo/` live, or use repo files as recovery.
5. Bump font sizes. Close Slack/email.

**You are NOT building the hub live.** You're building Advisor Pulse on Dev Adv that queries the hub.

---

## Two workspaces = two Run & Debug targets

| What you're debugging | Xano plugin connection | File |
|----------------------|------------------------|------|
| Hub (show data exists) | Sandbox → workspace **128** | `AssetMark Data Hub/api/mock_data_hub/*.xs` |
| Advisor Pulse (the build) | Dev Adv → workspace **304** | `AssetHub Demo/api/advisor_pulse/advisor_pulse_get.xs` |

Switch workspace in the Xano VS Code plugin when you change folders. Don't debug pulse while pointed at 128.

---

## Beat 1 — Frame (30 sec)

> "I'm going to build a small API that tells an advisor which clients need attention — stalled account openings, no contact in 30 days, bad call sentiment. The CRM data lives on a **separate** Xano instance, like Snowflake. I'm building the service here; it pulls from there over REST. Watch three things: how little I type, how much I **review**, and where I push back when the AI gets it wrong."

---

## Beat 2 — Show the hub (2 min)

Connect VS Code / Xano to **Sandbox / 128**. Open `AssetMark Data Hub/api/mock_data_hub/clients_get.xs`.

**Run & Debug input:**

```json
{ "advisor_id": 3 }
```

Say: *"This is our fake Snowflake — read-only CRM on another instance."*

In Xano UI (Sandbox, workspace 128): open `account_applications`, filter `status = needs_info`, sort by `status_changed_at`. Click client **47 / Maria Vasquez**.

> "That's the customer-obsession problem hiding in a table. Now I'll teach the AI to find it."

---

## Beat 3 — Build with agent (10–15 min)

Switch to agent mode. Open a clean context or `AssetHub Demo/`.

**Prompt 1 — paste verbatim:**

```
Build an Advisor Pulse API in XanoScript (.xs files).

One endpoint: GET /advisors/{advisor_id}/pulse

Return a JSON array of that advisor's clients who need attention, highest priority first.

Flag a client if ANY of these is true:
1. account_application with status "needs_info" for 14+ days (use status_changed_at)
2. no engagement_event in the last 30 days (use occurred_at)
3. most recent call_transcript has sentiment_label = "negative"

The Mock Data Hub is on a DIFFERENT Xano instance. Base URL:
https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub

Pull data via api.request from:
- GET /clients?advisor_id={advisor_id}
- GET /applications?client_id={client_id}
- GET /clients/{client_id}/events
- GET /transcripts?client_id={client_id}

Each result object:
- client_id, advisor_id, name, reason, reason_detail, days_since_last_contact, priority_score

Reasons: stalled_application | no_recent_contact | negative_sentiment

Priority: stalled_application highest, then negative_sentiment (95), then no_recent_contact.

Use XanoScript syntax only — not SQL, not JavaScript.
Organize as api_group + query file(s) under api/.
Auth: none (training demo).
Read hub URL from $env.MOCK_DATA_HUB_BASE_URL when set; allow optional hub_base_url input override.
```

**While it generates, narrate:**

- "It's writing external API calls — that's the Snowflake stand-in."
- "Language server caught a field name — good, that's review."
- "One construct per .xs file."

Connect to **Dev Adv / 304**. Open `advisor_pulse_get.xs`.

**Run & Debug input:**

```json
{
  "advisor_id": 3,
  "hub_base_url": "https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub"
}
```

**Good result:** array with Maria Vasquez first, `reason: "stalled_application"`.

> "Pulse runs on Dev Adv. It called Sandbox over REST. Maria matches the row we saw in the hub."

---

## Beat 4 — Iterate (3 min)

> "Now watch — one more rule."

**Prompt 2:**

```
Add a fourth rule: clients with household_assets_usd > 1,000,000
with no engagement_event in the last 14 days should also be flagged.

Add reason: high_value_stale
priority_score: above no_recent_contact, below negative_sentiment.
Keep the response shape the same.
```

Run & Debug again with the same JSON. Point at Patricia Lim (`client_id 89`, `high_value_stale`).

> "That whole loop — added a rule, regenerated, Run & Debug, validated — is why we're here."

---

## Beat 5 — Push with env (promote)

Run & Debug reads env from the local `workspace/*.xs` file. **Push with `--env`** to sync that file (and the hub URL) to the remote workspace metadata.

```bash
xano workspace push -d "AssetHub Demo" -w 304 -p "AssetMark Dev Adv" --sync --env --force
```

Env lives in:

```
AssetHub Demo/workspace/asset_mark_advisor_pulse_demo.xs
```

```xs
env = {
  MOCK_DATA_HUB_BASE_URL: "https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub"
}
```

**Run & Debug input (after env push + local workspace file present):**

```json
{ "advisor_id": 3 }
```

**Live HTTP / curl** still needs the query param on Dev Adv today (workspace env is stored but not injected into `$env` at HTTP runtime):

```bash
curl "https://x6if-wu0q-dtak.n7.xano.io/api:assetmark-advisor-pulse/advisors/3/pulse?hub_base_url=https%3A%2F%2Fxxmf-qrth-inat.n7d.xano.io%2Fapi%3Aassetmark-mock-data-hub" | jq
```

> "Run & Debug is our tight loop — env comes from the workspace file. Push with `--env` promotes code and config. Curl proves the deployed endpoint."

### Env push test results (verified)

| Check | Result |
|-------|--------|
| `workspace push --env` succeeds | ✅ |
| Pull shows `MOCK_DATA_HUB_BASE_URL` in `workspace/*.xs` | ✅ |
| Run & Debug with `{ "advisor_id": 3 }` only | ✅ use this in the room |
| HTTP without `hub_base_url` param | ❌ 400 — pass param for curl |
| HTTP with `hub_base_url` param | ✅ Maria first |

---

## Run & Debug inputs cheat sheet

| Endpoint | Workspace | Input JSON |
|----------|-----------|------------|
| `GET /clients` | 128 | `{ "advisor_id": 3 }` |
| `GET /applications` | 128 | `{ "client_id": 47 }` |
| `GET /clients/{id}/events` | 128 | `{ "client_id": 47 }` |
| `GET /transcripts` | 128 | `{ "client_id": 112 }` |
| **`GET /advisors/{id}/pulse`** | **304** | `{ "advisor_id": 3 }` *(Run & Debug — env from local `workspace/*.xs`)* |

For **curl / live HTTP**, add the hub override:

```json
{
  "advisor_id": 3,
  "hub_base_url": "https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub"
}
```

Or as query param: `?hub_base_url=https%3A%2F%2Fxxmf-qrth-inat.n7d.xano.io%2Fapi%3Aassetmark-mock-data-hub`

---

## Expected live result (advisor 3)

| client_id | name | reason |
|-----------|------|--------|
| 47 | Maria Vasquez | `stalled_application` (first) |
| 112 | Daniel Okafor | `negative_sentiment` |
| 89 | Patricia Lim | `high_value_stale` |

---

## If Run & Debug fails

| Symptom | Fix |
|--------|-----|
| Empty array | Wrong workspace (need 304) or missing `hub_base_url` |
| Can't reach hub | Use full base URL including `api:assetmark-mock-data-hub` |
| Wrong instance | Re-select workspace in Xano plugin |
| Stale code | Save file, re-run; push if remote is behind |
| AI writes SQL/JS | "Use XanoScript .xs syntax only" |
| 500 on pulse | Hub returns epoch ms timestamps — don't `\|to_ms` them again |

**Recovery:** use committed files in `AssetHub Demo/api/advisor_pulse/`.

---

## Attendee handout (lab)

Same hub URL sticky note. They build in their own Dev Adv workspace. Same Prompt 1, pointed at the hub. No Snowflake access needed.

---

## Local tests (optional, pre-room)

```bash
npm run validate
```

---

## CLI reference

```bash
# Hub → Sandbox
xano workspace push -d "AssetMark Data Hub" -w 128 -p "AssetMark Sandbox" --sync --force

# Pulse → Dev Adv (include --env)
xano workspace push -d "AssetHub Demo" -w 304 -p "AssetMark Dev Adv" --sync --env --force

# Seed hub
node -e 'const fs=require("fs"); const seed=JSON.parse(fs.readFileSync("training-assets/mock-data-hub-seed.json","utf8")); fetch("https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub/admin/seed", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({seed})}).then(async r=>{console.log(r.status); console.log(await r.text()); if(!r.ok) process.exit(1);})'
```
