import { describe, expect, it } from "vitest";
import { RECENT_PAGE_LIMIT } from "@/lib/constants";
import {
  isSidebarPage,
  selectDashboardRecentPages,
  selectFavoritePages,
  selectRecentPages,
  selectSearchablePages,
  selectWorkspaceChildren,
  selectWorkspaceRoots,
} from "@/store/useStore";
import type { Page } from "@/storage/types";

function page(overrides: Partial<Page> & Pick<Page, "id">): Page {
  return {
    title: "Test",
    parent_id: null,
    section: "Pages",
    kind: "page",
    favorite: false,
    archived: false,
    tags: [],
    created_at: 0,
    updated_at: 0,
    doc: { type: "doc", content: [] },
    ...overrides,
  };
}

describe("isSidebarPage", () => {
  it("includes only non-archived document pages", () => {
    expect(isSidebarPage(page({ id: "p" }))).toBe(true);
    expect(isSidebarPage(page({ id: "d", kind: "directory" }))).toBe(false);
    expect(isSidebarPage(page({ id: "a", archived: true }))).toBe(false);
  });
});

describe("selectFavoritePages", () => {
  it("returns favorite documents only", () => {
    const pages = [
      page({ id: "fav", favorite: true, updated_at: 2 }),
      page({ id: "plain", favorite: false }),
      page({ id: "fav-dir", kind: "directory", favorite: true }),
      page({ id: "archived-fav", favorite: true, archived: true }),
    ];
    expect(selectFavoritePages(pages).map((p) => p.id)).toEqual(["fav"]);
  });
});

describe("selectSearchablePages", () => {
  it("excludes directories and archived pages", () => {
    const pages = [
      page({ id: "ok" }),
      page({ id: "dir", kind: "directory" }),
      page({ id: "gone", archived: true }),
    ];
    expect(selectSearchablePages(pages).map((p) => p.id)).toEqual(["ok"]);
  });
});

describe("selectRecentPages / selectDashboardRecentPages", () => {
  it("sorts by updated_at descending", () => {
    const pages = [
      page({ id: "old", updated_at: 1 }),
      page({ id: "new", updated_at: 3 }),
      page({ id: "mid", updated_at: 2 }),
    ];
    expect(selectDashboardRecentPages(pages).map((p) => p.id)).toEqual(["new", "mid", "old"]);
  });

  it("caps sidebar recent at RECENT_PAGE_LIMIT", () => {
    const pages = Array.from({ length: RECENT_PAGE_LIMIT + 5 }, (_, index) =>
      page({ id: `p-${index}`, updated_at: index }),
    );
    const recent = selectRecentPages(pages);
    expect(recent).toHaveLength(RECENT_PAGE_LIMIT);
    expect(recent[0]?.id).toBe(`p-${RECENT_PAGE_LIMIT + 4}`);
    expect(selectDashboardRecentPages(pages)).toHaveLength(RECENT_PAGE_LIMIT + 5);
  });

  it("ignores directories even when recently updated", () => {
    const pages = [
      page({ id: "folder", kind: "directory", updated_at: 99 }),
      page({ id: "doc", updated_at: 1 }),
    ];
    expect(selectRecentPages(pages).map((p) => p.id)).toEqual(["doc"]);
  });
});

describe("workspace selectors edge cases", () => {
  it("excludes archived roots and non-workspace sections", () => {
    const pages = [
      page({ id: "root" }),
      page({ id: "archived-root", archived: true }),
      page({ id: "other-section", section: "Other" }),
      page({ id: "folder", kind: "directory", updated_at: 10 }),
      page({ id: "nested", parent_id: "folder", updated_at: 5 }),
    ];
    expect(selectWorkspaceRoots(pages).map((p) => p.id)).toEqual(["folder", "root"]);
    expect(selectWorkspaceChildren(pages, "folder").map((p) => p.id)).toEqual(["nested"]);
    expect(selectWorkspaceChildren(pages, "missing")).toEqual([]);
  });

  it("sorts directories before pages, then by updated_at", () => {
    const pages = [
      page({ id: "page-new", updated_at: 20 }),
      page({ id: "dir-old", kind: "directory", updated_at: 1 }),
      page({ id: "dir-new", kind: "directory", updated_at: 30 }),
      page({ id: "page-old", updated_at: 2 }),
    ];
    expect(selectWorkspaceRoots(pages).map((p) => p.id)).toEqual([
      "dir-new",
      "dir-old",
      "page-new",
      "page-old",
    ]);
  });
});
