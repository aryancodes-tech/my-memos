import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/attachments/attachmentManager", () => ({
  saveImageAttachment: vi.fn(async () => "images/example.png"),
}));

vi.mock("@/lib/attachments/fileSystemManager", () => ({
  isAttachmentStorageSupported: vi.fn(() => true),
}));

vi.mock("@/editor/commands/insertSelection", () => ({
  appendAfterSelectedNode: vi.fn((chain) => chain),
}));

vi.mock("@/editor/revealSelection", () => ({
  smoothRevealSelection: vi.fn(),
}));

import { insertImagesFromFiles } from "@/editor/commands/insertImage";
import { smoothRevealSelection } from "@/editor/revealSelection";

function createChain() {
  return {
    focus: vi.fn(function () {
      return this;
    }),
    insertContentAt: vi.fn(function () {
      return this;
    }),
    deleteRange: vi.fn(function () {
      return this;
    }),
    insertContent: vi.fn(function () {
      return this;
    }),
    run: vi.fn(() => true),
  };
}

describe("insertImagesFromFiles", () => {
  it("scrolls the inserted image block into view", async () => {
    const chain = createChain();
    const editor = {
      chain: () => chain,
    } as any;
    const file = new File(["image"], "photo.png", { type: "image/png" });

    const inserted = await insertImagesFromFiles(editor, [file]);

    expect(inserted).toBe(1);
    expect(chain.run).toHaveBeenCalledOnce();
    expect(smoothRevealSelection).toHaveBeenCalledWith(editor);
  });
});
