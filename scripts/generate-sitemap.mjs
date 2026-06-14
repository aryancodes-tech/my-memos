import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** Paths excluded from search indexing via robots.txt. */
const SEO_ROBOTS_DISALLOW_PATHS = ["/demo/"];

/**
 * Resolves the site origin for generated SEO files.
 * Priority: VITE_SITE_URL → Vercel production domain → Vercel deploy URL → localhost.
 */
function resolveSiteOrigin() {
  const fromEnv = process.env.VITE_SITE_URL;
  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }

  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (typeof productionDomain === "string" && productionDomain.length > 0) {
    return `https://${productionDomain.replace(/\/$/, "")}`;
  }

  const deployDomain = process.env.VERCEL_URL;
  if (typeof deployDomain === "string" && deployDomain.length > 0) {
    return `https://${deployDomain.replace(/\/$/, "")}`;
  }

  return "http://localhost:8080";
}

/** Builds robots.txt with an absolute sitemap URL (required by Google). */
function buildRobotsTxt(origin) {
  const disallowLines = SEO_ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`).join("\n");
  const sitemapUrl = `${origin}/sitemap.xml`;

  return ["User-agent: *", "Allow: /", disallowLines, "", `Sitemap: ${sitemapUrl}`, ""].join("\n");
}

/** Builds the XML sitemap for indexable marketing URLs. */
function buildSitemapXml(origin) {
  const lastmod = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

const origin = resolveSiteOrigin();
const publicDir = resolve(process.cwd(), "public");

writeFileSync(resolve(publicDir, "robots.txt"), buildRobotsTxt(origin), "utf8");
writeFileSync(resolve(publicDir, "sitemap.xml"), buildSitemapXml(origin), "utf8");

console.log(`[MyMemos] Wrote SEO files for ${origin} → public/robots.txt, public/sitemap.xml`);
