# Demo stages (rehearsal snapshots)

The live demo has three testable stages. **`AssetHub Demo/` is the final build** (Prompt 2 complete). Use these snapshots to rehearse each beat without faking it.

| Stage | Folder | What changed | Test input | Pass criteria |
|-------|--------|--------------|------------|---------------|
| **1 — Prompt 1** | `01-prompt-1/` | 3 rules only; hub from `$env` / `hub_base_url` | `{ "advisor_id": 3 }` | Maria (47) first, Daniel (112) second; **no** `high_value_stale`; Patricia (89) **absent** |
| **2 — Prompt 2** | `02-prompt-2/` (same as `AssetHub Demo/api/`) | Adds `high_value_stale` rule | `{ "advisor_id": 3 }` | Patricia (89) appears with `high_value_stale` |
| **3 — Promote** | final in `AssetHub Demo/` | Sandbox env + push + review | same | Promote to workspace 304; curl returns Maria first |

## Load a stage into ephemeral sandbox

```bash
# Stage 1 example
mkdir -p /tmp/pulse-sandbox && cp -R "AssetHub Demo/api/advisor_pulse/api_group.xs" /tmp/pulse-sandbox/api/advisor_pulse/
cp "training-assets/stages/01-prompt-1/advisor_pulse_get.xs" /tmp/pulse-sandbox/api/advisor_pulse/

xano sandbox env set -n MOCK_DATA_HUB_BASE_URL \
  --value "https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub"
xano sandbox push -d /tmp/pulse-sandbox --sync --force
xano sandbox review --url-only
```

## Load final build

```bash
mkdir -p /tmp/pulse-sandbox && cp -R "AssetHub Demo/api" /tmp/pulse-sandbox/
xano sandbox env set -n MOCK_DATA_HUB_BASE_URL \
  --value "https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub"
xano sandbox push -d /tmp/pulse-sandbox --sync --force
xano sandbox review --url-only
```

Copy `02-prompt-2/advisor_pulse_get.xs` from `AssetHub Demo/api/advisor_pulse/advisor_pulse_get.xs` when rehearsing Prompt 2 — or paste Prompt 2 in the agent and diff against stage 1.

## Reset pulse workspace between cohorts

Does **not** touch the hub (Sandbox 128).

```bash
# Empty workspace 304 — env only, delete all pulse APIs (default for live cohorts)
npm run reset:pulse

# Also wipe ephemeral sandbox
npm run reset:pulse -- --sandbox

# Rehearsal: reset to a known stage instead of empty
npm run reset:pulse -- --stage 1
npm run reset:pulse -- --stage 2
```
