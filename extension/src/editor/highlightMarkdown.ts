import Highlight from "@tiptap/extension-highlight";
import markdownItMark from "markdown-it-mark";
import { contrastInkForBackground } from "@/lib/themes";

/**
 * Highlight mark with markdown-it `==text==` parsing and `==` serialization.
 * Sets contrasting ink so pastel highlights stay readable in dark themes
 * (TipTap's default `color: inherit` follows theme text and fails on light fills).
 */
export const HighlightWithMarkdown = Highlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-color") || element.style.backgroundColor || null,
        renderHTML: (attributes: { color?: string | null }) => {
          if (!attributes.color) return {};
          const ink = contrastInkForBackground(attributes.color);
          return {
            "data-color": attributes.color,
            style: `background-color: ${attributes.color}; color: ${ink}`,
          };
        },
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize: { open: "==", close: "==", expelEnclosingWhitespace: true },
        parse: {
          setup(markdownit: { use: (plugin: unknown) => void }) {
            markdownit.use(markdownItMark);
          },
        },
      },
    };
  },
});
