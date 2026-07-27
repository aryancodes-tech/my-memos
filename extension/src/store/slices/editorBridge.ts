import type { StateCreator } from "zustand";
import { deleteAttachment } from "@/lib/attachments/attachmentManager";
import { len } from "@/lib/text";
import type { EditorBridgeSlice, StoreState } from "@/store/types";

/** Removes the first editor node whose `attachmentPath` matches. */
function deleteEditorNodeByAttachmentPath(
  editor: NonNullable<StoreState["pageEditor"]>,
  attachmentPath: string,
): void {
  let foundPos: number | null = null;
  let foundSize = 0;
  editor.state.doc.descendants((node, pos) => {
    if (node.attrs?.attachmentPath === attachmentPath) {
      foundPos = pos;
      foundSize = node.nodeSize;
      return false;
    }
    return true;
  });
  if (foundPos === null) return;
  editor
    .chain()
    .focus()
    .deleteRange({ from: foundPos, to: foundPos + foundSize })
    .run();
}

export const createEditorBridgeSlice: StateCreator<StoreState, [], [], EditorBridgeSlice> = (
  set,
  get,
) => ({
  pageEditor: null,

  setPageEditor(editor) {
    set({ pageEditor: editor });
  },

  applyLink(href) {
    const { pageEditor } = get();
    set({ pendingLink: null });
    if (!pageEditor) return;

    const trimmed = href.trim();
    if (len(trimmed) === 0) return;

    pageEditor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  },

  removeLink() {
    const { pageEditor } = get();
    set({ pendingLink: null });
    if (!pageEditor) return;

    pageEditor.chain().focus().extendMarkRange("link").unsetLink().run();
  },

  async confirmAttachmentDelete() {
    const pending = get().pendingAttachmentDelete;
    const editor = get().pageEditor;
    if (!pending) return;
    set({ pendingAttachmentDelete: null });

    const path = pending.attachmentPath;
    if (len(path) > 0) {
      try {
        await deleteAttachment(path);
      } catch (err) {
        console.warn("[MyMemos] Failed to delete attachment file:", path, err);
      }
    }

    if (editor && len(path) > 0) {
      deleteEditorNodeByAttachmentPath(editor, path);
    }
  },
});
