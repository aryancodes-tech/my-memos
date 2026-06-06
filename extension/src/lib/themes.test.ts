import { describe, expect, it } from "vitest";
import {
  deriveThemeTokens,
  getCustomThemeStorageId,
  getThemeLabel,
  isBuiltInTheme,
  isCustomThemeId,
  normalizeHexColor,
  toCustomThemeName,
} from "./themes";
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
    { id: "focus", name: "Focus Mode", colors: { bg: "#111", text: "#eee", accent: "#4af" } },
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
    const tokens = deriveThemeTokens({ bg: "#ffffff", text: "#111111", accent: "#2874a6" });
    expect(tokens["--ko-bg"]).toBe("#ffffff");
    expect(tokens["--ko-text"]).toBe("#111111");
    expect(tokens["--ko-accent"]).toBe("#2874a6");
    expect(tokens["--ko-surface"]).toMatch(/^#/);
    expect(tokens["--ko-text-muted"]).toMatch(/^#/);
  });
});
