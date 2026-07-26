import { describe, expect, it } from "vitest";
import {
  buildAttachmentRefCounts,
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

  it("strips autoStart from nested saved notes and leaves empty docs intact", () => {
    const doc: BlockDoc = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "voiceNote",
              attrs: { status: "saved", autoStart: true, attachmentPath: "audio/x.webm" },
            },
          ],
        },
      ],
    };

    const sanitized = sanitizeBlockDocForPersistence(doc);
    expect(sanitized.content?.[0]?.content?.[0]?.attrs).toEqual({
      status: "saved",
      attachmentPath: "audio/x.webm",
    });
    expect(sanitizeBlockDocForPersistence({ type: "doc", content: [] }).content).toEqual([]);
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

  it("ignores empty paths, duplicates, and non-attachment nodes", () => {
    const doc: BlockDoc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "hi" }] },
        { type: "image", attrs: { attachmentPath: "" } },
        { type: "image", attrs: { attachmentPath: "images/a.png" } },
        { type: "image", attrs: { attachmentPath: "images/a.png" } },
      ],
    };
    expect(collectAttachmentPathsFromDoc(doc)).toEqual(["images/a.png"]);
  });
});

describe("buildAttachmentRefCounts", () => {
  it("counts shared paths across pages", () => {
    const pages = [
      {
        doc: {
          type: "doc",
          content: [{ type: "image", attrs: { attachmentPath: "images/shared.png" } }],
        } as BlockDoc,
      },
      {
        doc: {
          type: "doc",
          content: [
            { type: "image", attrs: { attachmentPath: "images/shared.png" } },
            { type: "voiceNote", attrs: { attachmentPath: "audio/only.webm" } },
          ],
        } as BlockDoc,
      },
    ];

    const counts = buildAttachmentRefCounts(pages);
    expect(counts.get("images/shared.png")).toBe(2);
    expect(counts.get("audio/only.webm")).toBe(1);
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

  it("orphans a shared path only when every referencing page is deleted", () => {
    const sharedPath = "images/shared.png";
    const pages = [
      {
        id: "a",
        doc: {
          type: "doc",
          content: [{ type: "image", attrs: { attachmentPath: sharedPath } }],
        } as BlockDoc,
      },
      {
        id: "b",
        doc: {
          type: "doc",
          content: [{ type: "image", attrs: { attachmentPath: sharedPath } }],
        } as BlockDoc,
      },
    ];

    expect(collectOrphanedAttachmentPaths(pages, new Set(["a"]))).toEqual([]);
    expect(collectOrphanedAttachmentPaths(pages, new Set(["a", "b"]))).toEqual([sharedPath]);
  });
});
