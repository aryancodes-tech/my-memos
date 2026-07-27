/**
 * Theme color shapes shared by constants and the extension store.
 * Kept here so `shared/constants.ts` has no dependency on extension packages.
 */

/** Built-in theme ids available in the appearance picker. */
export type BuiltInThemeName =
  | "light"
  | "dark"
  | "midnight"
  | "dracula"
  | "solarized"
  | "forest"
  | "ocean";

/** Primary colors users pick when creating a custom theme. */
export interface CustomThemeColors {
  /** Page background color. */
  bg: string;
  /** Primary text color. */
  text: string;
  /** Accent / link color. */
  accent: string;
}
