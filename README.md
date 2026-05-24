# AssetMark Advisor Pulse Demo

This repo contains the working demo requested for the Charlotte training:

- **[DEMO-SCRIPT.md](./DEMO-SCRIPT.md)** — podium script for the live Run & Debug demo (prompts, inputs, what to say).
- **[Demo Walkthrough.md](./Demo Walkthrough.md)** — full training playbook.
- `AssetMark Data Hub/` is the mock Snowflake-style customer 360 workspace.
- `AssetHub Demo/` is the Advisor Pulse API workspace that queries the hub.
- `training-assets/mock-data-hub-seed.json` is deterministic seed data.
- `src/` and `tests/` provide a local Node test harness for the pulse rules.

## Live Demo (two instances)

The demo intentionally spans two Xano instances:

| Role | Instance | Workspace | API base |
|------|----------|-----------|----------|
| Mock Data Hub (Snowflake stand-in) | `https://xxmf-qrth-inat.n7d.xano.io` | `128` | `https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub` |
| Advisor Pulse (what attendees build) | `https://x6if-wu0q-dtak.n7.xano.io` | `304` | `https://x6if-wu0q-dtak.n7.xano.io/api:assetmark-advisor-pulse` |

Cross-instance smoke test:

```bash
curl "https://x6if-wu0q-dtak.n7.xano.io/api:assetmark-advisor-pulse/advisors/3/pulse?hub_base_url=https%3A%2F%2Fxxmf-qrth-inat.n7d.xano.io%2Fapi%3Aassetmark-mock-data-hub" | jq
```

Advisor Pulse on Dev Adv calls the hub on Sandbox over REST — same pattern attendees will use in the lab.

## Local Validation

```bash
npm run validate
```

That regenerates the seed fixture and runs the local Advisor Pulse contract tests.

## Xano Push Flow

```bash
# Hub → Sandbox instance
xano workspace push -d "AssetMark Data Hub" -w 128 -p "AssetMark Sandbox" --sync --force

# Advisor Pulse → Dev Adv instance
xano workspace push -d "AssetHub Demo" -w 304 -p "AssetMark Dev Adv" --sync --force
```

Seed the hub on Sandbox:

```bash
node -e 'const fs=require("fs"); const seed=JSON.parse(fs.readFileSync("training-assets/mock-data-hub-seed.json","utf8")); fetch("https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub/admin/seed", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({seed})}).then(async r=>{console.log(r.status); console.log(await r.text()); if(!r.ok) process.exit(1);})'
```

CLI profiles: `AssetMark Sandbox` and `AssetMark Dev Adv`.
