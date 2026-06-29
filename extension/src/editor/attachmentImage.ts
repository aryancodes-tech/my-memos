import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import AttachmentImageNodeView from "@/editor/AttachmentImageNodeView";

/**
 * Image block that supports lazy-loaded filesystem attachments via `attachmentPath`,
 * while preserving legacy inline base64 `src` values for existing notes.
 */
export const AttachmentImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      attachmentPath: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-attachment-path"),
        renderHTML: (attributes) =>
          attributes.attachmentPath
            ? { "data-attachment-path": attributes.attachmentPath as string }
            : {},
      },
      attachmentSize: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-attachment-size");
          return raw ? Number(raw) : null;
        },
        renderHTML: (attributes) =>
          attributes.attachmentSize
            ? { "data-attachment-size": String(attributes.attachmentSize) }
            : {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentImageNodeView);
  },
});
