#!/usr/bin/env node
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const staticDir = join(root, "AssetHub Demo/static");
const profile = process.env.XANO_PROFILE ?? "AssetMark Dev Adv";
const workspaceId = process.env.XANO_WORKSPACE_ID ?? "304";
const hostName = process.env.XANO_STATIC_HOST ?? "default";
const buildName = process.env.XANO_STATIC_BUILD ?? "demo-v1";

const tmp = mkdtempSync(join(root, ".tmp-static-"));
const zipPath = join(tmp, "static.zip");

mkdirSync(tmp, { recursive: true });
execSync(`cd "${staticDir}" && zip -r "${zipPath}" .`, { stdio: "inherit" });

const createCmd =
  `xano static_host build create ${hostName} -f "${zipPath}" -n "${buildName}" ` +
  `-w ${workspaceId} -p "${profile}" -d "Advisor Pulse demo UI" -o json`;

console.log(createCmd);
const output = execSync(createCmd, { encoding: "utf8" });
console.log(output);

rmSync(tmp, { recursive: true, force: true });
