import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "dist", "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("\n[KnowledgeOS] dist/manifest.json is missing.");
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
  console.error("\n[KnowledgeOS] dist/ contains a PRODUCTION build.");
  console.error("Chrome will NOT hot-reload UI changes from npm run dev.");
  console.error("\nFix:");
  console.error("  1. Stop npm run dev if running");
  console.error("  2. npm run dev:reset");
  console.error("  3. In chrome://extensions load extension/dist (name should be \"KnowledgeOS (Dev)\")");
  console.error("  4. Open a NEW tab to see changes\n");
  process.exit(1);
}

console.log("[KnowledgeOS] Dev dist looks correct (KnowledgeOS Dev).");
