import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import AttachmentImageNodeView from "@/editor/AttachmentImageNodeView";
import { IMAGE_ALIGN_DEFAULT } from "@/lib/constants";
import { len } from "@/lib/text";

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
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) =>
          len(String(attributes.caption ?? "")) > 0
            ? { "data-caption": String(attributes.caption) }
            : {},
      },
      align: {
        default: IMAGE_ALIGN_DEFAULT,
        parseHTML: (element) => element.getAttribute("data-align") ?? IMAGE_ALIGN_DEFAULT,
        renderHTML: (attributes) =>
          attributes.align && attributes.align !== IMAGE_ALIGN_DEFAULT
            ? { "data-align": String(attributes.align) }
            : {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentImageNodeView);
  },
});
