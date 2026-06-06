import {
  BUILT_IN_THEME_OPTIONS,
  BUILT_IN_THEME_SWATCHES,
  CUSTOM_THEME_ID_PREFIX,
  DEFAULT_THEME
} from "@/lib/constants";
import { len } from "@/lib/text";
import type {
  BuiltInThemeName,
  CustomTheme,
  CustomThemeColors,
  ThemeName
} from "@/storage/types";

/** CSS variable names applied to the document root for theming. */
export const THEME_CSS_VARS = [
  "--ko-bg",
  "--ko-surface",
  "--ko-surface-2",
  "--ko-border",
  "--ko-text",
  "--ko-text-muted",
  "--ko-accent"
] as const;

export type ThemeCssVar = (typeof THEME_CSS_VARS)[number];
export type ThemeTokenMap = Record<ThemeCssVar, string>;

const CUSTOM_THEME_STYLE_ID = "ko-custom-theme-styles";

/** Returns true when the theme id refers to a built-in preset. */
export function isBuiltInTheme(theme: ThemeName): theme is BuiltInThemeName {
  return BUILT_IN_THEME_OPTIONS.some((option) => option.id === theme);
}

/** Returns true when the theme id refers to a user-created theme. */
export function isCustomThemeId(theme: ThemeName): boolean {
  return theme.startsWith(CUSTOM_THEME_ID_PREFIX);
}

/** Extracts the stored custom theme id from an active theme name. */
export function getCustomThemeStorageId(theme: ThemeName): string | null {
  if (!isCustomThemeId(theme)) return null;
  return theme.slice(len(CUSTOM_THEME_ID_PREFIX));
}

/** Builds the active theme name for a stored custom theme id. */
export function toCustomThemeName(id: string): ThemeName {
  return `${CUSTOM_THEME_ID_PREFIX}${id}`;
}

/** Resolves the display label for any active theme id. */
export function getThemeLabel(theme: ThemeName, customThemes: CustomTheme[]): string {
  if (isBuiltInTheme(theme)) {
    return BUILT_IN_THEME_OPTIONS.find((option) => option.id === theme)?.label ?? "Theme";
  }

  const storageId = getCustomThemeStorageId(theme);
  const custom = customThemes.find((item) => item.id === storageId);
  return custom?.name ?? "Custom theme";
}

/** Returns swatch colors for built-in or custom themes. */
export function getThemeSwatchColors(
  theme: ThemeName,
  customThemes: CustomTheme[]
): CustomThemeColors {
  if (isBuiltInTheme(theme)) {
    return BUILT_IN_THEME_SWATCHES[theme];
  }

  const storageId = getCustomThemeStorageId(theme);
  const custom = customThemes.find((item) => item.id === storageId);
  return custom?.colors ?? BUILT_IN_THEME_SWATCHES[DEFAULT_THEME];
}

/** Parses a hex color string into RGB channels. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (len(normalized) === 3) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16)
    };
  }
  if (len(normalized) === 6) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }
  return null;
}

/** Converts RGB channels to a hex color string. */
function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Mixes two hex colors by weight toward the second color. */
function mixHex(first: string, second: string, weight: number): string {
  const a = parseHex(first);
  const b = parseHex(second);
  if (!a || !b) return second;
  return toHex(
    a.r + (b.r - a.r) * weight,
    a.g + (b.g - a.g) * weight,
    a.b + (b.b - a.b) * weight
  );
}

/** Lightens or darkens a hex color by a signed amount. */
function shiftHex(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const factor = amount >= 0 ? 255 : 0;
  const strength = Math.abs(amount);
  return toHex(
    rgb.r + (factor - rgb.r) * strength,
    rgb.g + (factor - rgb.g) * strength,
    rgb.b + (factor - rgb.b) * strength
  );
}

/** Estimates whether a background color reads as dark. */
function isDarkBackground(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance < 0.5;
}

/** Normalizes user input to a hex color, falling back when invalid. */
export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (len(trimmed) === 0) return fallback;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return parseHex(withHash) ? withHash.toLowerCase() : fallback;
}

/** Derives the full CSS variable set from the three primary custom colors. */
export function deriveThemeTokens(colors: CustomThemeColors): ThemeTokenMap {
  const dark = isDarkBackground(colors.bg);
  return {
    "--ko-bg": colors.bg,
    "--ko-surface": shiftHex(colors.bg, dark ? 0.05 : -0.03),
    "--ko-surface-2": shiftHex(colors.bg, dark ? 0.1 : -0.06),
    "--ko-border": shiftHex(colors.bg, dark ? 0.16 : -0.1),
    "--ko-text": colors.text,
    "--ko-text-muted": mixHex(colors.text, colors.bg, 0.45),
    "--ko-accent": colors.accent
  };
}

/** Writes or updates the stylesheet that defines custom theme selectors. */
export function syncCustomThemeStyles(customThemes: CustomTheme[]): void {
  let style = document.getElementById(CUSTOM_THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = CUSTOM_THEME_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = customThemes
    .map((theme) => {
      const tokens = deriveThemeTokens(theme.colors);
      const cssVars = Object.entries(tokens)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");
      return `[data-theme="${toCustomThemeName(theme.id)}"] { ${cssVars} }`;
    })
    .join("\n");
}

/** Clears inline CSS variables set for custom themes. */
function clearInlineThemeVars(): void {
  for (const cssVar of THEME_CSS_VARS) {
    document.documentElement.style.removeProperty(cssVar);
  }
}

/** Applies the active theme to the document root. */
export function applyThemeToDocument(theme: ThemeName, customThemes: CustomTheme[]): void {
  clearInlineThemeVars();
  document.documentElement.dataset.theme = theme;

  if (!isCustomThemeId(theme)) return;

  const storageId = getCustomThemeStorageId(theme);
  const custom = customThemes.find((item) => item.id === storageId);
  if (!custom) return;

  const tokens = deriveThemeTokens(custom.colors);
  for (const cssVar of THEME_CSS_VARS) {
    document.documentElement.style.setProperty(cssVar, tokens[cssVar]);
  }
}
