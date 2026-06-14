import {
  DEMO_PATH,
  GITHUB_REPO_URL,
  LANDING_META_DESCRIPTION,
  LANDING_PAGE_TITLE,
  PRODUCT_NAME,
  SEO_ROBOTS_DISALLOW_PATHS,
  SITE_OG_IMAGE_PATH,
  SITE_ORIGIN,
} from "@/lib/constants";

/** TanStack Router `head()` meta entry. */
export type SeoMetaTag = {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
  charSet?: string;
};

/** TanStack Router `head()` link entry. */
export type SeoLinkTag = {
  rel: string;
  href: string;
  type?: string;
};

/** TanStack Router `head()` script entry for JSON-LD. */
export type SeoScriptTag = {
  type: string;
  children: string;
};

/** Resolved site origin with optional request-time fallback. */
export function resolveSiteOrigin(fallbackOrigin?: string): string {
  if (SITE_ORIGIN.length > 0) {
    return SITE_ORIGIN;
  }

  if (fallbackOrigin !== undefined && fallbackOrigin.length > 0) {
    return fallbackOrigin.replace(/\/$/, "");
  }

  return "http://localhost:8080";
}

/** Builds an absolute URL from a site origin and path segment. */
export function buildAbsoluteUrl(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

/** Homepage `<head>` meta tags for search and social previews. */
export function buildLandingMetaTags(origin: string): SeoMetaTag[] {
  const canonicalUrl = buildAbsoluteUrl(origin, "/");
  const ogImageUrl = buildAbsoluteUrl(origin, SITE_OG_IMAGE_PATH);

  return [
    { title: LANDING_PAGE_TITLE },
    { name: "description", content: LANDING_META_DESCRIPTION },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: LANDING_PAGE_TITLE },
    { property: "og:description", content: LANDING_META_DESCRIPTION },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: PRODUCT_NAME },
    { property: "og:image", content: ogImageUrl },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: LANDING_PAGE_TITLE },
    { name: "twitter:description", content: LANDING_META_DESCRIPTION },
    { name: "twitter:image", content: ogImageUrl },
  ];
}

/** Homepage `<head>` link tags including canonical URL. */
export function buildLandingLinkTags(origin: string): SeoLinkTag[] {
  return [
    {
      rel: "canonical",
      href: buildAbsoluteUrl(origin, "/"),
    },
  ];
}

/** JSON-LD scripts describing the product and website. */
export function buildLandingJsonLdScripts(origin: string): SeoScriptTag[] {
  const pageUrl = buildAbsoluteUrl(origin, "/");
  const imageUrl = buildAbsoluteUrl(origin, SITE_OG_IMAGE_PATH);
  const demoUrl = buildAbsoluteUrl(origin, DEMO_PATH);

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: PRODUCT_NAME,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Chrome",
    description: LANDING_META_DESCRIPTION,
    url: pageUrl,
    image: imageUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Replaces Chrome New Tab",
      "Local-first offline storage",
      "Notion-style block editor",
      "Instant fuzzy search",
    ],
    downloadUrl: pageUrl,
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: PRODUCT_NAME,
    url: pageUrl,
    description: LANDING_META_DESCRIPTION,
    potentialAction: {
      "@type": "ViewAction",
      target: demoUrl,
      name: "Try live demo",
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PRODUCT_NAME,
    url: pageUrl,
    sameAs: [GITHUB_REPO_URL],
  };

  return [softwareApplication, webSite, organization].map((schema) => ({
    type: "application/ld+json",
    children: JSON.stringify(schema),
  }));
}

/** Plain-text robots.txt body for crawler directives. */
export function buildRobotsTxt(origin: string): string {
  const disallowLines = SEO_ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`).join("\n");
  const sitemapUrl = buildAbsoluteUrl(origin, "/sitemap.xml");

  return ["User-agent: *", "Allow: /", disallowLines, "", `Sitemap: ${sitemapUrl}`, ""].join("\n");
}

/** XML sitemap listing indexable marketing URLs. */
export function buildSitemapXml(origin: string): string {
  const homepage = buildAbsoluteUrl(origin, "/");
  const lastmod = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${homepage}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}
