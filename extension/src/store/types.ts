import type { Editor } from "@tiptap/react";
import type { Page, CustomTheme, CustomThemeColors, ThemeName } from "@/storage/types";

export type View = { kind: "page"; id: string } | { kind: "dashboard" };

/** Pending delete confirmation shown in the global dialog. */
export interface PendingDelete {
  pageId: string;
  childCount: number;
}

/** Pending link edit shown in the global link dialog. */
export interface PendingLink {
  initialHref: string;
}

/**
 * Pending attachment delete confirmation.
 * Serializable payload only - confirm deletes OPFS file + matching editor node via pageEditor.
 */
export interface PendingAttachmentDelete {
  attachmentPath: string;
}

/** Workspace pages, view routing, and sidebar chrome. */
export interface PagesWorkspaceSlice {
  ready: boolean;
  pages: Page[];
  view: View;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  collapsedDirs: Record<string, boolean>;

  init: () => Promise<void>;
  setView: (v: View) => void;
  toggleSidebar: () => void;
  setSearchOpen: (b: boolean) => void;
  toggleDirectory: (id: string) => void;
  createPage: (parent_id?: string | null) => Promise<Page>;
  createDirectory: (parent_id?: string | null) => Promise<Page>;
  updatePage: (id: string, patch: Partial<Page>) => Promise<void>;
  moveWorkspaceItem: (pageId: string, newParentId: string | null) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
}

/** Theme selection and custom theme CRUD. */
export interface ThemeUiSlice {
  theme: ThemeName;
  customThemes: CustomTheme[];
  customThemeDialogOpen: boolean;

  setTheme: (t: ThemeName) => void;
  openCustomThemeDialog: () => void;
  closeCustomThemeDialog: () => void;
  addCustomTheme: (name: string, colors: CustomThemeColors) => Promise<void>;
  removeCustomTheme: (id: string) => Promise<void>;
}

/** Global dialog flags (page delete, link, attachment delete). */
export interface DialogsSlice {
  pendingDelete: PendingDelete | null;
  pendingLink: PendingLink | null;
  pendingAttachmentDelete: PendingAttachmentDelete | null;

  requestDelete: (pageId: string, childCount?: number) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  requestLink: (initialHref?: string) => void;
  cancelLink: () => void;
  requestAttachmentDelete: (payload: PendingAttachmentDelete) => void;
  cancelAttachmentDelete: () => void;
}

/** TipTap editor bridge (link apply + attachment node removal on confirm). */
export interface EditorBridgeSlice {
  pageEditor: Editor | null;

  setPageEditor: (editor: Editor | null) => void;
  applyLink: (href: string) => void;
  removeLink: () => void;
  confirmAttachmentDelete: () => Promise<void>;
}

/** First-run product tour coachmarks. */
export interface OnboardingSlice {
  /** True after settings for the tour have been read. */
  tourHydrated: boolean;
  tourActive: boolean;
  tourStepIndex: number;
  tourCompleted: boolean;

  hydrateTour: () => Promise<void>;
  startTour: () => void;
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  nextTourStep: () => void;
  prevTourStep: () => void;
}

export type StoreState = PagesWorkspaceSlice &
  ThemeUiSlice &
  DialogsSlice &
  EditorBridgeSlice &
  OnboardingSlice;
