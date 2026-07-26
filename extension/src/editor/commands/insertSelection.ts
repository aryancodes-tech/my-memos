import type { ChainedCommands } from "@tiptap/react";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";

/**
 * Ensures the next inserted block is appended, never replacing a selected atom.
 *
 * When an attachment block (image / voice note) is selected it becomes a
 * ProseMirror `NodeSelection`; a plain `insertContent` would overwrite it. This
 * collapses such a selection to a cursor immediately after the node so inserts
 * land next to the existing attachment instead of clobbering it.
 *
 * @param chain - An active Tiptap command chain (already focused).
 */
export function appendAfterSelectedNode(chain: ChainedCommands): ChainedCommands {
  return chain.command(({ tr, dispatch }) => {
    const selection = tr.selection;
    if (selection instanceof NodeSelection) {
      if (dispatch) {
        tr.setSelection(TextSelection.create(tr.doc, selection.to));
      }
    }
    return true;
  });
}
