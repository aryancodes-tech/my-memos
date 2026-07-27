import { WORKSPACE_SECTION } from "@/lib/constants";
import { len } from "@/lib/text";
import type { Page } from "@/storage/types";

/** Legacy sidebar section names treated as workspace pages for move validation / migration. */
export const LEGACY_WORKSPACE_SECTIONS = new Set([
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
  "Interview Preparation",
]);

/** Normalizes a stored section value to the current workspace section when applicable. */
export function normalizeWorkspaceSection(section: string): string {
  if (LEGACY_WORKSPACE_SECTIONS.has(section) || len(section) === 0) {
    return WORKSPACE_SECTION;
  }
  return section;
}

/**
 * Returns true when `nodeId` is the same as or nested under `ancestorId` in the workspace tree.
 */
export function isDescendant(pages: Page[], ancestorId: string, nodeId: string): boolean {
  let current = pages.find((page) => page.id === nodeId);

  while (current !== undefined && current.parent_id !== null) {
    if (current.parent_id === ancestorId) {
      return true;
    }
    current = pages.find((page) => page.id === current!.parent_id);
  }

  return false;
}

/**
 * Validates whether a workspace page or folder can be moved under `newParentId`
 * (`null` = workspace root).
 */
export function canMoveWorkspaceItem(
  pages: Page[],
  pageId: string,
  newParentId: string | null,
): boolean {
  if (newParentId !== null && pageId === newParentId) {
    return false;
  }

  const item = pages.find((page) => page.id === pageId);
  if (!item || item.archived || normalizeWorkspaceSection(item.section) !== WORKSPACE_SECTION) {
    return false;
  }

  if (newParentId === null) {
    return true;
  }

  const parent = pages.find((page) => page.id === newParentId);
  if (
    !parent ||
    parent.archived ||
    normalizeWorkspaceSection(parent.section) !== WORKSPACE_SECTION ||
    parent.kind !== "directory"
  ) {
    return false;
  }

  if (item.kind === "directory" && isDescendant(pages, pageId, newParentId)) {
    return false;
  }

  return true;
}

/**
 * Resolves the parent id when dropping a dragged item onto a folder row (always nests inside).
 */
export function resolveFolderDropParentId(
  _pages: Page[],
  _dragPageId: string,
  folder: Pick<Page, "id">,
): string {
  return folder.id;
}

/**
 * Returns true when a dragged item can be dropped onto a folder row.
 */
export function canDropOntoFolder(
  pages: Page[],
  dragPageId: string,
  folder: Pick<Page, "id">,
): boolean {
  return canMoveWorkspaceItem(
    pages,
    dragPageId,
    resolveFolderDropParentId(pages, dragPageId, folder),
  );
}

/**
 * Returns true when a dragged item can be dropped onto a page row
 * (moves to the same parent as that page).
 */
export function canDropOntoPage(
  pages: Page[],
  dragPageId: string,
  page: Pick<Page, "parent_id">,
): boolean {
  return canMoveWorkspaceItem(pages, dragPageId, page.parent_id);
}
