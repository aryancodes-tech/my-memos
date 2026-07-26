import type { StateCreator } from "zustand";
import type { DialogsSlice, StoreState } from "@/store/types";

export const createDialogsSlice: StateCreator<StoreState, [], [], DialogsSlice> = (set, get) => ({
  pendingDelete: null,
  pendingLink: null,
  pendingAttachmentDelete: null,

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

  requestAttachmentDelete(payload) {
    set({ pendingAttachmentDelete: payload });
  },

  cancelAttachmentDelete() {
    set({ pendingAttachmentDelete: null });
  },
});
