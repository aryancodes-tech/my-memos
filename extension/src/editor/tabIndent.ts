import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";
import { len } from "@/lib/text";

/**
 * Inserts a tab character at the start of every text block touched by the selection.
 * Returns null when the selection is empty.
 */
export function indentSelectedText(
  state: EditorState,
  tabInsert: string
): Transaction | null {
  const { from, to, empty } = state.selection;
  if (empty || from === to) return null;

  const positions = collectIndentPositions(state.doc, from, to);
  if (positions.length === 0) return null;

  const tabLength = len(tabInsert);
  let tr = state.tr;

  for (const pos of positions) {
    tr = tr.insertText(tabInsert, pos, pos);
  }

  const shiftFor = (anchor: number) =>
    positions.filter((pos) => pos <= anchor).length * tabLength;

  tr.setSelection(
    TextSelection.create(tr.doc, from + shiftFor(from), to + shiftFor(to))
  );

  return tr;
}

/** Collects document positions to indent, from last to first. */
function collectIndentPositions(
  doc: ProseMirrorNode,
  from: number,
  to: number
): number[] {
  const positions: number[] = [];
  let isFirstBlock = true;

  doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isTextblock) return;

    const contentStart = pos + 1;
    const contentEnd = pos + node.nodeSize - 1;
    if (contentEnd < from || contentStart > to) return;

    if (isFirstBlock) {
      positions.push(Math.max(from, contentStart));
      isFirstBlock = false;
      return;
    }

    positions.push(contentStart);
  });

  return [...new Set(positions)].sort((a, b) => b - a);
}

