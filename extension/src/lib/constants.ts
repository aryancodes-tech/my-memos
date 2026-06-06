import type { BuiltInThemeName, CustomThemeColors } from "@/storage/types";

/** Sidebar label for the user-managed pages and directories section. */
export const WORKSPACE_SECTION = "Pages";

/** Sidebar width in pixels. */
export const SIDEBAR_WIDTH_PX = 272;

/** Minimum width of sidebar row context menus. */
export const SIDEBAR_MENU_MIN_WIDTH_PX = 204;

/** Horizontal indent per tree depth level in the sidebar. */
export const SIDEBAR_INDENT_PX = 16;

/** Theme options shown in the appearance dropdown. */
export const BUILT_IN_THEME_OPTIONS: { id: BuiltInThemeName; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "midnight", label: "Midnight" },
  { id: "dracula", label: "Dracula" },
  { id: "solarized", label: "Solarized" },
  { id: "forest", label: "Forest" },
  { id: "ocean", label: "Ocean" }
];

/** Swatch colors for built-in themes in the theme picker preview. */
export const BUILT_IN_THEME_SWATCHES: Record<BuiltInThemeName, CustomThemeColors> = {
  "light": { bg: "#ffffff", text: "#1f1f1e", accent: "#2f80ed" },
  "dark": { bg: "#191919", text: "#e8e8e8", accent: "#6aa9ff" },
  midnight: { bg: "#0b0d12", text: "#e6e9ef", accent: "#7aa2f7" },
  dracula: { bg: "#282a36", text: "#f8f8f2", accent: "#bd93f9" },
  solarized: { bg: "#fdf6e3", text: "#073642", accent: "#268bd2" },
  forest: { bg: "#0f1a14", text: "#e3f0e6", accent: "#6fcf97" },
  ocean: { bg: "#0d1b2a", text: "#e6f0fa", accent: "#4cc9f0" }
};

/** chrome.storage key for user-created themes. */
export const CUSTOM_THEMES_SETTING = "customThemes";

/** Prefix applied to custom theme ids in `ThemeName`. */
export const CUSTOM_THEME_ID_PREFIX = "custom-";

/** Default colors pre-filled in the add-theme dialog. */
export const CUSTOM_THEME_DEFAULT_COLORS: CustomThemeColors = {
  bg: "#ffffff",
  text: "#1f1f1e",
  accent: "#2f80ed"
};

/** Fallback theme when the active custom theme is removed. */
export const DEFAULT_THEME: BuiltInThemeName = "light";

/** Minimum width of the theme picker panel in pixels. */
export const THEME_MENU_MIN_WIDTH_PX = 248;

/** Label shown beside Search for the global search shortcut. */
export const SEARCH_SHORTCUT_LABEL = "⌘ K";

/** Maximum number of pages shown in the Recent sidebar group. */
export const RECENT_PAGE_LIMIT = 8;

/** Maximum content width for page and dashboard views in pixels. */
export const CONTENT_MAX_WIDTH_PX = 900;

/** Default title for a new page. */
export const DEFAULT_PAGE_TITLE = "Untitled";

/** Default title for a new folder. */
export const DEFAULT_FOLDER_TITLE = "Untitled folder";

/** Milliseconds to debounce editor and title persistence. */
export const EDITOR_SAVE_DEBOUNCE_MS = 250;

/** chrome.storage keys for lightweight settings. */
export const SETTINGS_KEYS = {
  theme: "theme",
  lastView: "lastView",
} as const;

/** Horizontal padding for page content in pixels. */
export const PAGE_CONTENT_PADDING_X_PX = 96;

/** Top padding for page content in pixels. */
export const PAGE_CONTENT_PADDING_TOP_PX = 48;

/** Section label for the slash-command block picker in the editor. */
export const SLASH_MENU_SECTION = "Basic blocks";

/** Placeholder shown in the slash-command search field. */
export const SLASH_MENU_PLACEHOLDER = "Type to search";

/** Character inserted when Tab is pressed with selected text in the editor. */
export const EDITOR_TAB_INSERT = "\t";

/** Default URL placeholder shown in the link dialog input. */
export const EDITOR_LINK_PLACEHOLDER = "https://";

/** Preset text colors for the editor formatting toolbar. */
export const EDITOR_TEXT_COLORS: { id: string; label: string; value: string }[] = [
  { id: "default", label: "Default", value: "" },
  { id: "gray", label: "Gray", value: "#6b6b6b" },
  { id: "red", label: "Red", value: "#c0392b" },
  { id: "orange", label: "Orange", value: "#d35400" },
  { id: "yellow", label: "Yellow", value: "#b7950b" },
  { id: "green", label: "Green", value: "#1e8449" },
  { id: "blue", label: "Blue", value: "#2874a6" },
  { id: "purple", label: "Purple", value: "#7d3c98" }
];

/** Preset highlight colors for the editor formatting toolbar. */
export const EDITOR_HIGHLIGHT_COLORS: { id: string; label: string; value: string }[] = [
  { id: "none", label: "None", value: "" },
  { id: "yellow", label: "Yellow", value: "#fff3b0" },
  { id: "orange", label: "Orange", value: "#fdebd0" },
  { id: "red", label: "Red", value: "#fadbd8" },
  { id: "green", label: "Green", value: "#d5f5e3" },
  { id: "blue", label: "Blue", value: "#d6eaf8" },
  { id: "purple", label: "Purple", value: "#ebdef0" },
  { id: "gray", label: "Gray", value: "#eaecee" }
];

/** Preset background colors applied via highlight for subtle text backgrounds. */
export const EDITOR_BACKGROUND_COLORS: { id: string; label: string; value: string }[] = [
  { id: "none", label: "None", value: "" },
  { id: "gray-light", label: "Light gray", value: "#f2f2f2" },
  { id: "gray", label: "Gray", value: "#e0e0e0" },
  { id: "brown", label: "Brown", value: "#efebe9" },
  { id: "orange", label: "Orange", value: "#fff8e1" },
  { id: "yellow", label: "Yellow", value: "#fffde7" },
  { id: "green", label: "Green", value: "#e8f5e9" },
  { id: "blue", label: "Blue", value: "#e3f2fd" }
];

/** Setting key for persisted collapsed directory ids in chrome.storage. */
export const COLLAPSED_DIRS_SETTING = "collapsedDirs";
