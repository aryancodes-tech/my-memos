import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/store/useStore";

vi.mock("@/storage/db", () => ({
  putPage: vi.fn(async () => undefined),
  setSetting: vi.fn(async () => undefined),
  getSetting: vi.fn(async () => undefined),
  listPages: vi.fn(async () => []),
  deletePage: vi.fn(async () => undefined),
}));

describe("dialogs slice", () => {
  beforeEach(() => {
    useStore.setState({
      pendingDelete: null,
      pendingLink: null,
      pendingAttachmentDelete: null,
      pages: [],
    });
  });

  it("request/cancel delete and link dialogs", () => {
    useStore.getState().requestDelete("page-1", 3);
    expect(useStore.getState().pendingDelete).toEqual({ pageId: "page-1", childCount: 3 });
    useStore.getState().cancelDelete();
    expect(useStore.getState().pendingDelete).toBeNull();

    useStore.getState().requestLink("https://example.com");
    expect(useStore.getState().pendingLink).toEqual({ initialHref: "https://example.com" });
    useStore.getState().cancelLink();
    expect(useStore.getState().pendingLink).toBeNull();
  });

  it("request/cancel attachment delete payloads", () => {
    const payload = { attachmentPath: "images/a.png" };
    useStore.getState().requestAttachmentDelete(payload);
    expect(useStore.getState().pendingAttachmentDelete).toEqual(payload);
    useStore.getState().cancelAttachmentDelete();
    expect(useStore.getState().pendingAttachmentDelete).toBeNull();
  });

  it("confirmDelete clears pending state and deletes the page", async () => {
    const deletePage = vi.fn(async () => undefined);
    useStore.setState({
      pendingDelete: { pageId: "gone", childCount: 0 },
      deletePage,
    });

    await useStore.getState().confirmDelete();
    expect(useStore.getState().pendingDelete).toBeNull();
    expect(deletePage).toHaveBeenCalledWith("gone");
  });

  it("confirmDelete no-ops without a pending delete", async () => {
    const deletePage = vi.fn(async () => undefined);
    useStore.setState({ pendingDelete: null, deletePage });
    await useStore.getState().confirmDelete();
    expect(deletePage).not.toHaveBeenCalled();
  });
});
