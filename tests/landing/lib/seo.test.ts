import { describe, expect, it } from "vitest";

import {
  buildAbsoluteUrl,
  buildLandingJsonLdScripts,
  buildLandingLinkTags,
  buildLandingMetaTags,
  buildLlmsTxt,
  buildPrivacyLinkTags,
  buildPrivacyMetaTags,
  buildRobotsTxt,
  buildSitemapXml,
  buildInstallLinkTags,
  buildInstallMetaTags,
  buildUninstallLinkTags,
  buildUninstallMetaTags,
  resolveSiteOrigin,
} from "@/lib/seo";
import { resolveLandingFaqItems } from "@/lib/landingFaqContent";

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

describe("buildLandingLinkTags", () => {
  it("emits a canonical link for the homepage", () => {
    expect(buildLandingLinkTags("https://mymemos.app")).toEqual([
      { rel: "canonical", href: "https://mymemos.app/" },
    ]);
  });
});

describe("buildLandingJsonLdScripts", () => {
  it("emits SoftwareApplication, WebSite, Organization, and FAQPage schemas", () => {
    const scripts = buildLandingJsonLdScripts("https://mymemos.app");
    const types = scripts.map((script) => JSON.parse(script.children)["@type"]);

    expect(types).toEqual(["SoftwareApplication", "WebSite", "Organization", "FAQPage"]);
  });

  it("resolves FAQ demo links from the site origin", () => {
    const scripts = buildLandingJsonLdScripts("https://www.mymemos.in");
    const faqPage = JSON.parse(scripts[3].children);
    const demoQuestion = faqPage.mainEntity.find(
      (item: { name: string }) => item.name === "Can I try MyMemos before installing?",
    );

    expect(demoQuestion.acceptedAnswer.text).toContain("https://www.mymemos.in/demo/");
  });
});

describe("buildRobotsTxt", () => {
  it("allows the homepage and blocks demo, uninstall, and install hops", () => {
    const robots = buildRobotsTxt("https://mymemos.app");

    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /demo/");
    expect(robots).toContain("Disallow: /uninstall");
    expect(robots).toContain("Disallow: /install");
    expect(robots).toContain("Sitemap: https://mymemos.app/sitemap.xml");
  });
});

describe("buildSitemapXml", () => {
  it("lists the homepage and privacy policy with absolute URLs", () => {
    const xml = buildSitemapXml("https://mymemos.app");

    expect(xml).toContain("<loc>https://mymemos.app/</loc>");
    expect(xml).toContain("<loc>https://mymemos.app/privacy</loc>");
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).toContain("<priority>0.4</priority>");
  });
});

describe("buildLlmsTxt", () => {
  it("includes product summary and absolute links for AI crawlers", () => {
    const llms = buildLlmsTxt("https://www.mymemos.in");

    expect(llms).toContain("# MyMemos");
    expect(llms).toContain("local-first browser extension");
    expect(llms).toContain("https://www.mymemos.in/");
    // Assert against the content source so FAQ copy edits do not break this test.
    expect(llms).toContain(resolveLandingFaqItems("https://www.mymemos.in")[0].question);
    expect(llms).toContain("https://www.mymemos.in/demo/");
    expect(llms).toContain("https://www.mymemos.in/privacy");
  });
});

describe("buildPrivacyMetaTags", () => {
  it("includes title, description, and canonical social fields", () => {
    const tags = buildPrivacyMetaTags("https://mymemos.app");
    const title = tags.find((tag) => "title" in tag);
    const description = tags.find((tag) => tag.name === "description");
    const ogUrl = tags.find((tag) => tag.property === "og:url");

    expect(title?.title).toContain("Privacy Policy");
    expect(description?.content).toContain("on your device");
    expect(ogUrl?.content).toBe("https://mymemos.app/privacy");
  });
});

describe("buildPrivacyLinkTags", () => {
  it("emits a canonical link for the privacy page", () => {
    expect(buildPrivacyLinkTags("https://mymemos.app")).toEqual([
      { rel: "canonical", href: "https://mymemos.app/privacy" },
    ]);
  });
});

describe("buildUninstallMetaTags", () => {
  it("marks the uninstall hop as noindex", () => {
    const tags = buildUninstallMetaTags();
    const robots = tags.find((tag) => tag.name === "robots");
    const title = tags.find((tag) => "title" in tag);

    expect(title?.title).toContain("Sorry to see you go");
    expect(robots?.content).toBe("noindex, nofollow");
  });
});

describe("buildUninstallLinkTags", () => {
  it("emits a canonical link for the uninstall hop", () => {
    expect(buildUninstallLinkTags("https://mymemos.app")).toEqual([
      { rel: "canonical", href: "https://mymemos.app/uninstall" },
    ]);
  });
});

describe("buildInstallMetaTags", () => {
  it("marks the install hop as noindex", () => {
    const tags = buildInstallMetaTags();
    const robots = tags.find((tag) => tag.name === "robots");
    const title = tags.find((tag) => "title" in tag);

    expect(title?.title).toContain("Install");
    expect(robots?.content).toBe("noindex, nofollow");
  });
});

describe("buildInstallLinkTags", () => {
  it("emits a canonical link for the install hop", () => {
    expect(buildInstallLinkTags("https://mymemos.app")).toEqual([
      { rel: "canonical", href: "https://mymemos.app/install" },
    ]);
  });
});
