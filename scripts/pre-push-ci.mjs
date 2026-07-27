#!/usr/bin/env node
/**
 * Pre-push: fast local gate (`npm run check` = lint, format, typecheck, tests).
 * Full builds stay on `npm run ci` / GitHub Actions.
 *
 * Skip with: SKIP_PRE_PUSH_CI=1 git push ...
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (process.env.SKIP_PRE_PUSH_CI === "1") {
  console.log("[MyMemos pre-push] Skipping checks (SKIP_PRE_PUSH_CI=1).");
  process.exit(0);
}

console.log("[MyMemos pre-push] Running npm run check…");

const result = spawnSync("npm", ["run", "check"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

if (result.error) {
  console.error("[MyMemos pre-push] Failed to start checks:", result.error.message);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
