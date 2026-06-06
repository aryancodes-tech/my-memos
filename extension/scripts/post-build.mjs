import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const dist = path.join(root, "dist");
const pub = path.join(root, "public");

// Copy manifest + background + icons into dist root
for (const f of ["manifest.json", "background.js"]) {
  fs.copyFileSync(path.join(pub, f), path.join(dist, f));
}

// Copy icons folder
const iconsSrc = path.join(pub, "icons");
const iconsDest = path.join(dist, "icons");
if (fs.existsSync(iconsSrc)) {
  fs.mkdirSync(iconsDest, { recursive: true });
  for (const f of fs.readdirSync(iconsSrc)) {
    fs.copyFileSync(path.join(iconsSrc, f), path.join(iconsDest, f));
  }
}

console.log("✓ post-build: manifest, background and icons copied into dist/");
