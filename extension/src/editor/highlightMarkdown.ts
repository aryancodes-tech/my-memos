import Highlight from "@tiptap/extension-highlight";
import markdownItMark from "markdown-it-mark";

/**
 * Highlight mark with markdown-it `==text==` parsing and `==` serialization.
 */
export const HighlightWithMarkdown = Highlight.extend({
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
