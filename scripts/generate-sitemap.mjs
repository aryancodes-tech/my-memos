import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** Site origin without trailing slash; overridden by VITE_SITE_URL at build time. */
const SITE_ORIGIN = (process.env.VITE_SITE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const LASTMOD = new Date().toISOString().slice(0, 10);
const OUTPUT_PATH = resolve(process.cwd(), "public/sitemap.xml");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_ORIGIN}/</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

writeFileSync(OUTPUT_PATH, sitemap, "utf8");
console.log(`[MyMemos] Wrote sitemap for ${SITE_ORIGIN} → public/sitemap.xml`);
