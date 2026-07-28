import { create } from "zustand";
import { RECENT_PAGE_LIMIT, WORKSPACE_SECTION } from "@/lib/constants";
import { len } from "@/lib/text";
import type { Page } from "@/storage/types";
import { createDialogsSlice } from "@/store/slices/dialogs";
import { createEditorBridgeSlice } from "@/store/slices/editorBridge";
import { createOnboardingSlice } from "@/store/slices/onboarding";
import { createPagesWorkspaceSlice } from "@/store/slices/pagesWorkspace";
import { createThemeUiSlice } from "@/store/slices/themeUi";
import type { StoreState } from "@/store/types";

export type {
  PendingAttachmentDelete,
  PendingDelete,
  PendingLink,
  StoreState,
  View,
} from "@/store/types";

/**
 * Application store composed from concern slices:
 * pages/workspace, theme UI, dialogs, TipTap editor bridge, and onboarding.
 */
export const useStore = create<StoreState>()((...args) => ({
  ...createPagesWorkspaceSlice(...args),
  ...createThemeUiSlice(...args),
  ...createDialogsSlice(...args),
  ...createEditorBridgeSlice(...args),
  ...createOnboardingSlice(...args),
}));

/** Returns true when a page lives at the workspace root (not inside a folder). */
export function isWorkspaceRoot(page: Pick<Page, "parent_id">): boolean {
  return len(page.parent_id ?? "") === 0;
}

/** Pages shown in Favorites / Recent - documents only, never folders. */
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
  return [...selectSearchablePages(pages)].sort((a, b) => b.updated_at - a.updated_at);
}

/** Recent pages for the sidebar, capped at RECENT_PAGE_LIMIT (UI may show fewer until expanded). */
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
    .filter((p) => !p.archived && p.section === WORKSPACE_SECTION && isWorkspaceRoot(p))
    .sort(sortWorkspaceItems);
}

export function selectWorkspaceChildren(pages: Page[], parentId: string): Page[] {
  return pages
    .filter(
      (p) =>
        !p.archived &&
        p.section === WORKSPACE_SECTION &&
        len(p.parent_id ?? "") > 0 &&
        p.parent_id === parentId,
    )
    .sort(sortWorkspaceItems);
}
