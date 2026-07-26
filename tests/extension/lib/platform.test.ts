import { afterEach, describe, expect, it, vi } from "vitest";
import { isExtensionContext, isWebAppContext } from "@/lib/platform";

describe("platform context", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects extension context when chrome.runtime.id is a string", () => {
    vi.stubGlobal("chrome", { runtime: { id: "abcdefghijklmnop" } });
    expect(isExtensionContext()).toBe(true);
    expect(isWebAppContext()).toBe(false);
  });

  it("treats missing chrome as web app context", () => {
    vi.stubGlobal("chrome", undefined);
    expect(isExtensionContext()).toBe(false);
    expect(isWebAppContext()).toBe(true);
  });

  it("treats chrome without runtime id as web app context", () => {
    vi.stubGlobal("chrome", { runtime: {} });
    expect(isExtensionContext()).toBe(false);
    expect(isWebAppContext()).toBe(true);
  });

  it("rejects non-string runtime ids", () => {
    vi.stubGlobal("chrome", { runtime: { id: 123 } });
    expect(isExtensionContext()).toBe(false);
  });
});
