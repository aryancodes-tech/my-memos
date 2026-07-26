import type { Editor } from "@tiptap/react";
import { saveUploadedAudioAttachment } from "@/lib/attachments/attachmentManager";
import { AttachmentFsUnsupportedError } from "@/lib/attachments/errors";
import { appendAfterSelectedNode } from "@/lib/attachments/insertSelection";
import { isAttachmentStorageSupported } from "@/lib/attachments/fileSystemManager";
import { ATTACHMENT_FS_UNSUPPORTED_MESSAGE } from "@/lib/constants";
import type { SlashRange } from "@/editor/slashBlock";
import { focusVoiceInsertPosition } from "@/lib/attachments/insertVoiceRecording";

/**
 * Opens a file picker and inserts a voice note block from an existing audio file.
 * The file is copied into the hidden attachment store for future cloud sync.
 */
export function insertAudioFromPicker(
  editor: Editor,
  range?: SlashRange,
  callbacks?: { onError?: (message: string) => void },
): void {
  if (!isAttachmentStorageSupported()) {
    callbacks?.onError?.(ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac";

  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        focusVoiceInsertPosition(editor);
        const ref = await saveUploadedAudioAttachment(file);
        const noteAttrs = {
          attachmentPath: ref.path,
          duration: ref.duration ?? 0,
          size: ref.size ?? file.size,
          title: ref.title,
          createdAt: ref.createdAt,
          status: "saved" as const,
        };
        const chain = editor.chain().focus();
        if (range) {
          chain.deleteRange(range).insertVoiceNote(noteAttrs).run();
        } else {
          appendAfterSelectedNode(chain).insertVoiceNote(noteAttrs).run();
        }
      } catch (err) {
        if (err instanceof AttachmentFsUnsupportedError) {
          callbacks?.onError?.(err.message);
          return;
        }
        callbacks?.onError?.("Could not attach the audio file. Please try again.");
        console.warn("[MyMemos] insertAudioFromPicker failed:", err);
      }
    })();
  };

  input.click();
}
