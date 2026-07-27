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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.error) {
    console.error(`[MyMemos pre-push] Failed to start ${command}:`, result.error.message);
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
  console.log("[MyMemos pre-push] Skipping checks (SKIP_PRE_PUSH_CI=1).");
  process.exit(0);
}

const before = gitPorcelain();

console.log("[MyMemos pre-push] Auto-fixing format/lint…");
run("npm", ["run", "format"]);
run("npx", ["eslint", ".", "--fix"]);

const after = gitPorcelain();

if (after !== before) {
  console.error(
    [
      "",
      "[MyMemos pre-push] Auto-fixed formatting/lint issues in the working tree.",
      "Commit those changes, then push again:",
      "",
      '  git add -u && git commit -m "chore: format" && git push',
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("[MyMemos pre-push] Running npm run check…");
run("npm", ["run", "check"]);
