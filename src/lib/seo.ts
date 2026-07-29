import aiContent from "@/lib/ai-content.json";
import {
  DEMO_PATH,
  GITHUB_REPO_URL,
  LANDING_META_DESCRIPTION,
  LANDING_PAGE_TITLE,
  PRIVACY_META_DESCRIPTION,
  PRIVACY_PAGE_TITLE,
  PRIVACY_POLICY_PATH,
  PRODUCT_NAME,
  SEO_ROBOTS_DISALLOW_PATHS,
  SITE_OG_IMAGE_PATH,
  SITE_ORIGIN,
  UNINSTALL_PAGE_LEAD,
  UNINSTALL_PAGE_TITLE,
  UNINSTALL_PATH,
  INSTALL_PAGE_LEAD,
  INSTALL_PAGE_TITLE,
  INSTALL_PATH,
  CHROME_WEB_STORE_URL,
} from "@/lib/constants";
import { flattenFaqAnswerForSchema, resolveLandingFaqItems } from "@/lib/landingFaqContent";
import { buildAbsoluteUrl } from "@/lib/url";

export { buildAbsoluteUrl };

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

/** Privacy policy `<head>` meta tags for search and social previews. */
export function buildPrivacyMetaTags(origin: string): SeoMetaTag[] {
  const canonicalUrl = buildAbsoluteUrl(origin, PRIVACY_POLICY_PATH);
  const ogImageUrl = buildAbsoluteUrl(origin, SITE_OG_IMAGE_PATH);

  return [
    { title: PRIVACY_PAGE_TITLE },
    { name: "description", content: PRIVACY_META_DESCRIPTION },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: PRIVACY_PAGE_TITLE },
    { property: "og:description", content: PRIVACY_META_DESCRIPTION },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: PRODUCT_NAME },
    { property: "og:image", content: ogImageUrl },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: PRIVACY_PAGE_TITLE },
    { name: "twitter:description", content: PRIVACY_META_DESCRIPTION },
    { name: "twitter:image", content: ogImageUrl },
  ];
}

/** Privacy policy `<head>` link tags including canonical URL. */
export function buildPrivacyLinkTags(origin: string): SeoLinkTag[] {
  return [
    {
      rel: "canonical",
      href: buildAbsoluteUrl(origin, PRIVACY_POLICY_PATH),
    },
  ];
}

/** Uninstall hop `<head>` meta tags - noindex; not for search or social. */
export function buildUninstallMetaTags(): SeoMetaTag[] {
  return [
    { title: UNINSTALL_PAGE_TITLE },
    { name: "description", content: UNINSTALL_PAGE_LEAD },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/** Uninstall hop `<head>` link tags (canonical when origin is known). */
export function buildUninstallLinkTags(origin: string): SeoLinkTag[] {
  return [
    {
      rel: "canonical",
      href: buildAbsoluteUrl(origin, UNINSTALL_PATH),
    },
  ];
}

/** Install hop `<head>` meta tags - noindex; not for search or social. */
export function buildInstallMetaTags(): SeoMetaTag[] {
  return [
    { title: INSTALL_PAGE_TITLE },
    { name: "description", content: INSTALL_PAGE_LEAD },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/** Install hop `<head>` link tags (canonical when origin is known). */
export function buildInstallLinkTags(origin: string): SeoLinkTag[] {
  return [
    {
      rel: "canonical",
      href: buildAbsoluteUrl(origin, INSTALL_PATH),
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
    alternateName: aiContent.alternateNames,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a Chromium-based browser with extension support",
    description: LANDING_META_DESCRIPTION,
    url: pageUrl,
    image: imageUrl,
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Replaces browser New Tab",
      "Local-first storage (IndexedDB + OPFS)",
      "Notion-style block editor with slash commands and markdown paste",
      "Image attachments and voice notes",
      "Instant fuzzy search",
      "Seven built-in themes plus custom themes",
      "Nested pages and folders",
      "No account required",
    ],
    downloadUrl: buildAbsoluteUrl(origin, INSTALL_PATH),
    installUrl: CHROME_WEB_STORE_URL,
    sameAs: [GITHUB_REPO_URL, CHROME_WEB_STORE_URL],
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

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: resolveLandingFaqItems(origin).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: flattenFaqAnswerForSchema(item),
      },
    })),
  };

  return [softwareApplication, webSite, organization, faqPage].map((schema) => ({
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
  const privacyUrl = buildAbsoluteUrl(origin, PRIVACY_POLICY_PATH);
  const lastmod = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${homepage}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${privacyUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
`;
}

/**
 * Builds `/llms.txt` content per the proposed llms.txt standard for AI crawlers.
 * @see https://llmstxt.org/
 */
export function buildLlmsTxt(origin: string): string {
  const homeUrl = buildAbsoluteUrl(origin, "/");
  const demoUrl = buildAbsoluteUrl(origin, DEMO_PATH);
  const privacyUrl = buildAbsoluteUrl(origin, PRIVACY_POLICY_PATH);
  const faqUrl = `${homeUrl}#faq`;

  const faqLines = resolveLandingFaqItems(origin)
    .map((item) => `- **${item.question}** ${flattenFaqAnswerForSchema(item)}`)
    .join("\n");

  return `# ${PRODUCT_NAME}

> ${aiContent.llmsSummary}

## Product

- [Homepage](${homeUrl}): Official site - download the browser extension and read feature overview.
- [Live demo](${demoUrl}): Try the full MyMemos UI in your browser without installing.
- [Privacy policy](${privacyUrl}): How notes stay on-device; marketing-site analytics notes.
- [GitHub repository](${GITHUB_REPO_URL}): Open-source MIT-licensed codebase.

## FAQ

${faqLines}

## Optional

- [FAQ section](${faqUrl}): Same questions rendered on the homepage for humans and crawlers.
- [Sitemap](${buildAbsoluteUrl(origin, "/sitemap.xml")}): Indexable URLs for this site.
`;
}
