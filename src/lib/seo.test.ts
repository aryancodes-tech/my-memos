import { describe, expect, it } from "vitest";

import {
  buildAbsoluteUrl,
  buildLandingJsonLdScripts,
  buildLandingMetaTags,
  buildRobotsTxt,
  buildSitemapXml,
  resolveSiteOrigin,
} from "./seo";

describe("resolveSiteOrigin", () => {
  it("uses the request origin when SITE_ORIGIN is unset", () => {
    expect(resolveSiteOrigin("https://preview.example.com")).toBe("https://preview.example.com");
  });

  it("strips trailing slashes from the fallback origin", () => {
    expect(resolveSiteOrigin("https://preview.example.com/")).toBe("https://preview.example.com");
  });

  it("falls back to localhost for local development", () => {
    expect(resolveSiteOrigin()).toBe("http://localhost:8080");
  });
});

describe("buildAbsoluteUrl", () => {
  it("joins origin and path", () => {
    expect(buildAbsoluteUrl("https://mymemos.app", "/sitemap.xml")).toBe(
      "https://mymemos.app/sitemap.xml",
    );
  });
});

describe("buildLandingMetaTags", () => {
  it("includes canonical social preview fields", () => {
    const tags = buildLandingMetaTags("https://mymemos.app");
    const title = tags.find((tag) => "title" in tag);
    const description = tags.find((tag) => tag.name === "description");
    const ogUrl = tags.find((tag) => tag.property === "og:url");
    const twitterCard = tags.find((tag) => tag.name === "twitter:card");

    expect(title?.title).toContain("MyMemos");
    expect(description?.content).toContain("New Tab");
    expect(ogUrl?.content).toBe("https://mymemos.app/");
    expect(twitterCard?.content).toBe("summary_large_image");
  });
});

describe("buildLandingJsonLdScripts", () => {
  it("emits SoftwareApplication, WebSite, and Organization schemas", () => {
    const scripts = buildLandingJsonLdScripts("https://mymemos.app");
    const types = scripts.map((script) => JSON.parse(script.children)["@type"]);

    expect(types).toEqual(["SoftwareApplication", "WebSite", "Organization"]);
  });
});

describe("buildRobotsTxt", () => {
  it("allows the homepage and blocks the demo app", () => {
    const robots = buildRobotsTxt("https://mymemos.app");

    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /demo/");
    expect(robots).toContain("Sitemap: https://mymemos.app/sitemap.xml");
  });
});

describe("buildSitemapXml", () => {
  it("lists the homepage with absolute URL", () => {
    const xml = buildSitemapXml("https://mymemos.app");

    expect(xml).toContain("<loc>https://mymemos.app/</loc>");
    expect(xml).toContain("<priority>1.0</priority>");
  });
});
