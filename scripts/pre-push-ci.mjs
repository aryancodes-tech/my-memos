#!/usr/bin/env node
/**
 * Pre-push: auto-fix Prettier/ESLint issues, then run `npm run check`.
 * Full builds stay on `npm run ci` / GitHub Actions.
 *
 * Skip with: SKIP_PRE_PUSH_CI=1 git push ...
 */

import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  banner,
  brand,
  c,
  command,
  errorBlock,
  fail,
  hint,
  ok,
  step,
  warn,
} from "./cli-style.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(commandName, args) {
  const result = spawnSync(commandName, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.error) {
    fail(`Failed to start ${c.bold(commandName)}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status === null ? 1 : result.status);
  }
}

/** Porcelain status snapshot for before/after auto-fix comparison. */
function gitPorcelain() {
  return execFileSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
}

if (process.env.SKIP_PRE_PUSH_CI === "1") {
  warn(`Skipping pre-push checks ${c.dim("(SKIP_PRE_PUSH_CI=1)")}`);
  process.exit(0);
}

banner("pre-push", "format → lint → check");

const before = gitPorcelain();

step("Auto-fixing format / lint…");
run("npm", ["run", "format"]);
run("npx", ["eslint", ".", "--fix"]);

const after = gitPorcelain();

if (after !== before) {
  errorBlock("Working tree changed by auto-fix", [
    "Commit the formatting/lint fixes, then push again:",
  ]);
  command('git add -u && git commit -m "chore: format" && git push');
  console.error("");
  process.exit(1);
}

step(`Running ${c.bold("npm run check")}…`);
run("npm", ["run", "check"]);

ok(`${brand()} pre-push checks passed`);
hint("Full builds still run in CI via npm run ci");
console.log("");
