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

/** Attachment kinds stored in OPFS via the attachment manager. */
export type AttachmentKind = "image" | "audio";

/**
 * Relative attachment reference persisted inside editor block attrs.
 * Binary data lives in Origin Private File System under `images/` or `audio/`.
 */
export interface AttachmentRef {
  /** Attachment category. */
  type: AttachmentKind;
  /** Path relative to the attachment root, e.g. `audio/voice_abc.webm`. */
  path: string;
  /** Duration in seconds (audio only). */
  duration?: number;
  /** File size in bytes. */
  size?: number;
  /** ISO timestamp when the attachment was created. */
  createdAt?: string;
  /** Optional display title shown in the editor block. */
  title?: string;
}

export type { BuiltInThemeName, CustomThemeColors } from "../../../shared/themeTypes";

import type { BuiltInThemeName, CustomThemeColors } from "../../../shared/themeTypes";

/** Active theme id - built-in preset or `custom-{id}`. */
export type ThemeName = BuiltInThemeName | `custom-${string}`;

/** User-created theme stored in settings. */
export interface CustomTheme {
  /** Short id; active theme uses `custom-{id}`. */
  id: string;
  /** Display name shown in the theme picker. */
  name: string;
  colors: CustomThemeColors;
}
