import fs from "node:fs";
import path from "node:path";

import {
  banner,
  bullet,
  c,
  command,
  errorBlock,
  ok,
  path as stylePath,
} from "../../scripts/cli-style.mjs";

const root = process.cwd();
const manifestPath = path.join(root, "dist", "manifest.json");

if (!fs.existsSync(manifestPath)) {
  errorBlock("dist/manifest.json is missing", [
    "Start the extension dev server, then load the unpacked build:",
  ]);
  command("npm run dev");
  console.error(`  ${c.dim("Then load extension/dist from your browser's extensions page")}`);
  console.error("");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const isDev =
  String(manifest.name ?? "").includes("(Dev)") ||
  (Array.isArray(manifest.host_permissions) &&
    manifest.host_permissions.some((entry) => String(entry).includes("localhost:5173")));

if (!isDev) {
  errorBlock("dist/ contains a PRODUCTION build", [
    "The browser is loading static bundled files — edits will NOT hot-reload.",
    "This usually happens after running npm run build while developing.",
    "",
    c.bold("Fix (one-time)"),
  ]);
  const steps = [
    "Stop npm run dev if running (Ctrl+C)",
    "npm run dev:reset",
    'On the extensions page → Reload (name must be "MyMemos (Dev)")',
    "Open a NEW tab",
  ];
  for (let i = 0; i < steps.length; i += 1) {
    console.error(`  ${c.cyan(`${i + 1}.`)} ${steps[i]}`);
  }
  console.error("");
  console.error(`  ${c.bold("Daily workflow")}`);
  console.error(`  ${c.dim("•")} Keep ${c.bold("npm run dev")} running in extension/`);
  console.error(`  ${c.dim("•")} Edit files → changes hot-reload in open tabs`);
  console.error(`  ${c.dim("•")} Do NOT run npm run build during development`);
  console.error("");
  process.exit(1);
}

const devPort = 5173;
let devServerUp = false;

try {
  const response = await fetch(`http://127.0.0.1:${devPort}/@vite/env`);
  devServerUp = response.ok;
} catch {
  devServerUp = false;
}

if (!devServerUp) {
  errorBlock("Dev manifest OK, but Vite is not reachable", [
    `Expected the dev server on ${stylePath(`http://localhost:${devPort}`)}`,
  ]);
  command("npm run dev");
  console.error(`  ${c.dim("Then reload the extension on your browser's extensions page")}`);
  console.error("");
  process.exit(1);
}

banner("dev:check", "extension setup");
ok("Dev setup looks correct");
bullet(`dist/ is a ${c.bold("dev")} build`);
bullet(`Vite is running on ${stylePath(`http://localhost:${devPort}`)}`);
bullet(`Extension name should be ${c.bold('"MyMemos (Dev)"')}`);
console.log("");
