import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { createEditorExtensions } from "@/editor/editorExtensions";
import { indentSelectedText } from "@/editor/tabIndent";

function createEditor(content: string) {
  return new Editor({
    extensions: createEditorExtensions(),
    content: `<p>${content}</p><p>second</p>`,
  });
}

describe("indentSelectedText", () => {
  it("returns null for an empty selection", () => {
    const editor = createEditor("Hello");
    editor.commands.setTextSelection(1);
    expect(indentSelectedText(editor.state, "\t")).toBeNull();
    editor.destroy();
  });

  it("indents a single-line selection at the caret range start", () => {
    const editor = createEditor("Hello");
    editor.commands.setTextSelection({ from: 1, to: 6 });
    const tr = indentSelectedText(editor.state, "\t");
    expect(tr).not.toBeNull();
    editor.view.dispatch(tr!);
    expect(editor.getText()).toContain("\tHello");
    editor.destroy();
  });

  it("indents every textblock touched by a multi-block selection", () => {
    const editor = createEditor("Hello");
    const end = editor.state.doc.content.size - 1;
    editor.commands.setTextSelection({ from: 1, to: end });
    const tr = indentSelectedText(editor.state, "  ");
    expect(tr).not.toBeNull();
    editor.view.dispatch(tr!);
    const json = editor.getJSON();
    const first = json.content?.[0]?.content?.[0];
    const second = json.content?.[1]?.content?.[0];
    expect(first && "text" in first ? first.text : "").toMatch(/^ {2}Hello/);
    expect(second && "text" in second ? second.text : "").toMatch(/^ {2}second/);
    editor.destroy();
  });
});
