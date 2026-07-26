import type { Editor } from "@tiptap/react";
import { saveImageAttachment } from "@/lib/attachments/attachmentManager";
import { AttachmentFsUnsupportedError } from "@/lib/attachments/errors";
import { appendAfterSelectedNode } from "@/lib/attachments/insertSelection";
import { isAttachmentStorageSupported } from "@/lib/attachments/fileSystemManager";
import { ATTACHMENT_FS_UNSUPPORTED_MESSAGE } from "@/lib/constants";
import type { SlashRange } from "@/editor/slashBlock";
import { len } from "@/lib/text";

export interface InsertImageCallbacks {
  onError?: (message: string) => void;
}

/** True when a File/Blob looks like an image (MIME or common extension). */
export function isImageFile(file: File | Blob): boolean {
  if (len(file.type) > 0 && file.type.startsWith("image/")) return true;
  if (file instanceof File && len(file.name) > 0) {
    return /\.(png|jpe?g|gif|webp|svg|bmp|heic|heif|avif)$/i.test(file.name);
  }
  return false;
}

/** Filters a file list down to image files. */
export function filterImageFiles(files: ArrayLike<File>): File[] {
  return Array.from(files).filter(isImageFile);
}

/** Builds TipTap image node JSON for an OPFS-backed attachment. */
function imageNodeContent(path: string, size: number, alt: string) {
  return {
    type: "image" as const,
    attrs: {
      attachmentPath: path,
      attachmentSize: size,
      alt,
      src: null,
    },
  };
}

/**
 * Inserts multiple image files as OPFS-backed blocks.
 * @returns Number of images successfully inserted.
 */
export async function insertImagesFromFiles(
  editor: Editor,
  files: ArrayLike<File> | File[],
  range?: SlashRange,
  options?: { pos?: number; onError?: (message: string) => void },
): Promise<number> {
  const images = filterImageFiles(files);
  if (images.length === 0) return 0;

  if (!isAttachmentStorageSupported()) {
    options?.onError?.(ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
    return 0;
  }

  const nodes: ReturnType<typeof imageNodeContent>[] = [];
  for (const file of images) {
    try {
      const path = await saveImageAttachment(file);
      const alt = len(file.name) > 0 ? file.name : "Image";
      nodes.push(imageNodeContent(path, file.size, alt));
    } catch (err) {
      if (err instanceof AttachmentFsUnsupportedError) {
        options?.onError?.(err.message);
        break;
      }
      console.warn("[MyMemos] insertImagesFromFiles failed for", file.name, err);
      options?.onError?.("Could not save one or more images. Please try again.");
    }
  }

  if (nodes.length === 0) return 0;

  if (typeof options?.pos === "number") {
    editor.chain().focus().insertContentAt(options.pos, nodes).run();
  } else if (range) {
    editor.chain().focus().deleteRange(range).insertContent(nodes).run();
  } else {
    appendAfterSelectedNode(editor.chain().focus()).insertContent(nodes).run();
  }

  return nodes.length;
}

/**
 * Opens a file picker and inserts image block(s) backed by OPFS attachment storage.
 */
export function insertImageFromPicker(
  editor: Editor,
  range?: SlashRange,
  callbacks?: InsertImageCallbacks,
): void {
  if (!isAttachmentStorageSupported()) {
    callbacks?.onError?.(ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;

  input.onchange = () => {
    const files = input.files;
    if (!files || files.length === 0) return;
    void insertImagesFromFiles(editor, files, range, {
      onError: callbacks?.onError,
    });
  };

  input.click();
}
