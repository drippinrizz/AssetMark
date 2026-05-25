#!/usr/bin/env node
/**
 * Reset Advisor Pulse workspace 304 to an empty baseline (env only, no APIs).
 * Does NOT touch the Mock Data Hub on Sandbox workspace 128.
 *
 * Usage:
 *   npm run reset:pulse
 *   npm run reset:pulse -- --sandbox          # also wipe ephemeral sandbox
 *   npm run reset:pulse -- --stage 1          # push Prompt-1 snapshot instead of empty
 *   npm run reset:pulse -- --stage 2          # push Prompt-2 / final snapshot
 */

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const args = process.argv.slice(2);
const withSandbox = args.includes("--sandbox");
const stageArg = args.find((a) => a.startsWith("--stage"));
const stage = stageArg ? stageArg.split("=")[1] ?? args[args.indexOf("--stage") + 1] : null;

const profile = process.env.XANO_PROFILE ?? "AssetMark Dev Adv";
const workspaceId = process.env.XANO_WORKSPACE_ID ?? "304";

function run(cmd) {
  console.log(`\n→ ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}

function stageDir(name) {
  const map = {
    1: join(root, "training-assets/stages/01-prompt-1"),
    2: join(root, "training-assets/stages/02-prompt-2"),
  };
  const dir = map[name];
  if (!dir) {
    console.error(`Unknown stage "${name}". Use 1 or 2.`);
    process.exit(1);
  }
  return dir;
}

function buildPushDir() {
  if (!stage) {
    return join(root, "training-assets/reset-pulse");
  }

  const tmp = mkdtempSync(join(root, ".tmp-reset-pulse-"));
  mkdirSync(join(tmp, "api/advisor_pulse"), { recursive: true });
  cpSync(
    join(root, "AssetHub Demo/api/advisor_pulse/api_group.xs"),
    join(tmp, "api/advisor_pulse/api_group.xs"),
  );
  cpSync(
    join(stageDir(stage), "advisor_pulse_get.xs"),
    join(tmp, "api/advisor_pulse/advisor_pulse_get.xs"),
  );
  cpSync(
    join(root, "training-assets/reset-pulse/workspace"),
    join(tmp, "workspace"),
    { recursive: true },
  );
  return tmp;
}

console.log("Advisor Pulse reset");
console.log(`  workspace: ${workspaceId}`);
console.log(`  profile:   ${profile}`);
console.log(`  hub:       untouched (Sandbox 128)`);
console.log(
  `  target:    ${stage ? `stage ${stage} snapshot` : "empty (env only, APIs deleted)"}`,
);

const pushDir = buildPushDir();

try {
  run(
    `xano workspace push -d "${pushDir}" -w ${workspaceId} -p "${profile}" --sync --delete --env --force`,
  );

  if (withSandbox) {
    run("xano sandbox reset --force");
    console.log("Ephemeral sandbox reset.");
  }

  console.log("\nDone. Pulse workspace ready for the next cohort.");
  if (!stage) {
    console.log("  → Workspace 304 has env set; no pulse API yet (build with Prompt 1).");
  }
} finally {
  if (stage && existsSync(pushDir)) {
    rmSync(pushDir, { recursive: true, force: true });
  }
}
