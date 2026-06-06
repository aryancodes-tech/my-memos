import fs from "node:fs";
import path from "node:path";

/** Minimum supported Node.js version for the landing site toolchain. */
const MIN_NODE_MAJOR = 24;
const MIN_NODE_MINOR = 16;
const MIN_NODE_PATCH = 0;

/** Repo root (parent of scripts/). */
const repoRoot = path.resolve(import.meta.dirname, "..");

/**
 * Parses a semver string like "v24.16.0" into numeric [major, minor, patch].
 * Returns null when the version string is invalid.
 */
function parseNodeVersion(version) {
  if (typeof version !== "string" || version.length === 0) return null;

  const match = version.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Returns true when `current` meets or exceeds `minimum`. */
function meetsMinimum(current, minimum) {
  for (let i = 0; i < 3; i += 1) {
    if (current[i] > minimum[i]) return true;
    if (current[i] < minimum[i]) return false;
  }
  return true;
}

/** Reads `.nvmrc` when present so the error message can suggest `nvm use`. */
function readNvmrcVersion() {
  const nvmrcPath = path.join(repoRoot, ".nvmrc");
  if (!fs.existsSync(nvmrcPath)) return "";

  const version = fs.readFileSync(nvmrcPath, "utf8").trim();
  return version.length > 0 ? version : "";
}

const current = parseNodeVersion(process.version);
const minimum = [MIN_NODE_MAJOR, MIN_NODE_MINOR, MIN_NODE_PATCH];

if (!current || !meetsMinimum(current, minimum)) {
  const required = `${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.${MIN_NODE_PATCH}`;
  const nvmrcVersion = readNvmrcVersion();

  console.error("\n[KnowledgeOS] Unsupported Node.js version.");
  console.error(`  Required: Node.js >= ${required}`);
  console.error(`  Current:  ${process.version}`);
  console.error("\nVite 7 and TanStack Start need a current Node release.");
  console.error("Using an older Node version also causes cryptic config load errors.\n");

  if (nvmrcVersion.length > 0) {
    console.error("Fix:");
    console.error("  nvm install");
    console.error("  nvm use");
    console.error("  npm run dev:web\n");
  } else {
    console.error(`Fix: install Node.js ${required} or newer, then rerun the command.\n`);
  }

  process.exit(1);
}
