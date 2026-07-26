import { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { describe, expect, it } from "vitest";

import { createEditorExtensions } from "@/editor/editorExtensions";
import { looksLikeMarkdown } from "@/editor/markdownPaste";

/** Simulates typing text so Tiptap input rules can run. */
function simulateTyping(editor: Editor, text: string): void {
  const { view } = editor;

  for (const char of text) {
    const { from, to } = view.state.selection;
    const handled = view.someProp("handleTextInput", (handler) =>
      (handler as (v: EditorView, f: number, t: number, text: string) => boolean)(
        view,
        from,
        to,
        char,
      ),
    );

    if (!handled) {
      view.dispatch(view.state.tr.insertText(char));
    }
  }
}

const SAMPLE_MARKDOWN = `# Networking

## Internet Basics

- [x] IP Address
- [x] DNS
- [ ] HTTPS

## Notes

DNS + TCP handshake + TLS handshake is asked surprisingly often.`;

const TABLE_MARKDOWN = `# System Design Interview Tracker

| Topic | Status |
|---------|---------|
| Caching | ✅ |
| Load Balancer | ✅ |
| Kafka | 🟡 |
| Redis | 🟡 |
| Consistent Hashing | ❌ |

## Next Up

- [ ] Consistent Hashing
- [ ] Rate Limiter`;

const RICH_MARKDOWN = `> Important quote

---

Visit [docs](https://example.com) or https://auto.link

\`\`\`typescript
const x = 1;
\`\`\`

![diagram](https://example.com/image.png)

~~deprecated~~ and ==highlighted==`;

/** Builds a headless editor for markdown paste tests. */
function createTestEditor() {
  return new Editor({
    extensions: createEditorExtensions(),
    content: {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
  });
}

describe("looksLikeMarkdown", () => {
  it("detects common markdown syntax", () => {
    expect(looksLikeMarkdown("# Title")).toBe(true);
    expect(looksLikeMarkdown("- [x] done")).toBe(true);
    expect(looksLikeMarkdown("plain sentence")).toBe(false);
  });

  it("handles empty input and additional markdown shapes", () => {
    expect(looksLikeMarkdown("")).toBe(false);
    expect(looksLikeMarkdown("   ")).toBe(false);
    expect(looksLikeMarkdown("```ts\nconst x = 1\n```")).toBe(true);
    expect(looksLikeMarkdown("> quoted")).toBe(true);
    expect(looksLikeMarkdown("1. ordered")).toBe(true);
    expect(looksLikeMarkdown("[link](https://example.com)")).toBe(true);
    expect(looksLikeMarkdown("**bold** text")).toBe(true);
  });
});

describe("markdown paste", () => {
  it("parses pasted markdown into headings, task lists, and paragraphs", () => {
    const editor = createTestEditor();
    const html = editor.storage.markdown.parser.parse(SAMPLE_MARKDOWN) as string;

    expect(html).toContain("<h1>");
    expect(html).toContain("<h2>");
    expect(html).toContain("task-list");
    expect(html).toContain("IP Address");

    editor.commands.setContent(html);
    const json = editor.getJSON();

    const nodeTypes = JSON.stringify(json);
    expect(nodeTypes).toContain("heading");
    expect(nodeTypes).toContain("taskList");
    expect(nodeTypes).toContain("taskItem");
    expect(nodeTypes).not.toContain("bulletList");

    editor.destroy();
  });

  it("does not parse GFM task lines as bullet lists", () => {
    const editor = createTestEditor();
    const html = editor.storage.markdown.parser.parse("- [x] Done\n- [ ] Todo") as string;

    editor.commands.setContent(html);
    const serialized = JSON.stringify(editor.getJSON());

    expect(serialized).toContain("taskList");
    expect(serialized).toContain("taskItem");
    expect(serialized).not.toContain("bulletList");

    editor.destroy();
  });

  it("creates a task list when typing - [x] markdown syntax", () => {
    const editor = createTestEditor();
    editor.commands.focus();
    simulateTyping(editor, "- [x] ");

    const serialized = JSON.stringify(editor.getJSON());
    expect(serialized).toContain("taskList");
    expect(serialized).toContain("taskItem");
    expect(serialized).not.toContain("bulletList");

    editor.destroy();
  });

  it("parses GFM tables with headings and task lists", () => {
    const editor = createTestEditor();
    const html = editor.storage.markdown.parser.parse(TABLE_MARKDOWN) as string;

    expect(html).toContain("<table>");
    expect(html).toContain("Caching");

    editor.commands.setContent(html);
    const json = editor.getJSON();
    const serialized = JSON.stringify(json);

    expect(serialized).toContain("table");
    expect(serialized).toContain("tableRow");
    expect(serialized).toContain("tableHeader");
    expect(serialized).toContain("tableCell");
    expect(serialized).toContain("Caching");
    expect(serialized).toContain("taskList");

    editor.destroy();
  });

  it("parses blockquotes, links, code blocks, images, and highlights", () => {
    const editor = createTestEditor();
    const html = editor.storage.markdown.parser.parse(RICH_MARKDOWN) as string;

    expect(html).toContain("<blockquote>");
    expect(html).toContain("<hr");
    expect(html).toContain("<pre>");
    expect(html).toContain("<img");
    expect(html).toContain("<mark>");

    editor.commands.setContent(html);
    const serialized = JSON.stringify(editor.getJSON());

    expect(serialized).toContain("blockquote");
    expect(serialized).toContain("horizontalRule");
    expect(serialized).toContain("codeBlock");
    expect(serialized).toContain("image");
    expect(serialized).toContain("highlight");
    expect(serialized).toContain("link");

    editor.destroy();
  });
});
