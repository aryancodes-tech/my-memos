import type { Editor } from "@tiptap/react";
import type { SlashRange } from "@/editor/slashBlock";
import { appendAfterSelectedNode } from "@/editor/commands/insertSelection";
import { isAttachmentStorageSupported } from "@/lib/attachments/fileSystemManager";
import { ATTACHMENT_FS_UNSUPPORTED_MESSAGE } from "@/lib/constants";

/** Returns true when the document already contains an active inline recording block. */
export function hasActiveVoiceRecording(editor: Editor): boolean {
  let active = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "voiceNote" && node.attrs.status === "recording") {
      active = true;
    }
  });
  return active;
}

/**
 * Moves focus to a sensible insert position when the editor is not focused.
 * Falls back to the end of the document.
 */
export function focusVoiceInsertPosition(editor: Editor): void {
  if (!editor.isFocused) {
    editor.commands.focus("end");
  }
}

/**
 * Inserts an inline voice-note recording block at the cursor and starts recording in place.
 * @param editor - Active page editor.
 * @param range - Optional slash range to delete before inserting.
 * @param callbacks - Optional error callback when storage is unavailable.
 */
export function insertInlineVoiceRecording(
  editor: Editor,
  range?: SlashRange,
  callbacks?: { onError?: (message: string) => void },
): void {
  if (!isAttachmentStorageSupported()) {
    callbacks?.onError?.(ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
    return;
  }

  if (hasActiveVoiceRecording(editor)) return;

  focusVoiceInsertPosition(editor);

  const chain = editor.chain().focus();
  if (range) {
    chain.deleteRange(range).insertVoiceNoteRecording().run();
    return;
  }
  appendAfterSelectedNode(chain).insertVoiceNoteRecording().run();
}
