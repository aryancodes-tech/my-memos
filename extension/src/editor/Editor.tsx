import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { BlockDoc } from "@/storage/types";
import { EDITOR_SAVE_DEBOUNCE_MS, EDITOR_TAB_INSERT } from "@/lib/constants";
import { sanitizeBlockDocForPersistence } from "@/lib/attachments/sanitizeBlockDoc";
import { useStore } from "@/store/useStore";
import { createEditorExtensions } from "@/editor/editorExtensions";
import { indentSelectedText } from "@/editor/tabIndent";
import SlashMenu from "./SlashMenu";

interface Props {
  docKey: string; // page id, used to reset editor when switching pages
  initial: BlockDoc;
  onChange: (doc: BlockDoc) => void;
}

/**
 * Block-based editor. We persist `editor.getJSON()` (Tiptap/ProseMirror doc).
 * We NEVER persist `editor.getHTML()` - rendered HTML is generated on read.
 */
export default function Editor({ docKey, initial, onChange }: Props) {
  const debounceRef = useRef<number | null>(null);
  /**
   * Persist callback for this editor's page. Updated in an effect (not during
   * render) so page-switch cleanups still see the previous page's callback.
   */
  const persistForPageRef = useRef(onChange);
  const setPageEditor = useStore((state) => state.setPageEditor);

  const editor = useEditor(
    {
      extensions: createEditorExtensions(),
      content: initial,
      editorProps: {
        handleKeyDown(view, event) {
          if (
            event.key !== "Tab" ||
            event.shiftKey ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
          ) {
            return false;
          }

          const { state, dispatch } = view;
          const { from, to, empty } = state.selection;
          if (empty || from === to) {
            return false;
          }

          event.preventDefault();

          const tr = indentSelectedText(state, EDITOR_TAB_INSERT);
          if (!tr) return false;

          dispatch(tr);
          return true;
        },
      },
      onUpdate({ editor: ed }) {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        // Capture at schedule time so a late timer cannot write through a newer page's onChange.
        const persistForPage = persistForPageRef.current;
        debounceRef.current = window.setTimeout(() => {
          persistForPage(sanitizeBlockDocForPersistence(ed.getJSON() as BlockDoc));
        }, EDITOR_SAVE_DEBOUNCE_MS);
      },
    },
    [docKey],
  );

  useEffect(() => {
    if (!editor) {
      setPageEditor(null);
      return;
    }

    setPageEditor(editor);
    return () => setPageEditor(null);
  }, [editor, setPageEditor]);

  /**
   * Flush pending edits when leaving a page (docKey/editor change) or unmounting.
   * Capture `editor` + `onChange` from this commit so cleanup never writes the
   * previous page's JSON through the next page's update callback.
   *
   * Important: do not assign `persistForPageRef` during render — that runs before
   * prior effect cleanups and would point the leaving page at the new `onChange`.
   */
  useEffect(() => {
    if (!editor) return;

    persistForPageRef.current = onChange;
    const editorForPage = editor;
    const persistForPage = onChange;

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (!editorForPage.isDestroyed) {
        persistForPage(sanitizeBlockDocForPersistence(editorForPage.getJSON() as BlockDoc));
      }
    };
    // `onChange` is read from the commit that owns this editor/docKey; omit from
    // deps so parent re-renders do not flush on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [editor, docKey]);

  return (
    <div className="ko-editor-wrap">
      <div className="relative">
        <EditorContent editor={editor} className="ko-editor max-w-none" />
        {editor && <SlashMenu editor={editor} />}
      </div>
    </div>
  );
}
