import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { c, command, errorBlock, hint, kv } from "./cli-style.mjs";

/** Fallback minimum when package.json engines.node is missing or unparsable. */
const FALLBACK_MIN_NODE = [20, 19, 0];

/** Repo root (parent of scripts/). */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Parses a semver string like "v24.15.0" into numeric [major, minor, patch].
 * Returns null when the version string is invalid.
 */
function parseNodeVersion(version) {
  if (typeof version !== "string" || version.length === 0) return null;

  const match = version.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Reads the minimum Node version from package.json engines.node (e.g. ">=20.19.0"). */
function readMinimumFromPackageJson() {
  const packageJsonPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) return FALLBACK_MIN_NODE;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const enginesNode = packageJson.engines?.node ?? "";
  if (typeof enginesNode !== "string" || enginesNode.length === 0) {
    return FALLBACK_MIN_NODE;
  }

  const match = enginesNode.match(/>=\s*(\d+)\.(\d+)\.(\d+)/);
  if (!match) return FALLBACK_MIN_NODE;

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

function formatVersion(parts) {
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

const current = parseNodeVersion(process.version);
const minimum = readMinimumFromPackageJson();

if (!current || !meetsMinimum(current, minimum)) {
  const required = formatVersion(minimum);
  const nvmrcVersion = readNvmrcVersion();

  errorBlock("Unsupported Node.js version", [
    kv("Required", c.bold(`>= ${required}`)),
    kv("Current", c.brightRed(process.version)),
    "",
    "Vite 7 and TanStack Start need a current Node release.",
    "Older Node versions also cause cryptic config load errors.",
  ]);

  if (nvmrcVersion.length > 0) {
    console.error(`  ${c.bold("Fix")}`);
    command("nvm install");
    command("nvm use");
    command("npm run build:web");
    console.error("");
    hint(`(.nvmrc recommends ${nvmrcVersion})`);
    console.error("");
  } else {
    console.error(`  ${c.bold("Fix")}`);
    hint(`Install Node.js ${required} or newer, then rerun the command.`);
    console.error("");
  }

  process.exit(1);
}
