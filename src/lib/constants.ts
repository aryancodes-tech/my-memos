/** Display name of the product shown on the landing site. */
export const PRODUCT_NAME = "MyMemos";

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

/** Remote URL for the main product launch video on the landing page. */
export const LANDING_LAUNCH_VIDEO_SRC =
  "https://res.cloudinary.com/dhywccghy/video/upload/v1780797594/launch_1_wfzltd.mp4";

/** Poster image shown before the launch video loads. */
export const LANDING_LAUNCH_VIDEO_POSTER = "/launch-poster.png";

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
