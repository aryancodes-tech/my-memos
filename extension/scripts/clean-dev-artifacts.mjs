import fs from "node:fs";
import path from "node:path";

import { banner, bullet, ok } from "../../scripts/cli-style.mjs";

const root = process.cwd();
const devSessionPath = path.join(root, ".dev-session");

for (const target of ["dist", ".vite"]) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}

fs.writeFileSync(devSessionPath, `${Date.now()}\n`, "utf8");

banner("dev:reset", "fresh CRXJS workspace");
ok("Prepared dev workspace");
bullet("Removed dist/ and .vite/");
bullet("Wrote .dev-session marker");
console.log("");
