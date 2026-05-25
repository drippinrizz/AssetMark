#!/usr/bin/env node
/**
 * Reset Advisor Pulse workspace 304 for the next cohort.
 * Removes pulse APIs/functions but keeps auth + user table + workspace env.
 * Does NOT touch the Mock Data Hub on Sandbox workspace 128.
 *
 * Usage:
 *   npm run reset:pulse
 *   npm run reset:pulse -- --sandbox          # also wipe ephemeral sandbox
 *   npm run reset:pulse -- --stage 1          # reset to Prompt-1 snapshot (+ auth)
 *   npm run reset:pulse -- --stage 2          # reset to Prompt-2 snapshot (+ auth)
 */

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const baselineDir = join(root, "training-assets/reset-pulse");

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

function copyAuthBaseline(targetDir) {
  cpSync(join(baselineDir, "workspace"), join(targetDir, "workspace"), { recursive: true });
  cpSync(join(baselineDir, "table"), join(targetDir, "table"), { recursive: true });
  cpSync(join(baselineDir, "api/authentication"), join(targetDir, "api/authentication"), {
    recursive: true,
  });
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
    return baselineDir;
  }

  const tmp = mkdtempSync(join(root, ".tmp-reset-pulse-"));
  copyAuthBaseline(tmp);

  mkdirSync(join(tmp, "api/advisor_pulse"), { recursive: true });
  cpSync(
    join(root, "AssetHub Demo/api/advisor_pulse/api_group.xs"),
    join(tmp, "api/advisor_pulse/api_group.xs"),
  );
  cpSync(
    join(stageDir(stage), "advisor_pulse_get.xs"),
    join(tmp, "api/advisor_pulse/advisor_pulse_get.xs"),
  );

  if (stage === "2") {
    cpSync(
      join(root, "AssetHub Demo/functions/advisor_pulse"),
      join(tmp, "functions/advisor_pulse"),
      { recursive: true },
    );
    cpSync(
      join(root, "AssetHub Demo/api/advisor_pulse/pulse_me_get.xs"),
      join(tmp, "api/advisor_pulse/pulse_me_get.xs"),
    );
  }

  return tmp;
}

console.log("Advisor Pulse reset");
console.log(`  workspace: ${workspaceId}`);
console.log(`  profile:   ${profile}`);
console.log(`  hub:       untouched (Sandbox 128)`);
console.log(`  keeps:     user table + auth API + workspace env`);
console.log(
  `  target:    ${stage ? `stage ${stage} snapshot + auth` : "auth only — pulse APIs removed"}`,
);

const pushDir = buildPushDir();
const tempDir = stage ? pushDir : null;

try {
  run(
    `xano workspace push -d "${pushDir}" -w ${workspaceId} -p "${profile}" --sync --delete --env --force`,
  );

  run("npm run seed:demo-user");

  if (withSandbox) {
    run("xano sandbox reset --force");
    console.log("Ephemeral sandbox reset.");
  }

  console.log("\nDone. Pulse workspace ready for the next cohort.");
  if (!stage) {
    console.log("  → Auth + demo user intact. Build pulse with Prompt 1.");
    console.log("  → UI login still works; /pulse/me returns after the build.");
  }
} finally {
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
