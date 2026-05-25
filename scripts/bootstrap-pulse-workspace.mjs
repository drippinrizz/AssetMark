#!/usr/bin/env node
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const profile = process.env.XANO_PROFILE ?? "AssetMark Dev Adv";
const workspaceId = process.env.XANO_WORKSPACE_ID ?? "304";

function run(command) {
  console.log(`\n→ ${command}\n`);
  execSync(command, { stdio: "inherit", cwd: root });
}

console.log("Bootstrapping Advisor Pulse workspace 304 (hub untouched)");

run(
  `xano workspace push -d "AssetHub Demo" -w ${workspaceId} -p "${profile}" --sync --env --force`,
);
run("npm run seed:demo-user");
run("npm run deploy:ui");

console.log("\nDone.");
console.log("UI: https://default-dev-8df103-x6if-wu0q-dtak.n7.xano.io");
console.log("Login: advisor.demo@assetmark.com / DemoPass123!");
