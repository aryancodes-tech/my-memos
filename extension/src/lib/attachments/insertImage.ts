import type { Editor } from "@tiptap/react";
import { saveImageAttachment } from "@/lib/attachments/attachmentManager";
import { AttachmentFsUnsupportedError } from "@/lib/attachments/errors";
import { appendAfterSelectedNode } from "@/lib/attachments/insertSelection";
import { isAttachmentStorageSupported } from "@/lib/attachments/fileSystemManager";
import { ATTACHMENT_FS_UNSUPPORTED_MESSAGE } from "@/lib/constants";

/**
 * Opens a file picker and inserts an image block backed by hidden OPFS attachment storage.
 */
export async function insertImageFromPicker(
  editor: Editor,
  callbacks?: { onError?: (message: string) => void },
): Promise<void> {
  if (!isAttachmentStorageSupported()) {
    callbacks?.onError?.(ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        const path = await saveImageAttachment(file);
        appendAfterSelectedNode(editor.chain().focus())
          .insertContent({
            type: "image",
            attrs: {
              attachmentPath: path,
              attachmentSize: file.size,
              alt: file.name,
            },
          })
          .run();
      } catch (err) {
        if (err instanceof AttachmentFsUnsupportedError) {
          callbacks?.onError?.(err.message);
          return;
        }
        callbacks?.onError?.("Could not save the image. Please try again.");
        console.warn("[MyMemos] insertImageFromPicker failed:", err);
      }
    })();
  };

  input.click();
}
