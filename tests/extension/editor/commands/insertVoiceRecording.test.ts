import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/attachments/fileSystemManager", () => ({
  isAttachmentStorageSupported: vi.fn(() => true),
}));

vi.mock("@/editor/commands/insertSelection", () => ({
  appendAfterSelectedNode: vi.fn((chain) => chain),
}));

vi.mock("@/editor/revealSelection", () => ({
  smoothRevealSelection: vi.fn(),
}));

import { insertInlineVoiceRecording } from "@/editor/commands/insertVoiceRecording";
import { smoothRevealSelection } from "@/editor/revealSelection";

function createChain() {
  return {
    focus: vi.fn(function () {
      return this;
    }),
    deleteRange: vi.fn(function () {
      return this;
    }),
    insertVoiceNoteRecording: vi.fn(function () {
      return this;
    }),
    run: vi.fn(() => true),
  };
}

describe("insertInlineVoiceRecording", () => {
  it("scrolls the recording block into view when inserted", () => {
    const chain = createChain();
    const editor = {
      isFocused: true,
      state: {
        doc: {
          descendants: (
            callback: (node: { type: { name: string }; attrs: { status?: string } }) => void,
          ) => {
            callback({ type: { name: "paragraph" }, attrs: {} });
          },
        },
      },
      commands: {
        focus: vi.fn(),
      },
      chain: () => chain,
    } as any;

    insertInlineVoiceRecording(editor);

    expect(chain.insertVoiceNoteRecording).toHaveBeenCalledOnce();
    expect(chain.run).toHaveBeenCalledOnce();
    expect(smoothRevealSelection).toHaveBeenCalledWith(editor);
  });
});
