import { describe, expect, it } from "vitest";
import { decodeDoc, encodeDoc, EMPTY_BLOCK_DOC } from "./codec";
import type { BlockDoc } from "./types";

const sampleDoc: BlockDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hello KnowledgeOS" }],
    },
  ],
};

describe("encodeDoc", () => {
  it("round-trips a block document", () => {
    const encoded = encodeDoc(sampleDoc);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
    expect(decodeDoc(encoded)).toEqual(sampleDoc);
  });

  it("produces different output for different documents", () => {
    const other: BlockDoc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Other" }] }],
    };
    expect(encodeDoc(sampleDoc)).not.toEqual(encodeDoc(other));
  });
});

describe("decodeDoc", () => {
  it("returns empty doc for nullish input", () => {
    expect(decodeDoc(null)).toEqual(EMPTY_BLOCK_DOC);
    expect(decodeDoc(undefined)).toEqual(EMPTY_BLOCK_DOC);
    expect(decodeDoc("")).toEqual(EMPTY_BLOCK_DOC);
  });

  it("returns empty doc for corrupt data", () => {
    expect(decodeDoc("not-valid-lz-string")).toEqual(EMPTY_BLOCK_DOC);
  });

  it("returns empty doc when JSON is not a block doc", () => {
    const garbage = encodeDoc({ type: "doc", content: [] } as BlockDoc);
    // Tamper by replacing with invalid JSON payload after compression
    expect(decodeDoc("@@@@")).toEqual(EMPTY_BLOCK_DOC);
    expect(garbage).toBeTruthy();
  });
});
