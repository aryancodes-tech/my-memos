import fs from "node:fs";
import path from "node:path";

const devSessionPath = path.join(process.cwd(), ".dev-session");

if (fs.existsSync(devSessionPath)) {
  fs.rmSync(devSessionPath, { force: true });
}

console.log("[KnowledgeOS] Production build complete. Run npm run dev to restore live reload.");
