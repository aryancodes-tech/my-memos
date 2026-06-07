import { describe, expect, it } from "vitest";
import {
  canDropOntoFolder,
  canDropOntoPage,
  canMoveWorkspaceItem,
  isDescendant,
  resolveFolderDropParentId,
} from "./workspace-tree";
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

describe("isDescendant", () => {
  const pages = [
    page({ id: "folder", kind: "directory" }),
    page({ id: "child", parent_id: "folder" }),
    page({ id: "grandchild", parent_id: "child" }),
    page({ id: "other" }),
  ];

  it("detects direct and nested descendants", () => {
    expect(isDescendant(pages, "folder", "child")).toBe(true);
    expect(isDescendant(pages, "folder", "grandchild")).toBe(true);
    expect(isDescendant(pages, "folder", "other")).toBe(false);
  });
});

describe("canMoveWorkspaceItem", () => {
  const pages = [
    page({ id: "root-folder", kind: "directory" }),
    page({ id: "nested-page", parent_id: "root-folder" }),
    page({ id: "nested-folder", kind: "directory", parent_id: "root-folder" }),
    page({ id: "deep-page", parent_id: "nested-folder" }),
  ];

  it("allows moving pages into folders and back to root", () => {
    expect(canMoveWorkspaceItem(pages, "deep-page", "root-folder")).toBe(true);
    expect(canMoveWorkspaceItem(pages, "deep-page", null)).toBe(true);
  });

  it("blocks moving a folder into itself or its descendants", () => {
    expect(canMoveWorkspaceItem(pages, "root-folder", "root-folder")).toBe(false);
    expect(canMoveWorkspaceItem(pages, "root-folder", "nested-folder")).toBe(false);
    expect(canMoveWorkspaceItem(pages, "root-folder", "deep-page")).toBe(false);
  });

  it("blocks moving pages into non-directory parents", () => {
    expect(canMoveWorkspaceItem(pages, "deep-page", "nested-page")).toBe(false);
  });
});

describe("resolveFolderDropParentId", () => {
  const pages = [
    page({ id: "root-folder", kind: "directory" }),
    page({ id: "nested-folder", kind: "directory", parent_id: "root-folder" }),
    page({ id: "deep-page", parent_id: "nested-folder" }),
  ];

  it("always nests inside the target folder", () => {
    expect(resolveFolderDropParentId(pages, "nested-folder", pages[0]!)).toBe("root-folder");
    expect(resolveFolderDropParentId(pages, "deep-page", pages[1]!)).toBe("nested-folder");
  });
});

describe("canDropOntoFolder", () => {
  const pages = [
    page({ id: "root-folder", kind: "directory" }),
    page({ id: "nested-folder", kind: "directory", parent_id: "root-folder" }),
    page({ id: "deep-page", parent_id: "nested-folder" }),
  ];

  it("allows nesting into folders", () => {
    expect(canDropOntoFolder(pages, "deep-page", pages[0]!)).toBe(true);
  });

  it("allows moving nested pages to root via a root-level page row", () => {
    const rootPage = page({ id: "root-page" });
    expect(canDropOntoPage([...pages, rootPage], "deep-page", rootPage)).toBe(true);
  });
});
