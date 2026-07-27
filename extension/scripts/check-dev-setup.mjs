import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "dist", "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("\n[MyMemos] dist/manifest.json is missing.");
  console.error("Run: npm run dev");
  console.error("Then load extension/dist in chrome://extensions\n");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const isDev =
  String(manifest.name ?? "").includes("(Dev)") ||
  (Array.isArray(manifest.host_permissions) &&
    manifest.host_permissions.some((entry) => String(entry).includes("localhost:5173")));

if (!isDev) {
  console.error("\n[MyMemos] dist/ contains a PRODUCTION build.");
  console.error(
    "Chrome is loading static bundled files, so edits will NOT appear until you rebuild.",
  );
  console.error("This usually happens after running npm run build while developing.");
  console.error("\nFix (one-time):");
  console.error("  1. Stop npm run dev if running (Ctrl+C)");
  console.error("  2. npm run dev:reset");
  console.error('  3. In chrome://extensions → Reload (name must be "MyMemos (Dev)")');
  console.error("  4. Open a NEW tab");
  console.error("\nDaily workflow:");
  console.error("  - Keep `npm run dev` running in extension/");
  console.error("  - Edit files → changes hot-reload in open tabs");
  console.error("  - Do NOT run npm run build during development\n");
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
  console.error("\n[MyMemos] Dev manifest is correct, but the Vite dev server is not reachable.");
  console.error(`Start it with: npm run dev`);
  console.error("Then reload the extension in chrome://extensions.\n");
  process.exit(1);
}

console.log("[MyMemos] Dev setup looks correct.");
console.log("  - dist/ is a dev build");
console.log(`  - Vite is running on http://localhost:${devPort}`);
console.log('  - Extension name in Chrome should be "MyMemos (Dev)"');
