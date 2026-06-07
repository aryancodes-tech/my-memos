import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

import { MARKDOWN_DETECTION_PATTERNS } from "@/lib/constants";

/** ProseMirror view input state (not exposed on public EditorView types). */
type EditorViewWithInput = EditorView & {
  input?: {
    shiftKey?: boolean;
  };
};

/** Returns true when clipboard text likely contains markdown syntax. */
export function looksLikeMarkdown(text: string): boolean {
  if (len(text) === 0) {
    return false;
  }

  return MARKDOWN_DETECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Returns true when pasted HTML is only a trivial plain-text wrapper. */
function isTrivialPlainHtml(html: string, plainText: string): boolean {
  if (len(html) === 0) {
    return true;
  }

  const stripped = html
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedPlain = plainText.replace(/\s+/g, " ").trim();
  return len(stripped) === 0 || stripped === normalizedPlain;
}

/**
 * Parses pasted plain-text markdown as block content.
 * Shift+paste and rich HTML pastes are left to the default clipboard behavior.
 */
export const MarkdownPaste = Extension.create({
  name: "markdownPaste",
  priority: 200,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownPaste"),
        props: {
          handlePaste: (view, event) => {
            if ((view as EditorViewWithInput).input?.shiftKey) {
              return false;
            }

            const clipboard = event.clipboardData;
            if (!clipboard) {
              return false;
            }

            const text = clipboard.getData("text/plain");
            if (len(text) === 0 || !looksLikeMarkdown(text)) {
              return false;
            }

            const html = clipboard.getData("text/html");
            if (len(html) > 0 && !isTrivialPlainHtml(html, text)) {
              return false;
            }

            const markdownStorage = this.editor.storage.markdown;
            if (!markdownStorage?.parser) {
              return false;
            }

            const parsed = markdownStorage.parser.parse(text) as string;
            return this.editor.chain().focus().insertContent(parsed).run();
          },
        },
      }),
    ];
  },
});

/** Empty-string check using length, per project convention. */
function len(value: string): number {
  return value.length;
}
