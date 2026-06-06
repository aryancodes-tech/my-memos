/**
 * Tiptap/ProseMirror-compatible block document.
 * The shape is intentionally generic so we can swap the editor or extend it
 * without migrating storage.
 */
export interface BlockDoc {
  type: "doc";
  content: BlockNode[];
}
export interface BlockNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: BlockNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

/** A regular document or a folder container in the workspace sidebar. */
export type PageKind = "page" | "directory";

export interface Page {
  id: string;
  title: string;
  /** @deprecated Legacy emoji field; UI uses Lucide icons instead. */
  icon?: string;
  cover?: string;
  parent_id: string | null;
  /** Workspace bucket; favorites and recents are derived, not stored as sections. */
  section: string;
  kind: PageKind;
  favorite: boolean;
  archived: boolean;
  tags: string[];
  created_at: number;
  updated_at: number;
  doc: BlockDoc;
}

export interface ImageBlob {
  id: string;
  mime: string;
  data: Blob;
  width?: number;
  height?: number;
  created_at: number;
}

export type BuiltInThemeName =
  | "light"
  | "dark"
  | "midnight"
  | "dracula"
  | "solarized"
  | "forest"
  | "ocean";

/** Active theme id - built-in preset or `custom-{id}`. */
export type ThemeName = BuiltInThemeName | `custom-${string}`;

/** Primary colors users pick when creating a custom theme. */
export interface CustomThemeColors {
  /** Page background color. */
  bg: string;
  /** Primary text color. */
  text: string;
  /** Accent / link color. */
  accent: string;
}

/** User-created theme stored in settings. */
export interface CustomTheme {
  /** Short id; active theme uses `custom-{id}`. */
  id: string;
  /** Display name shown in the theme picker. */
  name: string;
  colors: CustomThemeColors;
}
