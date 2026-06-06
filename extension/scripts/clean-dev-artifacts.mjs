import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const devSessionPath = path.join(root, ".dev-session");

for (const target of ["dist", ".vite"]) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}

fs.writeFileSync(devSessionPath, `${Date.now()}\n`, "utf8");

console.log("Prepared dev workspace — removed dist/ and .vite/ for a fresh CRXJS dev build.");
