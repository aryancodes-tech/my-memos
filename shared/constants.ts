/// <reference types="vite/client" />

/**
 * Single source of truth for product constants across landing + extension.
 *
 * Import via `@shared/constants` or the package re-exports:
 * - Landing: `@/lib/constants` → re-exports this module
 * - Extension: `@/lib/constants` → re-exports this module
 *
 * Do not hardcode user-facing strings or tunables in components — add them here.
 */

import type { BuiltInThemeName, CustomThemeColors } from "./theme-types";

// ---------------------------------------------------------------------------
// Product identity
// ---------------------------------------------------------------------------

/** Display name of the product shown across landing, extension, and manifest. */
export const PRODUCT_NAME = "MyMemos";

/** IndexedDB database name for persisted pages and settings. */
export const DB_NAME = "mymemos";

// ---------------------------------------------------------------------------
// Landing / marketing
// ---------------------------------------------------------------------------

/** Nav tagline under the product name on the landing page. */
export const LANDING_NAV_TAGLINE = "Replaces your New Tab for quick notes";

/** Badge above the landing hero headline. */
export const LANDING_HERO_BADGE = "Chrome extension · Replaces your New Tab";

/** Landing hero headline line one. */
export const LANDING_HERO_TITLE_LINE_ONE = "Your notes,";

/** Landing hero headline line two. */
export const LANDING_HERO_TITLE_LINE_TWO = "on every new tab.";

/** Landing hero subtitle emphasizing instant capture on tab open. */
export const LANDING_HERO_SUBTITLE =
  "MyMemos turns every new browser tab into your notes workspace. Open a tab, start writing - no app to launch, no account, no sync servers.";

/** Highlight pills shown below the landing hero subtitle. */
export const LANDING_HERO_PILLS = [
  "Replaces New Tab",
  "Instant capture",
  "Local-first",
  "Offline-only",
  "⌘ K search",
] as const;

/** Eyebrow label for the landing features section. */
export const LANDING_FEATURES_EYEBROW = "Why MyMemos";

/** Heading for the landing features section. */
export const LANDING_FEATURES_TITLE = "Not another notes app - your browser's new tab";

/** Description for the landing features section. */
export const LANDING_FEATURES_DESC =
  "Most note apps sit in a separate tab you forget to open. MyMemos is where Chrome already takes you - ready to capture the moment you hit ⌘ T.";

/** Caption shown below the launch video at peak scroll. */
export const LANDING_LAUNCH_VIDEO_CAPTION = "Your new tab, in action";

/** Meta description for the landing page. */
export const LANDING_META_DESCRIPTION =
  "MyMemos replaces your browser New Tab with a local-first notes workspace - capture ideas instantly on every ⌘T, no account required.";

/** `<title>` and Open Graph title for the landing homepage. */
export const LANDING_PAGE_TITLE = `${PRODUCT_NAME} - Your notes, on every new tab.`;

/**
 * Canonical site origin without a trailing slash.
 * Set `VITE_SITE_URL` at build/deploy time (e.g. `https://mymemos.app`).
 */
export const SITE_ORIGIN = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

/** Open Graph / Twitter card image path (served from `public/`). */
export const SITE_OG_IMAGE_PATH = "/launch-poster.png";

/** Mobile browser chrome color for the landing site. */
export const SITE_THEME_COLOR = "#ffffff";

/** Paths excluded from search indexing via `robots.txt`. */
export const SEO_ROBOTS_DISALLOW_PATHS = ["/demo/"] as const;

/** DOM id for the landing FAQ section. */
export const LANDING_FAQ_SECTION_ID = "faq";

/** Eyebrow label for the landing FAQ section. */
export const LANDING_FAQ_EYEBROW = "FAQ";

/** Heading for the landing FAQ section. */
export const LANDING_FAQ_TITLE = "Common questions about MyMemos";

/** Description for the landing FAQ section. */
export const LANDING_FAQ_DESC =
  "Quick answers for anyone comparing local-first New Tab notes apps.";

/** Intro copy for the landing get-started section. */
export const LANDING_GET_STARTED_DESC =
  "Install once. Every new tab becomes your workspace - no account, no server, no config.";

/** DOM id for the landing get-started install section. */
export const LANDING_GET_STARTED_SECTION_ID = "get-started";

/** Nav link label pointing to the install steps section. */
export const LANDING_NAV_INSTALL_LINK_LABEL = "Install Guide";

/** Footer tagline on the landing page. */
export const LANDING_FOOTER_TAGLINE = "Replaces your New Tab · Local-first · No cloud required";

/** Top padding for the landing hero shell below the fixed nav, in rem. */
export const LANDING_HERO_SHELL_PADDING_TOP_REM = 6.75;

/** Public GitHub repository URL for the project. */
export const GITHUB_REPO_URL = "https://github.com/aryancodes-tech/my-memos";

/** URL path for the live browser demo of the MyMemos UI. */
export const DEMO_PATH = "/demo/";

/** Filename served by the landing page download button. */
export const EXTENSION_ZIP_FILENAME = "mymemos-extension.zip";

/** Cloudinary account cloud name for landing media delivery. */
export const LANDING_LAUNCH_VIDEO_CLOUDINARY_CLOUD = "dhywccghy";

/** Cloudinary public ID for the launch scroll video. */
export const LANDING_LAUNCH_VIDEO_CLOUDINARY_ID = "v1780797594/launch_1_wfzltd";

/**
 * Cloudinary transforms applied to the launch video (≈2 MB vs 31 MB original).
 * Served from Cloudinary CDN with edge caching - not downloaded from your origin per visitor.
 */
export const LANDING_LAUNCH_VIDEO_CLOUDINARY_TRANSFORMS = "q_auto:eco,w_1280,c_limit,f_mp4";

/** Optimized launch video URL for the landing scroll section. */
export const LANDING_LAUNCH_VIDEO_SRC = `https://res.cloudinary.com/${LANDING_LAUNCH_VIDEO_CLOUDINARY_CLOUD}/video/upload/${LANDING_LAUNCH_VIDEO_CLOUDINARY_TRANSFORMS}/${LANDING_LAUNCH_VIDEO_CLOUDINARY_ID}.mp4`;

/** Poster image shown before the launch video loads. */
export const LANDING_LAUNCH_VIDEO_POSTER = "/launch-poster.png";

/** Scroll progress (0–1) before the launch video begins downloading. */
export const LANDING_LAUNCH_VIDEO_LOAD_SCROLL_PROGRESS = 0.01;

/** Base public path for per-feature demo clips in the landing bento grid. */
export const LANDING_FEATURE_CLIP_BASE = "/videos/features";

/** When false, bento tiles use CSS mockups only and skip loading feature clip videos. */
export const LANDING_FEATURE_CLIPS_ENABLED = false;

/** Path to the site favicon served from the public directory. */
export const SITE_FAVICON_PATH = "/favicon.svg";

/** MIME type for the site favicon. */
export const SITE_FAVICON_TYPE = "image/svg+xml";

/** Path to the Apple touch icon served from the public directory. */
export const SITE_APPLE_TOUCH_ICON_PATH = "/apple-touch-icon.png";

/** Scroll runway height multiplier (viewport heights) for the launch video section. */
export const LANDING_VIDEO_SCROLL_RUNWAY_VH = 1.55;

/** Negative viewport overlap pulling the features section under the shrinking video. */
export const LANDING_MAIN_OVERLAP_VH = 44;

/** Scroll progress where the launch video finishes expanding to fullscreen. */
export const LANDING_VIDEO_EXPAND_END = 0.24;

/** Extra scroll progress spent at fullscreen before the video shrinks (scroll friction). */
export const LANDING_VIDEO_HOLD_SCROLL_RATIO = 0.36;

/** Scroll progress where the fullscreen hold ends and the video begins shrinking. */
export const LANDING_VIDEO_HOLD_END = LANDING_VIDEO_EXPAND_END + LANDING_VIDEO_HOLD_SCROLL_RATIO;

/** Initial width of the launch video frame as a percentage of the viewport (60–70% range). */
export const LANDING_LAUNCH_VIDEO_INITIAL_WIDTH_PERCENT = 65;

/** Full width of the launch video frame at peak expansion, as a percentage of the viewport. */
export const LANDING_LAUNCH_VIDEO_FULL_WIDTH_PERCENT = 100;

/** Initial top offset of the launch video frame as a percentage of the viewport. */
export const LANDING_LAUNCH_VIDEO_INITIAL_TOP_PERCENT = 60;

/** Initial height of the launch video frame as a percentage of the viewport. */
export const LANDING_LAUNCH_VIDEO_INITIAL_HEIGHT_PERCENT = 40;

/** Fixed height of the faux browser chrome rendered above the launch video. */
export const LANDING_LAUNCH_VIDEO_CHROME_HEIGHT_PX = 36;

/** Label shown in the faux browser chrome above the launch video. */
export const LANDING_LAUNCH_VIDEO_CHROME_LABEL = "My-Memos - New Tab";

/** Fixed height of the caption strip rendered below the launch video at peak scroll. */
export const LANDING_LAUNCH_VIDEO_CAPTION_HEIGHT_PX = 44;

/** Viewport width below which the landing launch video scroll section is hidden. */
export const LANDING_LAUNCH_VIDEO_HIDE_MAX_WIDTH_PX = 768;

// ---------------------------------------------------------------------------
// Extension workspace / sidebar
// ---------------------------------------------------------------------------

/** Sidebar label for the user-managed pages and directories section. */
export const WORKSPACE_SECTION = "Pages";

/** `dataTransfer` type used when dragging workspace pages and folders in the sidebar. */
export const WORKSPACE_DRAG_MIME = "application/x-mymemos-page-id";

/** Sidebar width in pixels. */
export const SIDEBAR_WIDTH_PX = 272;

/** Minimum width of sidebar row context menus. */
export const SIDEBAR_MENU_MIN_WIDTH_PX = 204;

/** Horizontal indent per tree depth level in the sidebar. */
export const SIDEBAR_INDENT_PX = 16;

/** Label shown beside Search for the global search shortcut. */
export const SEARCH_SHORTCUT_LABEL = "⌘ K";

/** Maximum number of pages kept in the Recent sidebar group. */
export const RECENT_PAGE_LIMIT = 8;

/** Number of recent pages shown before the sidebar expands. */
export const SIDEBAR_RECENT_VISIBLE_LIMIT = 3;

/** Label for expanding the Recent sidebar list. */
export const SIDEBAR_RECENT_SHOW_MORE_LABEL = "Show more";

/** Label for collapsing the Recent sidebar list. */
export const SIDEBAR_RECENT_SHOW_LESS_LABEL = "Show less";

/** Tooltip / title: expand the collapsed sidebar rail. */
export const SIDEBAR_EXPAND_LABEL = "Expand sidebar";

/** Tooltip / title: collapse the sidebar. */
export const SIDEBAR_COLLAPSE_LABEL = "Collapse sidebar";

/** Tooltip / title: open the dashboard view. */
export const SIDEBAR_DASHBOARD_LABEL = "Dashboard";

/** Aria label for the add page/folder control. */
export const SIDEBAR_ADD_NEW_ARIA_LABEL = "Add new page or folder";

/** Menu label to create a new folder. */
export const SIDEBAR_NEW_FOLDER_LABEL = "New folder";

/** Tooltip for expanding or collapsing a folder row. */
export const SIDEBAR_FOLDER_TOGGLE_EXPAND = "Expand";

/** Tooltip for collapsing a folder row. */
export const SIDEBAR_FOLDER_TOGGLE_COLLAPSE = "Collapse";

/** Tooltip for adding a page inside a folder. */
export const SIDEBAR_ADD_INSIDE_LABEL = "Add inside";

/** Context menu: add page to favorites. */
export const SIDEBAR_ADD_TO_FAVORITES_LABEL = "Add to favorites";

/** Context menu: remove page from favorites. */
export const SIDEBAR_REMOVE_FROM_FAVORITES_LABEL = "Remove from favorites";

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

/** Setting key for persisted collapsed directory ids in chrome.storage. */
export const COLLAPSED_DIRS_SETTING = "collapsedDirs";

/** Search palette input placeholder. */
export const SEARCH_PALETTE_PLACEHOLDER = "Search pages and content…";

/** Delete confirm dialog title for a folder. */
export const DELETE_FOLDER_TITLE = "Delete this folder?";

/** Delete confirm dialog title for a page. */
export const DELETE_PAGE_TITLE = "Delete this page?";

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

/** Theme options shown in the appearance dropdown. */
export const BUILT_IN_THEME_OPTIONS: { id: BuiltInThemeName; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "midnight", label: "Midnight" },
  { id: "dracula", label: "Dracula" },
  { id: "solarized", label: "Solarized" },
  { id: "forest", label: "Forest" },
  { id: "ocean", label: "Ocean" },
];

/** Swatch colors for built-in themes in the theme picker preview. */
export const BUILT_IN_THEME_SWATCHES: Record<BuiltInThemeName, CustomThemeColors> = {
  light: { bg: "#ffffff", text: "#1f1f1e", accent: "#1f1f1e" },
  dark: { bg: "#191919", text: "#e8e8e8", accent: "#e8e8e8" },
  midnight: { bg: "#0b0d12", text: "#e6e9ef", accent: "#e6e9ef" },
  dracula: { bg: "#282a36", text: "#f8f8f2", accent: "#f8f8f2" },
  solarized: { bg: "#fdf6e3", text: "#073642", accent: "#073642" },
  forest: { bg: "#0f1a14", text: "#e3f0e6", accent: "#e3f0e6" },
  ocean: { bg: "#0d1b2a", text: "#e6f0fa", accent: "#e6f0fa" },
};

/** chrome.storage key for user-created themes. */
export const CUSTOM_THEMES_SETTING = "customThemes";

/** Prefix applied to custom theme ids in `ThemeName`. */
export const CUSTOM_THEME_ID_PREFIX = "custom-";

/** Default colors pre-filled in the add-theme dialog. */
export const CUSTOM_THEME_DEFAULT_COLORS: CustomThemeColors = {
  bg: "#ffffff",
  text: "#1f1f1e",
  accent: "#1f1f1e",
};

/** Fallback theme when the active custom theme is removed. */
export const DEFAULT_THEME: BuiltInThemeName = "light";

/** Minimum width of the theme picker panel in pixels. */
export const THEME_MENU_MIN_WIDTH_PX = 248;

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

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
  { id: "charcoal", label: "Charcoal", value: "#4a4a4a" },
  { id: "purple", label: "Purple", value: "#7d3c98" },
];

/** Label for the custom color picker row in toolbar color menus. */
export const EDITOR_CUSTOM_COLOR_LABEL = "Custom color";

/** Default hex value shown in the text custom color picker. */
export const EDITOR_TEXT_CUSTOM_DEFAULT = "#6b6b6b";

/** Default hex value shown in the highlight custom color picker. */
export const EDITOR_HIGHLIGHT_CUSTOM_DEFAULT = "#fff3b0";

/** Default hex value shown in the background custom color picker. */
export const EDITOR_BACKGROUND_CUSTOM_DEFAULT = "#f2f2f2";

/** Preset highlight colors for the editor formatting toolbar. */
export const EDITOR_HIGHLIGHT_COLORS: { id: string; label: string; value: string }[] = [
  { id: "none", label: "None", value: "" },
  { id: "yellow", label: "Yellow", value: "#fff3b0" },
  { id: "orange", label: "Orange", value: "#fdebd0" },
  { id: "red", label: "Red", value: "#fadbd8" },
  { id: "green", label: "Green", value: "#d5f5e3" },
  { id: "slate", label: "Slate", value: "#e0e0e0" },
  { id: "purple", label: "Purple", value: "#ebdef0" },
  { id: "gray", label: "Gray", value: "#eaecee" },
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
  { id: "slate", label: "Slate", value: "#efeeec" },
];

/** Toolbar: strikethrough. */
export const EDITOR_TOOLBAR_STRIKETHROUGH_LABEL = "Strikethrough";

/** Toolbar: code block. */
export const EDITOR_TOOLBAR_CODE_BLOCK_LABEL = "Code block";

/** Toolbar: link. */
export const EDITOR_TOOLBAR_LINK_LABEL = "Link";

/** Toolbar aria: image alignment when an image is selected. */
export const EDITOR_TOOLBAR_IMAGE_ALIGN_ARIA = "Image alignment";

/** Toolbar aria: text alignment. */
export const EDITOR_TOOLBAR_TEXT_ALIGN_ARIA = "Text alignment";

/** Toolbar aria: block type picker. */
export const EDITOR_TOOLBAR_BLOCK_TYPE_ARIA = "Block type";

/** Align left control label. */
export const EDITOR_ALIGN_LEFT_LABEL = "Align left";

/** Align center control label. */
export const EDITOR_ALIGN_CENTER_LABEL = "Align center";

/** Align right control label. */
export const EDITOR_ALIGN_RIGHT_LABEL = "Align right";

/** Justify alignment control label. */
export const EDITOR_ALIGN_JUSTIFY_LABEL = "Justify";

/** HTML class markdown-it uses for GFM task lists. */
export const MARKDOWN_TASK_LIST_HTML_CLASS = "contains-task-list";

/** Input rule for GFM task items: `- [x] `, `* [ ] `, etc. */
export const MARKDOWN_TASK_ITEM_INPUT_REGEX = new RegExp(String.raw`^\s*([-+*])\s+\[([ xX])?\]\s$`);

/**
 * Bullet list input rule that ignores GFM task checkbox syntax (`- [x]`).
 * Skips any line where the marker is followed by `[`.
 */
export const MARKDOWN_BULLET_LIST_INPUT_REGEX = /^\s*([-+*])\s+(?!\[).+$/;

/** Regex patterns used to detect markdown syntax in pasted plain text. */
export const MARKDOWN_DETECTION_PATTERNS: RegExp[] = [
  /^#{1,6}\s/m,
  /^\s*[-*+]\s+\[[ xX]\]/m,
  /^\s*[-*+]\s+\S/m,
  /^\s*\d+\.\s/m,
  /^\s*>/m,
  /^```/m,
  /^(?:-{3,}|\*{3,}|_{3,})\s*$/m,
  /!\[[^\]]*\]\([^)]+\)/,
  /\[[^\]]+\]\([^)]+\)/,
  /\*\*[^*]+\*\*/,
  /__[^_]+__/,
  /~~[^~]+~~/,
  /==[^=]+==/,
  /\|.+\|/,
  /`[^`]+`/,
];

// ---------------------------------------------------------------------------
// Web demo / mobile
// ---------------------------------------------------------------------------

/** localStorage key for dismissing the standalone web app install banner. */
export const WEB_INSTALL_BANNER_DISMISS_KEY = "koWebInstallBannerDismissed";

/** Viewport width below which the live demo shows a mobile experience notice. */
export const MOBILE_EXPERIENCE_MAX_WIDTH_PX = 768;

/** Title for the mobile experience notice on the live demo page. */
export const MOBILE_EXPERIENCE_NOTICE_TITLE = "Mobile experience notice";

/** Body copy explaining the demo works best on larger screens. */
export const MOBILE_EXPERIENCE_NOTICE_BODY =
  "This page is best viewed on a bigger device. For the full MyMemos experience, open the live demo on a desktop or tablet.";

/** CTA label that returns visitors to the marketing home page. */
export const MOBILE_EXPERIENCE_NOTICE_CTA = "Return to home page";

/** Public path for the marketing home page. */
export const MARKETING_HOME_PATH = "/";

// ---------------------------------------------------------------------------
// Attachments / OPFS / voice / images
// ---------------------------------------------------------------------------

/** Subfolder under the attachment root for image files. */
export const ATTACHMENT_DIR_IMAGES = "images";

/** Subfolder under the attachment root for audio recordings. */
export const ATTACHMENT_DIR_AUDIO = "audio";

/** Reserved subfolder created alongside images/audio (future metadata exports). */
export const ATTACHMENT_DIR_DATABASE = "database";

/** MIME type for voice note recordings (Opus in WebM). */
export const VOICE_NOTE_MIME_TYPE = "audio/webm";

/** File extension for voice note recordings. */
export const VOICE_NOTE_FILE_EXTENSION = ".webm";

/** Prefix for generated voice note filenames. */
export const VOICE_NOTE_FILE_PREFIX = "voice";

/** Number of bars rendered in the saved voice note waveform. */
export const VOICE_NOTE_WAVEFORM_BARS = 48;

/** Number of bars kept visible in the live recording waveform. */
export const VOICE_NOTE_LIVE_WAVEFORM_BARS = 56;

/** Minimum normalized bar height (0-1) so silent passages stay visible. */
export const VOICE_NOTE_WAVEFORM_MIN_BAR = 0.08;

/** Default display title for a new voice note. */
export const VOICE_NOTE_DEFAULT_TITLE = "Voice Note";

/** Prefix for generated image attachment filenames. */
export const ATTACHMENT_IMAGE_FILE_PREFIX = "img";

/** Horizontal alignment options for embedded images. */
export const IMAGE_ALIGNMENTS = ["left", "center", "right"] as const;

/** Default alignment for newly inserted images. */
export const IMAGE_ALIGN_DEFAULT: (typeof IMAGE_ALIGNMENTS)[number] = "center";

/** Placeholder shown under an image until the user adds a caption. */
export const IMAGE_CAPTION_PLACEHOLDER = "Write a caption…";

/** Hidden OPFS directory name for attachment files (images, audio). */
export const ATTACHMENT_OPFS_ROOT_DIR = "mymemos-attachments";

/** Playback speeds cycled by clicking the speed control on voice notes. */
export const VOICE_NOTE_PLAYBACK_SPEEDS = [1, 1.5, 2] as const;

/** Error when attachment storage is unavailable in this browser. */
export const ATTACHMENT_FS_UNSUPPORTED_MESSAGE =
  "Attachments require a browser with private file storage (Chrome or Edge).";

/** Error when OPFS attachment root cannot be used. */
export const ATTACHMENT_STORAGE_UNAVAILABLE_MESSAGE = "Attachment storage is unavailable.";

/** Error when an attachment path is empty. */
export const ATTACHMENT_PATH_EMPTY_MESSAGE = "Attachment path is empty.";

/** Error when microphone access is denied. */
export const MICROPHONE_DENIED_MESSAGE =
  "Microphone access was denied. Voice notes need microphone permission to record.";

/** Error when getUserMedia / MediaRecorder is unavailable. */
export const MICROPHONE_UNSUPPORTED_MESSAGE =
  "Microphone recording is not supported in this browser.";

/** Error when Web Audio API is unavailable for waveforms. */
export const WEB_AUDIO_UNSUPPORTED_MESSAGE = "Web Audio API is not supported in this browser.";

/** Error when audio duration cannot be read from a blob. */
export const AUDIO_DURATION_READ_ERROR = "Could not read audio duration.";

/** Error when one or more images fail to save during multi-insert. */
export const IMAGE_INSERT_PARTIAL_FAILURE_MESSAGE =
  "Could not save one or more images. Please try again.";

/** Shown when an attachment image file cannot be loaded from OPFS. */
export const IMAGE_UNAVAILABLE_MESSAGE = "Image unavailable.";

/** Tooltip / aria for removing an embedded image. */
export const IMAGE_REMOVE_LABEL = "Remove image";

/** Aria label for the image alignment control group. */
export const IMAGE_ALIGN_GROUP_ARIA = "Align image";

/** Re-export theme types for consumers that import types alongside constants. */
export type { BuiltInThemeName, CustomThemeColors };
