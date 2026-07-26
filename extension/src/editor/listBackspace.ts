import { Extension, type Editor } from "@tiptap/core";

/** List item node names that should lift on Backspace at the item start. */
const LIST_ITEM_NAMES = new Set(["listItem", "taskItem"]);

/**
 * Lifts the current list/task item into a normal block when the caret is at
 * the start of that item's first child.
 *
 * Default ProseMirror/TipTap Backspace merges into the previous list item
 * (`joinBackward`). Product expectation matches Notion: first Backspace ends
 * the list marker for that line.
 */
export function tryLiftListItemAtSelectionStart(editor: Editor): boolean {
  const { selection } = editor.state;
  if (!selection.empty) return false;

  const { $from } = selection;
  if ($from.parentOffset !== 0) return false;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (!LIST_ITEM_NAMES.has(node.type.name)) continue;

    // Only when the caret is in the first child of the list item.
    if ($from.index(depth) !== 0) return false;

    return editor.chain().liftListItem(node.type.name).run();
  }

  return false;
}

/**
 * Backspace at the start of a bullet, ordered, or task item exits the list
 * (lift) instead of joining with the previous item.
 */
export const ListBackspace = Extension.create({
  name: "listBackspace",
  /** Above StarterKit list keymaps so lift wins over joinBackward. */
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => tryLiftListItemAtSelectionStart(editor),
      "Mod-Backspace": ({ editor }) => tryLiftListItemAtSelectionStart(editor),
    };
  },
});
