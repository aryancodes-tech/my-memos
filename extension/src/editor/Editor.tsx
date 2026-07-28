import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { BlockDoc } from "@/storage/types";
import { EDITOR_SAVE_DEBOUNCE_MS, EDITOR_TAB_INSERT, PRODUCT_TOUR_TARGETS } from "@/lib/constants";
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
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const onChangeRef = useRef(onChange);
  const setPageEditor = useStore((state) => state.setPageEditor);

  onChangeRef.current = onChange;

  const persistDoc = (doc: BlockDoc) => {
    onChangeRef.current(sanitizeBlockDocForPersistence(doc));
  };

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
        debounceRef.current = window.setTimeout(() => {
          persistDoc(ed.getJSON() as BlockDoc);
        }, EDITOR_SAVE_DEBOUNCE_MS);
      },
    },
    [docKey],
  );

  editorRef.current = editor;

  useEffect(() => {
    if (!editor) {
      setPageEditor(null);
      return;
    }

    setPageEditor(editor);
    return () => setPageEditor(null);
  }, [editor, setPageEditor]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const ed = editorRef.current;
      if (ed && !ed.isDestroyed) {
        persistDoc(ed.getJSON() as BlockDoc);
      }
    };
  }, [docKey]);

  return (
    <div className="ko-editor-wrap" data-tour-target={PRODUCT_TOUR_TARGETS.slashMenu}>
      <div className="relative">
        <EditorContent editor={editor} className="ko-editor max-w-none" />
        {editor && <SlashMenu editor={editor} />}
      </div>
    </div>
  );
}
