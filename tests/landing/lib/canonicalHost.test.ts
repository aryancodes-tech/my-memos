import { describe, expect, it } from "vitest";

import { getCanonicalHostRedirectUrl } from "@/lib/canonicalHost";

describe("getCanonicalHostRedirectUrl", () => {
  const canonical = "https://www.mymemos.in";

  it("returns null when already on the canonical host", () => {
    expect(getCanonicalHostRedirectUrl("https://www.mymemos.in/", canonical)).toBeNull();
    expect(getCanonicalHostRedirectUrl("https://www.mymemos.in/demo/", canonical)).toBeNull();
  });

  it("redirects apex HTTPS to www", () => {
    expect(getCanonicalHostRedirectUrl("https://mymemos.in/", canonical)).toBe(
      "https://www.mymemos.in/",
    );
    expect(getCanonicalHostRedirectUrl("https://mymemos.in/demo/?x=1", canonical)).toBe(
      "https://www.mymemos.in/demo/?x=1",
    );
  });

  it("redirects HTTP variants to the canonical HTTPS www origin", () => {
    expect(getCanonicalHostRedirectUrl("http://mymemos.in/", canonical)).toBe(
      "https://www.mymemos.in/",
    );
    expect(getCanonicalHostRedirectUrl("http://www.mymemos.in/", canonical)).toBe(
      "https://www.mymemos.in/",
    );
  });

  it("ignores localhost and preview hosts", () => {
    expect(getCanonicalHostRedirectUrl("http://localhost:8080/", canonical)).toBeNull();
    expect(
      getCanonicalHostRedirectUrl("https://my-memos-git-main.vercel.app/", canonical),
    ).toBeNull();
  });

  it("returns null when VITE_SITE_URL / canonical origin is unset", () => {
    expect(getCanonicalHostRedirectUrl("https://mymemos.in/", "")).toBeNull();
  });
});
