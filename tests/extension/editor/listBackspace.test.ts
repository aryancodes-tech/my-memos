import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { createEditorExtensions } from "@/editor/editorExtensions";
import { tryLiftListItemAtSelectionStart } from "@/editor/listBackspace";

function createEditor(content: Record<string, unknown>) {
  return new Editor({
    extensions: createEditorExtensions(),
    content,
  });
}

/** Position of the first character inside the last textblock. */
function caretAtStartOfLastTextblock(editor: Editor): number {
  let pos = 1;
  editor.state.doc.descendants((node, nodePos) => {
    if (node.isTextblock) {
      pos = nodePos + 1;
    }
  });
  return pos;
}

describe("tryLiftListItemAtSelectionStart", () => {
  it("lifts an ordered-list item into a paragraph instead of merging", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }],
            },
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "ssssss" }] }],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(caretAtStartOfLastTextblock(editor));
    expect(tryLiftListItemAtSelectionStart(editor)).toBe(true);

    const json = editor.getJSON();
    expect(json.content?.map((n) => n.type)).toEqual(["orderedList", "paragraph"]);
    expect(json.content?.[0]?.content).toHaveLength(1);
    const lifted = json.content?.[1];
    expect(lifted?.type).toBe("paragraph");
    expect(lifted?.content?.[0] && "text" in lifted.content[0] ? lifted.content[0].text : "").toBe(
      "ssssss",
    );

    editor.destroy();
  });

  it("lifts a bullet-list item into a paragraph", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }],
            },
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "b" }] }],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(caretAtStartOfLastTextblock(editor));
    expect(tryLiftListItemAtSelectionStart(editor)).toBe(true);
    expect(editor.getJSON().content?.map((n) => n.type)).toEqual(["bulletList", "paragraph"]);

    editor.destroy();
  });

  it("lifts a task item into a paragraph", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text: "todo" }] }],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text: "next" }] }],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(caretAtStartOfLastTextblock(editor));
    expect(tryLiftListItemAtSelectionStart(editor)).toBe(true);
    expect(editor.getJSON().content?.map((n) => n.type)).toEqual(["taskList", "paragraph"]);

    editor.destroy();
  });

  it("does nothing when the caret is mid-item", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
            },
          ],
        },
      ],
    });

    const start = caretAtStartOfLastTextblock(editor);
    editor.commands.setTextSelection(start + 2);
    expect(tryLiftListItemAtSelectionStart(editor)).toBe(false);
    expect(editor.getJSON().content?.[0]?.type).toBe("bulletList");

    editor.destroy();
  });

  it("does not lift when caret is at the start of a non-first block in the item", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "first" }] },
                { type: "paragraph", content: [{ type: "text", text: "second" }] },
              ],
            },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(caretAtStartOfLastTextblock(editor));
    expect(tryLiftListItemAtSelectionStart(editor)).toBe(false);

    editor.destroy();
  });
});
