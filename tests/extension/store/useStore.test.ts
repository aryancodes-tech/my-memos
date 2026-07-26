import { describe, expect, it } from "vitest";
import { isWorkspaceRoot, selectWorkspaceChildren, selectWorkspaceRoots } from "@/store/useStore";
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

describe("isWorkspaceRoot", () => {
  it("treats null, undefined, and empty parent_id as root", () => {
    expect(isWorkspaceRoot({ parent_id: null })).toBe(true);
    expect(isWorkspaceRoot({ parent_id: undefined as unknown as null })).toBe(true);
    expect(isWorkspaceRoot({ parent_id: "" })).toBe(true);
  });

  it("treats folder parents as nested", () => {
    expect(isWorkspaceRoot({ parent_id: "folder-1" })).toBe(false);
  });
});

describe("workspace selectors", () => {
  const pages = [
    page({ id: "folder", kind: "directory" }),
    page({ id: "nested", parent_id: "folder" }),
    page({ id: "root-page" }),
  ];

  it("lists only root workspace items", () => {
    expect(selectWorkspaceRoots(pages).map((entry) => entry.id)).toEqual(["folder", "root-page"]);
  });

  it("lists only direct children for a folder", () => {
    expect(selectWorkspaceChildren(pages, "folder").map((entry) => entry.id)).toEqual(["nested"]);
  });
});
