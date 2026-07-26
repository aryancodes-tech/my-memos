import { describe, expect, it } from "vitest";
import { buildAbsoluteUrl } from "@/lib/url";

describe("buildAbsoluteUrl", () => {
  it("joins origin and path", () => {
    expect(buildAbsoluteUrl("https://mymemos.app", "/sitemap.xml")).toBe(
      "https://mymemos.app/sitemap.xml",
    );
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildAbsoluteUrl("https://mymemos.app/", "/demo/")).toBe("https://mymemos.app/demo/");
  });

  it("adds a leading slash when the path omits one", () => {
    expect(buildAbsoluteUrl("https://mymemos.app", "llms.txt")).toBe(
      "https://mymemos.app/llms.txt",
    );
  });
});
