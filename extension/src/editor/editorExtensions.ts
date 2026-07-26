import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import { MarkdownBulletList, MarkdownTaskItem } from "@/editor/taskListMarkdown";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { Markdown } from "tiptap-markdown";
import { AttachmentImage } from "@/editor/attachmentImage";
import { VoiceNote } from "@/editor/voiceNote";
import { BackgroundColor } from "@/editor/backgroundColor";
import { HighlightWithMarkdown } from "@/editor/highlightMarkdown";
import { ImagePasteDrop } from "@/editor/imagePasteDrop";
import { ListBackspace } from "@/editor/listBackspace";
import { MarkdownPaste } from "@/editor/markdownPaste";
import { codeLowlight } from "@/editor/codeLowlight";

/** Shared Tiptap extensions for the page editor. */
export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: false,
      bulletList: false,
    }),
    ListBackspace,
    MarkdownBulletList,
    CodeBlockLowlight.configure({
      lowlight: codeLowlight,
      defaultLanguage: "typescript",
    }),
    Placeholder.configure({
      placeholder: "Type '/' for commands, or just start writing…",
    }),
    TaskList,
    MarkdownTaskItem.configure({ nested: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Link.configure({ openOnClick: true, autolink: true }),
    AttachmentImage.configure({ inline: false, allowBase64: true }),
    VoiceNote,
    Underline,
    TextStyle,
    Color,
    BackgroundColor,
    HighlightWithMarkdown.configure({ multicolor: true }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Markdown.configure({
      html: true,
      linkify: true,
      breaks: true,
      transformPastedText: false,
      transformCopiedText: false,
    }),
    ImagePasteDrop,
    MarkdownPaste,
  ];
}
