import type { Editor } from "@tiptap/react";

/** Document range covering the `/` trigger and any filter text typed after it. */
export interface SlashRange {
  from: number;
  to: number;
}

/**
 * Converts the current block into a list after removing slash-menu trigger text.
 */
export function applyListBlock(
  editor: Editor,
  range: SlashRange,
  listType: "bulletList" | "orderedList"
): void {
  const chain = editor.chain().focus().deleteRange(range).clearNodes();
  if (listType === "bulletList") {
    chain.toggleBulletList().run();
    return;
  }
  chain.toggleOrderedList().run();
}

/** Converts the current block into a task list item. */
export function applyTaskListBlock(editor: Editor, range: SlashRange): void {
  editor.chain().focus().deleteRange(range).clearNodes().toggleTaskList().run();
}

/** Inserts a syntax-highlighted code block with a default language. */
export function applyCodeBlock(editor: Editor, range: SlashRange, language: string): void {
  editor.chain().focus().deleteRange(range).clearNodes().setCodeBlock({ language }).run();
}
