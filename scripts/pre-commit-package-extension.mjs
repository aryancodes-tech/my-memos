#!/usr/bin/env node
/**
 * Pre-commit: rebuild `public/mymemos-extension.zip` when extension-related
 * sources change, then stage the ZIP so the landing download stays current.
 *
 * Skip with: SKIP_EXTENSION_PACKAGE=1 git commit ...
 * Force path match even when unsure: PACKAGE_EXTENSION=1 git commit ...
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicZip = path.join(root, "public", "mymemos-extension.zip");
const extensionZip = path.join(root, "extension", "mymemos-extension.zip");
const devSessionPath = path.join(root, "extension", ".dev-session");
const DEV_PORT = 5173;

/** Staged paths that should trigger a fresh extension ZIP. */
const TRIGGER_PATTERNS = [
  /^extension\//,
  /^shared\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^\.nvmrc$/,
];

/** Paths under extension/ that do not affect the packaged ZIP. */
const EXTENSION_IGNORE = [
  /^extension\/README\.md$/,
  /^extension\/.*\.test\.ts$/,
  /^extension\/mymemos-extension\.zip$/,
  /^extension\/dist\//,
  /^extension\/\.vite\//,
];

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** Returns true when something is listening on the extension Vite port. */
function isDevPortInUse() {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(true));
    probe.once("listening", () => {
      probe.close(() => resolve(false));
    });
    probe.listen(DEV_PORT, "127.0.0.1");
  });
}

function stagedFiles() {
  const out = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  if (!out) return [];
  return out.split("\n").filter(Boolean);
}

function shouldPackage(files) {
  if (process.env.PACKAGE_EXTENSION === "1") return true;

  return files.some((file) => {
    if (EXTENSION_IGNORE.some((re) => re.test(file))) return false;
    return TRIGGER_PATTERNS.some((re) => re.test(file));
  });
}

function fail(message) {
  console.error(`\n[MyMemos pre-commit] ${message}\n`);
  process.exit(1);
}

const files = stagedFiles();
if (!shouldPackage(files)) {
  process.exit(0);
}

if (process.env.SKIP_EXTENSION_PACKAGE === "1") {
  console.log(
    "[MyMemos pre-commit] Skipping extension package (SKIP_EXTENSION_PACKAGE=1).",
  );
  process.exit(0);
}

const devPortBusy = await isDevPortInUse();
const hasDevSession = fs.existsSync(devSessionPath);

if (devPortBusy || hasDevSession) {
  fail(
    [
      "Extension sources changed, but packaging would overwrite extension/dist/",
      "while `npm run dev` is active (HMR would break).",
      "",
      "Options:",
      "  1. Stop `npm run dev`, then commit again",
      "  2. SKIP_EXTENSION_PACKAGE=1 git commit ...  (commit without refreshing the ZIP)",
    ].join("\n"),
  );
}

console.log("[MyMemos pre-commit] Packaging extension ZIP for landing download…");

const result = spawnSync("npm", ["run", "package:extension"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, FORCE_BUILD: "1" },
});

if (result.status !== 0) {
  fail("npm run package:extension failed. Fix the build or skip with SKIP_EXTENSION_PACKAGE=1.");
}

const toStage = [publicZip, extensionZip].filter((file) => fs.existsSync(file));
if (toStage.length === 0) {
  fail("package:extension finished but no ZIP was found under public/ or extension/.");
}

execFileSync("git", ["add", "--", ...toStage], { cwd: root, stdio: "inherit" });
console.log("[MyMemos pre-commit] Staged updated extension ZIP(s).");
