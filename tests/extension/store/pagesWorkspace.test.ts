import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FOLDER_TITLE,
  DEFAULT_PAGE_TITLE,
  DEFAULT_THEME,
  DEMO_SEED_PAGE_TITLE,
  SETTINGS_KEYS,
  WORKSPACE_SECTION,
} from "@/lib/constants";
import * as db from "@/storage/db";
import { useStore } from "@/store/useStore";
import type { Page } from "@/storage/types";

vi.mock("@/storage/db", () => ({
  listPages: vi.fn(async () => []),
  putPage: vi.fn(async () => undefined),
  deletePage: vi.fn(async () => undefined),
  getSetting: vi.fn(async () => undefined),
  setSetting: vi.fn(async () => undefined),
}));

vi.mock("@/lib/attachments/attachmentManager", () => ({
  deleteAttachment: vi.fn(async () => undefined),
}));

import { deleteAttachment } from "@/lib/attachments/attachmentManager";

function page(overrides: Partial<Page> & Pick<Page, "id">): Page {
  return {
    title: "Test",
    parent_id: null,
    section: WORKSPACE_SECTION,
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

describe("pages workspace actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      ready: true,
      pages: [],
      view: { kind: "dashboard" },
      sidebarCollapsed: false,
      searchOpen: false,
      collapsedDirs: {},
      theme: DEFAULT_THEME,
      customThemes: [],
      pageEditor: null,
      pendingLink: null,
      pendingDelete: null,
      pendingAttachmentDelete: null,
    });
  });

  it("creates a page with defaults and opens it", async () => {
    const created = await useStore.getState().createPage();
    expect(created.title).toBe(DEFAULT_PAGE_TITLE);
    expect(created.kind).toBe("page");
    expect(created.section).toBe(WORKSPACE_SECTION);
    expect(created.doc.content?.[0]?.type).toBe("paragraph");
    expect(useStore.getState().view).toEqual({ kind: "page", id: created.id });
    expect(db.putPage).toHaveBeenCalledWith(created);
  });

  it("creates a nested directory and expands ancestors", async () => {
    const created = await useStore.getState().createDirectory("parent");
    expect(created.title).toBe(DEFAULT_FOLDER_TITLE);
    expect(created.kind).toBe("directory");
    expect(created.parent_id).toBe("parent");
    expect(useStore.getState().collapsedDirs.parent).toBe(false);
    expect(useStore.getState().collapsedDirs[created.id]).toBe(false);
  });

  it("updatePage no-ops for missing ids and normalizes empty parent_id", async () => {
    await useStore.getState().updatePage("missing", { title: "Nope" });
    expect(db.putPage).not.toHaveBeenCalled();

    useStore.setState({ pages: [page({ id: "p1", parent_id: "folder" })] });
    await useStore.getState().updatePage("p1", { parent_id: "", favorite: true });
    const updated = useStore.getState().pages.find((entry) => entry.id === "p1");
    expect(updated?.parent_id).toBeNull();
    expect(updated?.favorite).toBe(true);
    expect(db.putPage).toHaveBeenCalledOnce();
  });

  it("setView / toggleSidebar / setSearchOpen / toggleDirectory update state", async () => {
    useStore.getState().setView({ kind: "page", id: "p1" });
    expect(useStore.getState().view).toEqual({ kind: "page", id: "p1" });
    expect(db.setSetting).toHaveBeenCalled();

    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarCollapsed).toBe(true);
    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarCollapsed).toBe(false);

    useStore.getState().setSearchOpen(true);
    expect(useStore.getState().searchOpen).toBe(true);

    useStore.getState().toggleDirectory("folder");
    expect(useStore.getState().collapsedDirs.folder).toBe(true);
    useStore.getState().toggleDirectory("folder");
    expect(useStore.getState().collapsedDirs.folder).toBe(false);
  });

  it("deletePage removes descendants and orphans attachments", async () => {
    useStore.setState({
      pages: [
        page({
          id: "folder",
          kind: "directory",
          doc: {
            type: "doc",
            content: [{ type: "image", attrs: { attachmentPath: "images/folder-only.png" } }],
          },
        }),
        page({
          id: "child",
          parent_id: "folder",
          doc: {
            type: "doc",
            content: [{ type: "voiceNote", attrs: { attachmentPath: "audio/child.webm" } }],
          },
        }),
        page({
          id: "keeper",
          doc: {
            type: "doc",
            content: [{ type: "image", attrs: { attachmentPath: "images/shared.png" } }],
          },
        }),
        page({
          id: "also-shared",
          parent_id: "folder",
          doc: {
            type: "doc",
            content: [{ type: "image", attrs: { attachmentPath: "images/shared.png" } }],
          },
        }),
      ],
      view: { kind: "page", id: "child" },
      collapsedDirs: { folder: true, child: true },
    });

    await useStore.getState().deletePage("folder");

    const ids = useStore.getState().pages.map((entry) => entry.id);
    expect(ids).toEqual(["keeper"]);
    expect(useStore.getState().view).toEqual({ kind: "dashboard" });
    expect(useStore.getState().collapsedDirs.folder).toBeUndefined();
    expect(db.deletePage).toHaveBeenCalledTimes(3);
    expect(deleteAttachment).toHaveBeenCalledWith("images/folder-only.png");
    expect(deleteAttachment).toHaveBeenCalledWith("audio/child.webm");
    expect(deleteAttachment).not.toHaveBeenCalledWith("images/shared.png");
  });

  it("init falls back to dashboard for missing page views and migrates legacy sections", async () => {
    vi.mocked(db.listPages).mockResolvedValueOnce([
      page({ id: "legacy", section: "Favorites", kind: "page" as Page["kind"] }),
    ]);
    vi.mocked(db.getSetting).mockImplementation(async (key: string) => {
      if (key === SETTINGS_KEYS.lastView) return { kind: "page", id: "missing" };
      if (key === SETTINGS_KEYS.theme) return "light";
      return undefined;
    });

    await useStore.getState().init();

    expect(useStore.getState().ready).toBe(true);
    expect(useStore.getState().view).toEqual({ kind: "dashboard" });
    expect(useStore.getState().pages[0]?.section).toBe(WORKSPACE_SECTION);
    expect(db.putPage).toHaveBeenCalled();
  });

  it("init seeds a fresh empty workspace on first install", async () => {
    vi.mocked(db.listPages).mockResolvedValueOnce([]);
    vi.mocked(db.getSetting).mockImplementation(async (key: string) => {
      if (key === SETTINGS_KEYS.lastView) return undefined;
      if (key === SETTINGS_KEYS.theme) return "light";
      return undefined;
    });

    await useStore.getState().init();

    const { ready, pages, view } = useStore.getState();
    expect(ready).toBe(true);
    expect(pages).toHaveLength(6);
    expect(pages.map((p) => p.title).sort()).toEqual(
      ["Launch plan", "Networking", "Personal", "Reading notes", DEMO_SEED_PAGE_TITLE, "Work"].sort(),
    );
    expect(pages.filter((p) => p.kind === "directory")).toHaveLength(2);
    expect(view).toEqual({ kind: "page", id: pages.find((p) => p.title === "Launch plan")?.id });
    expect(db.putPage).toHaveBeenCalled();
    expect(db.setSetting).toHaveBeenCalledWith(SETTINGS_KEYS.demoWorkspaceSeeded, true);
  });

  it("moveWorkspaceItem no-ops for invalid targets and same parent", async () => {
    useStore.setState({
      pages: [
        page({ id: "folder", kind: "directory" }),
        page({ id: "nested", parent_id: "folder" }),
      ],
    });

    await useStore.getState().moveWorkspaceItem("nested", "nested");
    await useStore.getState().moveWorkspaceItem("nested", "folder");
    expect(db.putPage).not.toHaveBeenCalled();
  });
});
