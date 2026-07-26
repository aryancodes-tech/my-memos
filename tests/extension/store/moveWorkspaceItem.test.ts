import { beforeEach, describe, expect, it, vi } from "vitest";
import * as db from "@/storage/db";
import { useStore } from "@/store/useStore";
import type { Page } from "@/storage/types";

vi.mock("@/storage/db", () => ({
  putPage: vi.fn(async () => undefined),
  setSetting: vi.fn(async () => undefined),
}));

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

describe("moveWorkspaceItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      ready: true,
      pages: [
        page({ id: "folder", kind: "directory" }),
        page({ id: "nested", parent_id: "folder" }),
      ],
      collapsedDirs: {},
    });
  });

  it("moves a nested page to the workspace root", async () => {
    await useStore.getState().moveWorkspaceItem("nested", null);

    const moved = useStore.getState().pages.find((entry) => entry.id === "nested");
    expect(moved?.parent_id).toBeNull();
    expect(db.putPage).toHaveBeenCalledOnce();
  });

  it("outdents a nested folder to the workspace root", async () => {
    useStore.setState({
      pages: [
        page({ id: "root-folder", kind: "directory" }),
        page({ id: "nested-folder", kind: "directory", parent_id: "root-folder" }),
      ],
    });

    await useStore.getState().moveWorkspaceItem("nested-folder", null);

    const moved = useStore.getState().pages.find((entry) => entry.id === "nested-folder");
    expect(moved?.parent_id).toBeNull();
  });
});
