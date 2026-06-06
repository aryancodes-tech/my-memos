import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Editor } from "@tiptap/react";
import * as db from "@/storage/db";
import type { Page, PageKind, CustomTheme, CustomThemeColors, ThemeName } from "@/storage/types";
import {
  COLLAPSED_DIRS_SETTING,
  CUSTOM_THEMES_SETTING,
  DEFAULT_THEME,
  RECENT_PAGE_LIMIT,
  SETTINGS_KEYS,
  WORKSPACE_SECTION
} from "@/lib/constants";
import { len } from "@/lib/text";
import {
  applyThemeToDocument,
  getCustomThemeStorageId,
  isCustomThemeId,
  syncCustomThemeStyles,
  toCustomThemeName
} from "@/lib/themes";

/** Legacy sidebar section names migrated into the workspace section. */
const LEGACY_SECTIONS = new Set([
  "Favorites",
  "Recent",
  "System Design",
  "Backend",
  "Distributed Systems",
  "Databases",
  "Operating Systems",
  "Networking",
  "DSA",
  "Projects",
  "Interview Preparation"
]);

type View = { kind: "page"; id: string } | { kind: "dashboard" };

/** Pending delete confirmation shown in the global dialog. */
export interface PendingDelete {
  pageId: string;
  childCount: number;
}

/** Pending link edit shown in the global link dialog. */
export interface PendingLink {
  initialHref: string;
}

interface State {
  ready: boolean;
  pages: Page[];
  view: View;
  theme: ThemeName;
  /** User-created themes persisted in settings. */
  customThemes: CustomTheme[];
  /** Whether the add-custom-theme dialog is open. */
  customThemeDialogOpen: boolean;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  /** Directory ids whose children are hidden in the workspace tree. */
  collapsedDirs: Record<string, boolean>;
  /** Item awaiting user confirmation before permanent deletion. */
  pendingDelete: PendingDelete | null;
  /** Link dialog state while adding or editing a hyperlink. */
  pendingLink: PendingLink | null;
  /** Active page editor instance, set while a page is open. */
  pageEditor: Editor | null;

  init: () => Promise<void>;
  setView: (v: View) => void;
  setTheme: (t: ThemeName) => void;
  openCustomThemeDialog: () => void;
  closeCustomThemeDialog: () => void;
  addCustomTheme: (name: string, colors: CustomThemeColors) => Promise<void>;
  removeCustomTheme: (id: string) => Promise<void>;
  toggleSidebar: () => void;
  setSearchOpen: (b: boolean) => void;
  toggleDirectory: (id: string) => void;
  requestDelete: (pageId: string, childCount?: number) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  requestLink: (initialHref?: string) => void;
  cancelLink: () => void;
  applyLink: (href: string) => void;
  removeLink: () => void;

  createPage: (parent_id?: string | null) => Promise<Page>;
  createDirectory: (parent_id?: string | null) => Promise<Page>;
  updatePage: (id: string, patch: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;

  setPageEditor: (editor: Editor | null) => void;
}

function normalizePage(page: Page): Page {
  const kind: PageKind = page.kind === "directory" ? "directory" : "page";
  const section =
    LEGACY_SECTIONS.has(page.section) || page.section.length === 0
      ? WORKSPACE_SECTION
      : page.section;
  return { ...page, kind, section };
}

function collectDescendantIds(pages: Page[], rootId: string): string[] {
  const ids: string[] = [];
  const walk = (parentId: string) => {
    for (const page of pages) {
      if (page.parent_id === parentId) {
        ids.push(page.id);
        walk(page.id);
      }
    }
  };
  walk(rootId);
  return ids;
}

/** Restores a saved view, falling back when the target no longer exists. */
function resolveView(lastView: View | undefined, pages: Page[]): View {
  if (!lastView || (lastView as { kind?: string }).kind === "study") {
    return { kind: "dashboard" };
  }
  if (lastView.kind === "page" && !pages.some((page) => page.id === lastView.id)) {
    return { kind: "dashboard" };
  }
  return lastView;
}

export const useStore = create<State>((set, get) => ({
  ready: false,
  pages: [],
  view: { kind: "dashboard" },
  theme: DEFAULT_THEME,
  customThemes: [],
  customThemeDialogOpen: false,
  sidebarCollapsed: false,
  searchOpen: false,
  collapsedDirs: {},
  pendingDelete: null,
  pendingLink: null,
  pageEditor: null,

  async init() {
    const [rawPages, theme, customThemes, collapsedDirs, lastView] = await Promise.all([
      db.listPages(),
      db.getSetting<ThemeName>(SETTINGS_KEYS.theme),
      db.getSetting<CustomTheme[]>(CUSTOM_THEMES_SETTING),
      db.getSetting<Record<string, boolean>>(COLLAPSED_DIRS_SETTING),
      db.getSetting<View>(SETTINGS_KEYS.lastView)
    ]);

    const savedCustomThemes = customThemes ?? [];
    syncCustomThemeStyles(savedCustomThemes);

    const activeTheme = theme ?? DEFAULT_THEME;
    const themeIsMissingCustom =
      isCustomThemeId(activeTheme) &&
      !savedCustomThemes.some((item) => item.id === getCustomThemeStorageId(activeTheme));
    const resolvedTheme = themeIsMissingCustom ? DEFAULT_THEME : activeTheme;

    const pages = rawPages.map(normalizePage);
    const resolvedView = resolveView(lastView, pages);
    const toPersist = pages.filter((normalized, index) => {
      const original = rawPages[index];
      return original.kind !== normalized.kind || original.section !== normalized.section;
    });
    if (toPersist.length > 0) {
      await Promise.all(toPersist.map((page) => db.putPage(page)));
    }

    set({
      pages,
      theme: resolvedTheme,
      customThemes: savedCustomThemes,
      collapsedDirs: collapsedDirs ?? {},
      view: resolvedView,
      ready: true
    });
    applyThemeToDocument(resolvedTheme, savedCustomThemes);
    if (themeIsMissingCustom) {
      void db.setSetting(SETTINGS_KEYS.theme, resolvedTheme);
    }
    if (lastView && resolvedView !== lastView) {
      void db.setSetting(SETTINGS_KEYS.lastView, resolvedView);
    }
  },

  setView(v) {
    set({
      view: v,
      pageEditor: v.kind === "page" ? get().pageEditor : null,
      pendingLink: v.kind === "page" ? get().pendingLink : null
    });
    void db.setSetting(SETTINGS_KEYS.lastView, v);
  },
  setTheme(t) {
    const { customThemes } = get();
    set({ theme: t });
    applyThemeToDocument(t, customThemes);
    void db.setSetting(SETTINGS_KEYS.theme, t);
  },

  openCustomThemeDialog() {
    set({ customThemeDialogOpen: true });
  },

  closeCustomThemeDialog() {
    set({ customThemeDialogOpen: false });
  },

  async addCustomTheme(name, colors) {
    const trimmedName = name.trim();
    if (len(trimmedName) === 0) return;

    const theme: CustomTheme = {
      id: nanoid(8),
      name: trimmedName,
      colors
    };
    const customThemes = [...get().customThemes, theme];
    syncCustomThemeStyles(customThemes);
    set({ customThemes, customThemeDialogOpen: false });
    get().setTheme(toCustomThemeName(theme.id));
    await db.setSetting(CUSTOM_THEMES_SETTING, customThemes);
  },

  async removeCustomTheme(id) {
    const { theme, customThemes } = get();
    const nextThemes = customThemes.filter((item) => item.id !== id);
    syncCustomThemeStyles(nextThemes);
    set({ customThemes: nextThemes });

    if (getCustomThemeStorageId(theme) === id) {
      get().setTheme(DEFAULT_THEME);
    }

    await db.setSetting(CUSTOM_THEMES_SETTING, nextThemes);
  },

  toggleSidebar() {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
  },
  setSearchOpen(b) {
    set({ searchOpen: b });
  },
  setPageEditor(editor) {
    set({ pageEditor: editor });
  },
  toggleDirectory(id) {
    set((s) => {
      const collapsed = !s.collapsedDirs[id];
      const collapsedDirs = { ...s.collapsedDirs, [id]: collapsed };
      void db.setSetting(COLLAPSED_DIRS_SETTING, collapsedDirs);
      return { collapsedDirs };
    });
  },

  requestDelete(pageId, childCount = 0) {
    set({ pendingDelete: { pageId, childCount } });
  },

  cancelDelete() {
    set({ pendingDelete: null });
  },

  async confirmDelete() {
    const pending = get().pendingDelete;
    if (!pending) return;
    set({ pendingDelete: null });
    await get().deletePage(pending.pageId);
  },

  requestLink(initialHref = "") {
    set({ pendingLink: { initialHref } });
  },

  cancelLink() {
    set({ pendingLink: null });
  },

  applyLink(href) {
    const { pageEditor } = get();
    set({ pendingLink: null });
    if (!pageEditor) return;

    const trimmed = href.trim();
    if (len(trimmed) === 0) return;

    pageEditor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  },

  removeLink() {
    const { pageEditor } = get();
    set({ pendingLink: null });
    if (!pageEditor) return;

    pageEditor.chain().focus().extendMarkRange("link").unsetLink().run();
  },

  async createPage(parent_id = null) {
    const now = Date.now();
    const page: Page = {
      id: nanoid(),
      title: "Untitled",
      kind: "page",
      parent_id,
      section: WORKSPACE_SECTION,
      favorite: false,
      archived: false,
      tags: [],
      created_at: now,
      updated_at: now,
      doc: { type: "doc", content: [{ type: "paragraph" }] }
    };
    await db.putPage(page);
    set((s) => ({
      pages: [page, ...s.pages],
      view: { kind: "page", id: page.id },
      collapsedDirs:
        parent_id !== null
          ? { ...s.collapsedDirs, [parent_id]: false }
          : s.collapsedDirs
    }));
    return page;
  },

  async createDirectory(parent_id = null) {
    const now = Date.now();
    const directory: Page = {
      id: nanoid(),
      title: "Untitled folder",
      kind: "directory",
      parent_id,
      section: WORKSPACE_SECTION,
      favorite: false,
      archived: false,
      tags: [],
      created_at: now,
      updated_at: now,
      doc: { type: "doc", content: [] }
    };
    await db.putPage(directory);
    set((s) => ({
      pages: [directory, ...s.pages],
      collapsedDirs: {
        ...s.collapsedDirs,
        [directory.id]: false,
        ...(parent_id !== null ? { [parent_id]: false } : {})
      }
    }));
    return directory;
  },

  async updatePage(id, patch) {
    const current = get().pages.find((p) => p.id === id);
    if (!current) return;
    const next: Page = { ...current, ...patch, updated_at: Date.now() };
    await db.putPage(next);
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? next : p)) }));
  },

  async deletePage(id) {
    const { pages } = get();
    const target = pages.find((p) => p.id === id);
    if (!target) return;

    const removeIds = new Set<string>([id]);
    if (target.kind === "directory") {
      for (const childId of collectDescendantIds(pages, id)) {
        removeIds.add(childId);
      }
    }

    await Promise.all([...removeIds].map((pageId) => db.deletePage(pageId)));
    set((s) => {
      const nextCollapsed = { ...s.collapsedDirs };
      for (const pageId of removeIds) {
        delete nextCollapsed[pageId];
      }
      void db.setSetting(COLLAPSED_DIRS_SETTING, nextCollapsed);
      return {
        pages: s.pages.filter((p) => !removeIds.has(p.id)),
        collapsedDirs: nextCollapsed,
        view:
          s.view.kind === "page" && removeIds.has(s.view.id)
            ? { kind: "dashboard" }
            : s.view
      };
    });
  }
}));

/** Pages shown in Favorites / Recent — documents only, never folders. */
export function isSidebarPage(page: Page): boolean {
  return page.kind !== "directory" && !page.archived;
}

export function selectFavoritePages(pages: Page[]): Page[] {
  return pages.filter((p) => isSidebarPage(p) && p.favorite);
}

/** Pages eligible for sidebar lists, search, and dashboard. */
export function selectSearchablePages(pages: Page[]): Page[] {
  return pages.filter(isSidebarPage);
}

function selectRecentSorted(pages: Page[]): Page[] {
  return [...selectSearchablePages(pages)].sort(
    (a, b) => b.updated_at - a.updated_at
  );
}

/** Recent pages for the sidebar, capped at RECENT_PAGE_LIMIT. */
export function selectRecentPages(pages: Page[]): Page[] {
  return selectRecentSorted(pages).slice(0, RECENT_PAGE_LIMIT);
}

/** All recent pages for the dashboard, sorted by last activity. */
export function selectDashboardRecentPages(pages: Page[]): Page[] {
  return selectRecentSorted(pages);
}

function sortWorkspaceItems(a: Page, b: Page): number {
  if (a.kind !== b.kind) {
    return a.kind === "directory" ? -1 : 1;
  }
  return b.updated_at - a.updated_at;
}

export function selectWorkspaceRoots(pages: Page[]): Page[] {
  return pages
    .filter(
      (p) =>
        !p.archived &&
        p.section === WORKSPACE_SECTION &&
        p.parent_id === null
    )
    .sort(sortWorkspaceItems);
}

export function selectWorkspaceChildren(pages: Page[], parentId: string): Page[] {
  return pages
    .filter(
      (p) =>
        !p.archived &&
        p.section === WORKSPACE_SECTION &&
        p.parent_id === parentId
    )
    .sort(sortWorkspaceItems);
}
