import fs from "node:fs";
import path from "node:path";

import { banner, hint, ok, step } from "../../scripts/cli-style.mjs";

const devSessionPath = path.join(process.cwd(), ".dev-session");

if (fs.existsSync(devSessionPath)) {
  fs.rmSync(devSessionPath, { force: true });
}

banner("build", "production extension");
ok("Production build complete");
step("Cleared .dev-session marker");
hint("Run npm run dev to restore live reload");
console.log("");
