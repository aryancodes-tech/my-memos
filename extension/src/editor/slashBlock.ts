import type { Editor } from "@tiptap/react";
import { smoothRevealSelection } from "@/editor/revealSelection";

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
  listType: "bulletList" | "orderedList",
): void {
  const chain = editor.chain().focus().deleteRange(range).clearNodes();
  let didRun = false;
  if (listType === "bulletList") {
    didRun = chain.toggleBulletList().run();
    if (didRun) smoothRevealSelection(editor);
    return;
  }
  didRun = chain.toggleOrderedList().run();
  if (didRun) smoothRevealSelection(editor);
}

/** Converts the current block into a task list item. */
export function applyTaskListBlock(editor: Editor, range: SlashRange): void {
  const didRun = editor.chain().focus().deleteRange(range).clearNodes().toggleTaskList().run();
  if (didRun) smoothRevealSelection(editor);
}

/** Inserts a syntax-highlighted code block with a default language. */
export function applyCodeBlock(editor: Editor, range: SlashRange, language: string): void {
  const didRun = editor
    .chain()
    .focus()
    .deleteRange(range)
    .clearNodes()
    .setCodeBlock({ language })
    .run();
  if (didRun) smoothRevealSelection(editor);
}
