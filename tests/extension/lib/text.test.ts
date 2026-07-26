import { describe, expect, it } from "vitest";
import { extractPlainText, len } from "@/lib/text";
import type { BlockDoc } from "@/storage/types";

describe("len", () => {
  it("returns string length for empty-string checks", () => {
    expect(len("")).toBe(0);
    expect(len("hello")).toBe(5);
  });
});

describe("extractPlainText", () => {
  it("extracts text from nested block nodes", () => {
    const doc: BlockDoc = {
      type: "doc",
      content: [
        {
          type: "heading",
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world" },
          ],
        },
      ],
    };
    expect(extractPlainText(doc)).toBe("Title Hello  world");
  });

  it("returns empty string for an empty document", () => {
    expect(extractPlainText({ type: "doc", content: [] })).toBe("");
  });

  it("skips nodes without text and joins deeply nested leaves", () => {
    const doc: BlockDoc = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "quoted" }],
            },
          ],
        },
        { type: "horizontalRule" },
      ],
    };
    expect(extractPlainText(doc)).toBe("quoted");
  });
});
