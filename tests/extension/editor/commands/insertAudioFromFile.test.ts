import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/attachments/attachmentManager", () => ({
  saveUploadedAudioAttachment: vi.fn(async () => ({
    path: "audio/example.webm",
    duration: 3,
    size: 1234,
    title: "Example",
    createdAt: "2026-07-28T00:00:00.000Z",
  })),
}));

vi.mock("@/lib/attachments/fileSystemManager", () => ({
  isAttachmentStorageSupported: vi.fn(() => true),
}));

vi.mock("@/editor/commands/insertSelection", () => ({
  appendAfterSelectedNode: vi.fn((chain) => chain),
}));

vi.mock("@/editor/commands/insertVoiceRecording", () => ({
  focusVoiceInsertPosition: vi.fn(),
}));

vi.mock("@/editor/revealSelection", () => ({
  smoothRevealSelection: vi.fn(),
}));

import { insertAudioFromPicker } from "@/editor/commands/insertAudioFromFile";
import { smoothRevealSelection } from "@/editor/revealSelection";

function createChain() {
  return {
    focus: vi.fn(function () {
      return this;
    }),
    deleteRange: vi.fn(function () {
      return this;
    }),
    insertVoiceNote: vi.fn(function () {
      return this;
    }),
    run: vi.fn(() => true),
  };
}

describe("insertAudioFromPicker", () => {
  it("scrolls the inserted audio note into view", async () => {
    const chain = createChain();
    const editor = {
      chain: () => chain,
    } as any;
    const input = {
      type: "",
      accept: "",
      files: [new File(["audio"], "clip.webm", { type: "audio/webm" })],
      onchange: null as null | (() => void),
      click() {
        this.onchange?.();
      },
    };
    vi.spyOn(document, "createElement").mockReturnValue(input as any);

    insertAudioFromPicker(editor);
    await Promise.resolve();
    await Promise.resolve();

    expect(chain.insertVoiceNote).toHaveBeenCalledOnce();
    expect(chain.run).toHaveBeenCalledOnce();
    expect(smoothRevealSelection).toHaveBeenCalledWith(editor);
  });
});
