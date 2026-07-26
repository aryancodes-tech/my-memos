import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_THEME } from "@/lib/constants";
import {
  applyThemeToDocument,
  deriveThemeTokens,
  getCustomThemeStorageId,
  getThemeLabel,
  getThemeSwatchColors,
  isBuiltInTheme,
  isCustomThemeId,
  normalizeHexColor,
  syncCustomThemeStyles,
  toCustomThemeName,
} from "@/lib/themes";
import type { CustomTheme } from "@/storage/types";

describe("normalizeHexColor", () => {
  it("normalizes shorthand and full hex values", () => {
    expect(normalizeHexColor("abc", "#000000")).toBe("#abc");
    expect(normalizeHexColor("#ABC", "#000000")).toBe("#abc");
    expect(normalizeHexColor("  #1E8449 ", "#000000")).toBe("#1e8449");
  });

  it("returns fallback for invalid input", () => {
    expect(normalizeHexColor("", "#112233")).toBe("#112233");
    expect(normalizeHexColor("not-a-color", "#112233")).toBe("#112233");
  });
});

describe("theme id helpers", () => {
  it("detects built-in and custom theme ids", () => {
    expect(isBuiltInTheme("ocean")).toBe(true);
    expect(isBuiltInTheme("custom-abc")).toBe(false);
    expect(isCustomThemeId("custom-abc")).toBe(true);
    expect(isCustomThemeId("light")).toBe(false);
  });

  it("maps custom theme storage ids", () => {
    expect(toCustomThemeName("my-theme")).toBe("custom-my-theme");
    expect(getCustomThemeStorageId("custom-my-theme")).toBe("my-theme");
    expect(getCustomThemeStorageId("dark")).toBeNull();
  });
});

describe("getThemeLabel", () => {
  const customThemes: CustomTheme[] = [
    { id: "focus", name: "Focus Mode", colors: { bg: "#111", text: "#eee", accent: "#888" } },
  ];

  it("returns built-in labels", () => {
    expect(getThemeLabel("dracula", customThemes)).toBe("Dracula");
  });

  it("returns custom theme names", () => {
    expect(getThemeLabel("custom-focus", customThemes)).toBe("Focus Mode");
    expect(getThemeLabel("custom-missing", customThemes)).toBe("Custom theme");
  });
});

describe("deriveThemeTokens", () => {
  it("derives all CSS variables from primary colors", () => {
    const tokens = deriveThemeTokens({ bg: "#ffffff", text: "#111111", accent: "#4a4a4a" });
    expect(tokens["--ko-bg"]).toBe("#ffffff");
    expect(tokens["--ko-text"]).toBe("#111111");
    expect(tokens["--ko-accent"]).toBe("#4a4a4a");
    expect(tokens["--ko-surface"]).toMatch(/^#/);
    expect(tokens["--ko-text-muted"]).toMatch(/^#/);
  });
});

describe("getThemeSwatchColors", () => {
  const customThemes: CustomTheme[] = [
    { id: "focus", name: "Focus", colors: { bg: "#101010", text: "#f0f0f0", accent: "#808080" } },
  ];

  it("returns built-in and custom swatches", () => {
    expect(getThemeSwatchColors("dark", customThemes).bg).toMatch(/^#/);
    expect(getThemeSwatchColors("custom-focus", customThemes)).toEqual(customThemes[0]!.colors);
  });

  it("falls back to the default theme swatch for unknown custom ids", () => {
    expect(getThemeSwatchColors("custom-missing", customThemes)).toEqual(
      getThemeSwatchColors(DEFAULT_THEME, []),
    );
  });
});

describe("applyThemeToDocument / syncCustomThemeStyles", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("style");
    document.getElementById("ko-custom-theme-styles")?.remove();
  });

  it("sets data-theme for built-in themes", () => {
    applyThemeToDocument("ocean", []);
    expect(document.documentElement.dataset.theme).toBe("ocean");
  });

  it("injects CSS for custom themes and applies inline vars when active", () => {
    const customThemes: CustomTheme[] = [
      { id: "focus", name: "Focus", colors: { bg: "#101010", text: "#fafafa", accent: "#888888" } },
    ];
    syncCustomThemeStyles(customThemes);
    const style = document.getElementById("ko-custom-theme-styles");
    expect(style?.textContent).toContain('[data-theme="custom-focus"]');
    expect(style?.textContent).toContain("--ko-bg: #101010");

    applyThemeToDocument("custom-focus", customThemes);
    expect(document.documentElement.dataset.theme).toBe("custom-focus");
    expect(document.documentElement.style.getPropertyValue("--ko-bg")).toBe("#101010");
  });
});
