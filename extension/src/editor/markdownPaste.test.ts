import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";

import { createEditorExtensions } from "@/editor/editorExtensions";

const SAMPLE_MARKDOWN = `# Networking

## Internet Basics

- [x] IP Address
- [x] DNS
- [ ] HTTPS

## Notes

DNS + TCP handshake + TLS handshake is asked surprisingly often.`;

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

    editor.destroy();
  });
});
