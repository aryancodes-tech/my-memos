import type { StateCreator } from "zustand";
import { nanoid } from "nanoid";
import * as db from "@/storage/db";
import type { Page, PageKind } from "@/storage/types";
import {
  COLLAPSED_DIRS_SETTING,
  CUSTOM_THEMES_SETTING,
  DEFAULT_FOLDER_TITLE,
  DEFAULT_PAGE_TITLE,
  DEFAULT_THEME,
  SETTINGS_KEYS,
  WORKSPACE_SECTION,
} from "@/lib/constants";
import { len } from "@/lib/text";
import { deleteAttachment } from "@/lib/attachments/attachmentManager";
import { collectOrphanedAttachmentPaths } from "@/lib/attachments/sanitizeBlockDoc";
import { canMoveWorkspaceItem, normalizeWorkspaceSection } from "@/lib/workspaceTree";
import {
  applyThemeToDocument,
  getCustomThemeStorageId,
  isCustomThemeId,
  syncCustomThemeStyles,
} from "@/lib/themes";
import { maybeSeedDemoWorkspace } from "@/onboarding/seedDemoWorkspace";
import type { CustomTheme, ThemeName } from "@/storage/types";
import type { PagesWorkspaceSlice, StoreState, View } from "@/store/types";

function normalizePage(page: Page): Page {
  const kind: PageKind = page.kind === "directory" ? "directory" : "page";
  const section = normalizeWorkspaceSection(page.section);
  const parent_id = len(page.parent_id ?? "") > 0 ? page.parent_id : null;
  return { ...page, kind, section, parent_id };
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

export const createPagesWorkspaceSlice: StateCreator<StoreState, [], [], PagesWorkspaceSlice> = (
  set,
  get,
) => ({
  ready: false,
  pages: [],
  view: { kind: "dashboard" },
  sidebarCollapsed: false,
  searchOpen: false,
  collapsedDirs: {},

  async init() {
    const [rawPages, theme, customThemes, collapsedDirs, lastView] = await Promise.all([
      db.listPages(),
      db.getSetting<ThemeName>(SETTINGS_KEYS.theme),
      db.getSetting<CustomTheme[]>(CUSTOM_THEMES_SETTING),
      db.getSetting<Record<string, boolean>>(COLLAPSED_DIRS_SETTING),
      db.getSetting<View>(SETTINGS_KEYS.lastView),
    ]);

    const savedCustomThemes = customThemes ?? [];
    syncCustomThemeStyles(savedCustomThemes);

    const activeTheme = theme ?? DEFAULT_THEME;
    const themeIsMissingCustom =
      isCustomThemeId(activeTheme) &&
      !savedCustomThemes.some((item) => item.id === getCustomThemeStorageId(activeTheme));
    const resolvedTheme = themeIsMissingCustom ? DEFAULT_THEME : activeTheme;

    const pagesNormalized = rawPages.map(normalizePage);
    const toPersist = pagesNormalized.filter((normalized, index) => {
      const original = rawPages[index];
      return original.kind !== normalized.kind || original.section !== normalized.section;
    });
    if (toPersist.length > 0) {
      await Promise.all(toPersist.map((page) => db.putPage(page)));
    }

    let pages = pagesNormalized;
    let resolvedView = resolveView(lastView, pages);
    let seededView = false;

    const seeded = await maybeSeedDemoWorkspace(pages);
    if (seeded) {
      pages = seeded.pages;
      resolvedView = seeded.view;
      seededView = true;
    }

    set({
      pages,
      theme: resolvedTheme,
      customThemes: savedCustomThemes,
      collapsedDirs: collapsedDirs ?? {},
      view: resolvedView,
      ready: true,
    });
    applyThemeToDocument(resolvedTheme, savedCustomThemes);
    if (themeIsMissingCustom) {
      void db.setSetting(SETTINGS_KEYS.theme, resolvedTheme);
    }
    if (seededView || (lastView && resolvedView !== lastView)) {
      void db.setSetting(SETTINGS_KEYS.lastView, resolvedView);
    }
  },

  setView(v) {
    set({
      view: v,
      pageEditor: v.kind === "page" ? get().pageEditor : null,
      pendingLink: v.kind === "page" ? get().pendingLink : null,
    });
    void db.setSetting(SETTINGS_KEYS.lastView, v);
  },

  toggleSidebar() {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
  },

  setSearchOpen(b) {
    set({ searchOpen: b });
  },

  toggleDirectory(id) {
    set((s) => {
      const collapsed = !s.collapsedDirs[id];
      const collapsedDirs = { ...s.collapsedDirs, [id]: collapsed };
      void db.setSetting(COLLAPSED_DIRS_SETTING, collapsedDirs);
      return { collapsedDirs };
    });
  },

  async createPage(parent_id = null) {
    const now = Date.now();
    const page: Page = {
      id: nanoid(),
      title: DEFAULT_PAGE_TITLE,
      kind: "page",
      parent_id,
      section: WORKSPACE_SECTION,
      favorite: false,
      archived: false,
      tags: [],
      created_at: now,
      updated_at: now,
      doc: { type: "doc", content: [{ type: "paragraph" }] },
    };
    await db.putPage(page);
    set((s) => ({
      pages: [page, ...s.pages],
      view: { kind: "page", id: page.id },
      collapsedDirs:
        parent_id !== null ? { ...s.collapsedDirs, [parent_id]: false } : s.collapsedDirs,
    }));
    return page;
  },

  async createDirectory(parent_id = null) {
    const now = Date.now();
    const directory: Page = {
      id: nanoid(),
      title: DEFAULT_FOLDER_TITLE,
      kind: "directory",
      parent_id,
      section: WORKSPACE_SECTION,
      favorite: false,
      archived: false,
      tags: [],
      created_at: now,
      updated_at: now,
      doc: { type: "doc", content: [] },
    };
    await db.putPage(directory);
    set((s) => ({
      pages: [directory, ...s.pages],
      collapsedDirs: {
        ...s.collapsedDirs,
        [directory.id]: false,
        ...(parent_id !== null ? { [parent_id]: false } : {}),
      },
    }));
    return directory;
  },

  async updatePage(id, patch) {
    const current = get().pages.find((p) => p.id === id);
    if (!current) return;
    const next = normalizePage({ ...current, ...patch, updated_at: Date.now() });
    await db.putPage(next);
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? next : p)) }));
  },

  async moveWorkspaceItem(pageId, newParentId) {
    const { pages, collapsedDirs } = get();
    const resolvedParentId = len(newParentId ?? "") > 0 ? newParentId! : null;

    if (!canMoveWorkspaceItem(pages, pageId, resolvedParentId)) {
      return;
    }

    const item = pages.find((page) => page.id === pageId);
    if (!item) {
      return;
    }

    const currentParentId = len(item.parent_id ?? "") > 0 ? item.parent_id : null;
    if (currentParentId === resolvedParentId) {
      return;
    }

    const next = normalizePage({
      ...item,
      parent_id: resolvedParentId,
      updated_at: Date.now(),
    });
    await db.putPage(next);
    set((s) => ({ pages: s.pages.map((p) => (p.id === pageId ? next : p)) }));

    if (resolvedParentId === null) {
      return;
    }

    const nextCollapsed = { ...collapsedDirs, [resolvedParentId]: false };
    set({ collapsedDirs: nextCollapsed });
    void db.setSetting(COLLAPSED_DIRS_SETTING, nextCollapsed);
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

    const orphanedPaths = collectOrphanedAttachmentPaths(pages, removeIds);

    await Promise.all([...removeIds].map((pageId) => db.deletePage(pageId)));
    await Promise.all(orphanedPaths.map((path) => deleteAttachment(path)));
    set((s) => {
      const nextCollapsed = { ...s.collapsedDirs };
      for (const pageId of removeIds) {
        delete nextCollapsed[pageId];
      }
      void db.setSetting(COLLAPSED_DIRS_SETTING, nextCollapsed);
      return {
        pages: s.pages.filter((p) => !removeIds.has(p.id)),
        collapsedDirs: nextCollapsed,
        view: s.view.kind === "page" && removeIds.has(s.view.id) ? { kind: "dashboard" } : s.view,
      };
    });
  },
});
