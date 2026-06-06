import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

for (const target of ["dist", ".vite"]) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}

console.log("Prepared dev workspace — removed dist/ and .vite/ for a fresh CRXJS dev build.");
