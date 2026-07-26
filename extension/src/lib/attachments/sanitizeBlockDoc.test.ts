import { describe, expect, it } from "vitest";
import {
  collectAttachmentPathsFromDoc,
  collectOrphanedAttachmentPaths,
  sanitizeBlockDocForPersistence,
} from "@/lib/attachments/sanitizeBlockDoc";
import type { BlockDoc } from "@/storage/types";

describe("sanitizeBlockDocForPersistence", () => {
  it("removes in-progress voice recording blocks", () => {
    const doc: BlockDoc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
        {
          type: "voiceNote",
          attrs: { status: "recording", autoStart: true, attachmentPath: null },
        },
        {
          type: "voiceNote",
          attrs: { status: "saved", attachmentPath: "audio/voice_a.webm" },
        },
      ],
    };

    const sanitized = sanitizeBlockDocForPersistence(doc);
    expect(sanitized.content).toHaveLength(2);
    expect(sanitized.content?.[1]?.type).toBe("voiceNote");
    expect(sanitized.content?.[1]?.attrs?.status).toBe("saved");
  });
});

describe("collectAttachmentPathsFromDoc", () => {
  it("collects image and voice note paths", () => {
    const doc: BlockDoc = {
      type: "doc",
      content: [
        { type: "image", attrs: { attachmentPath: "images/img_a.png" } },
        { type: "voiceNote", attrs: { attachmentPath: "audio/voice_a.webm" } },
      ],
    };

    expect(collectAttachmentPathsFromDoc(doc).sort()).toEqual([
      "audio/voice_a.webm",
      "images/img_a.png",
    ]);
  });
});

describe("collectOrphanedAttachmentPaths", () => {
  it("keeps paths referenced by remaining pages", () => {
    const sharedPath = "audio/shared.webm";
    const pages = [
      {
        id: "a",
        doc: {
          type: "doc",
          content: [{ type: "voiceNote", attrs: { attachmentPath: sharedPath } }],
        } as BlockDoc,
      },
      {
        id: "b",
        doc: {
          type: "doc",
          content: [{ type: "voiceNote", attrs: { attachmentPath: sharedPath } }],
        } as BlockDoc,
      },
      {
        id: "c",
        doc: {
          type: "doc",
          content: [{ type: "voiceNote", attrs: { attachmentPath: "audio/only_c.webm" } }],
        } as BlockDoc,
      },
    ];

    const orphaned = collectOrphanedAttachmentPaths(pages, new Set(["c"]));
    expect(orphaned).toEqual(["audio/only_c.webm"]);
  });
});
