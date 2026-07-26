import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

import {
  collectImageFilesFromDataTransfer,
  extractImageSrcsFromHtml,
  resolveImagesFromDataTransfer,
} from "@/lib/attachments/imageClipboard";
import { insertImagesFromFiles } from "@/editor/commands/insertImage";
import { isAttachmentStorageSupported } from "@/lib/attachments/fileSystemManager";
import { len } from "@/lib/text";

const IMAGE_PASTE_DROP_KEY = new PluginKey("imagePasteDrop");

/** True when HTML paste is mostly images (little surrounding text). */
function isImageCentricHtml(html: string): boolean {
  const srcs = extractImageSrcsFromHtml(html);
  if (srcs.length === 0) return false;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = (doc.body?.textContent ?? "").replace(/\s+/g, " ").trim();
    return len(text) < 80;
  } catch {
    return srcs.length > 0;
  }
}

/** True when a drag event carries image files. */
function dragHasImageFiles(event: DragEvent): boolean {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  if (Array.from(types).includes("Files")) {
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      return collectImageFilesFromDataTransfer(event.dataTransfer).length > 0;
    }
    // During dragover, files may be empty but types still list Files.
    return true;
  }
  return false;
}

/** Resolves a ProseMirror insert position from drop coordinates. */
function dropPosFromEvent(view: EditorView, event: DragEvent): number | undefined {
  const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
  return coords?.pos;
}

/**
 * Handles image file paste/drop and webpage HTML `<img>` paste into OPFS-backed blocks.
 * Priority above MarkdownPaste so binary/HTML image pastes win.
 */
export const ImagePasteDrop = Extension.create({
  name: "imagePasteDrop",
  priority: 250,

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: IMAGE_PASTE_DROP_KEY,
        props: {
          handleDOMEvents: {
            dragover(view, event) {
              if (!dragHasImageFiles(event)) return false;
              event.preventDefault();
              if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
              view.dom.classList.add("is-file-drag");
              return false;
            },
            dragleave(view, event) {
              const related = event.relatedTarget as Node | null;
              if (related && view.dom.contains(related)) return false;
              view.dom.classList.remove("is-file-drag");
              return false;
            },
            drop(view) {
              view.dom.classList.remove("is-file-drag");
              return false;
            },
            dragend(view) {
              view.dom.classList.remove("is-file-drag");
              return false;
            },
          },

          handlePaste(_view, event) {
            if (!isAttachmentStorageSupported()) return false;

            const clipboard = event.clipboardData;
            if (!clipboard) return false;

            const hasFiles = collectImageFilesFromDataTransfer(clipboard).length > 0;
            const html = clipboard.getData("text/html");
            const imageCentricHtml = len(html) > 0 && isImageCentricHtml(html);

            // File/screenshot paste always wins. Image-centric HTML (copy image /
            // few surrounding words) is imported to OPFS. Mixed rich webpage paste
            // falls through so TipTap keeps the text.
            if (!hasFiles && !imageCentricHtml) return false;

            event.preventDefault();
            void (async () => {
              const files = await resolveImagesFromDataTransfer(clipboard);
              if (files.length === 0) return;
              await insertImagesFromFiles(editor, files);
            })();
            return true;
          },

          handleDrop(view, event) {
            if (!isAttachmentStorageSupported()) return false;

            const data = event.dataTransfer;
            if (!data) return false;

            const files = collectImageFilesFromDataTransfer(data);
            if (files.length === 0) return false;

            event.preventDefault();
            view.dom.classList.remove("is-file-drag");

            const pos = dropPosFromEvent(view, event);
            void insertImagesFromFiles(editor, files, undefined, { pos });
            return true;
          },
        },
      }),
    ];
  },
});
