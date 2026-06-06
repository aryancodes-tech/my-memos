import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { BackgroundColor } from "@/editor/backgroundColor";
import { codeLowlight } from "@/editor/codeLowlight";

/** Shared Tiptap extensions for the page editor. */
export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({
      lowlight: codeLowlight,
      defaultLanguage: "typescript",
    }),
    Placeholder.configure({
      placeholder: "Type '/' for commands, or just start writing…",
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: true, autolink: true }),
    Underline,
    TextStyle,
    Color,
    BackgroundColor,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
  ];
}
