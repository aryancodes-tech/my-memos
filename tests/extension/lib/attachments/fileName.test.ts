import { describe, expect, it, vi } from "vitest";
import {
  buildAttachmentFileName,
  resolveUniqueFileName,
  splitAttachmentPath,
} from "@/lib/attachments/fileName";
import { formatDurationSeconds, formatFileSizeBytes } from "@/lib/attachments/format";

describe("buildAttachmentFileName", () => {
  it("includes prefix, date, id, and extension", () => {
    const name = buildAttachmentFileName("voice", ".webm");
    expect(name.startsWith("voice_")).toBe(true);
    expect(name.endsWith(".webm")).toBe(true);
    expect(name.split("_").length).toBeGreaterThanOrEqual(3);
  });
});

describe("splitAttachmentPath", () => {
  it("splits directory and filename", () => {
    expect(splitAttachmentPath("audio/voice_abc.webm")).toEqual({
      dir: "audio",
      fileName: "voice_abc.webm",
    });
  });

  it("handles bare filenames", () => {
    expect(splitAttachmentPath("voice.webm")).toEqual({
      dir: "",
      fileName: "voice.webm",
    });
  });
});

describe("formatDurationSeconds", () => {
  it("formats mm:ss", () => {
    expect(formatDurationSeconds(0)).toBe("00:00");
    expect(formatDurationSeconds(65)).toBe("01:05");
    expect(formatDurationSeconds(201)).toBe("03:21");
  });
});

describe("formatFileSizeBytes", () => {
  it("formats human-readable sizes", () => {
    expect(formatFileSizeBytes(512)).toBe("512 B");
    expect(formatFileSizeBytes(2048)).toBe("2.0 KB");
    expect(formatFileSizeBytes(5_219_381)).toBe("5.0 MB");
  });
});

describe("buildAttachmentFileName edge cases", () => {
  it("adds a leading dot when the extension omits one", () => {
    const name = buildAttachmentFileName("img", "png");
    expect(name.endsWith(".png")).toBe(true);
    expect(name.includes("..png")).toBe(false);
  });
});

describe("splitAttachmentPath edge cases", () => {
  it("normalizes backslashes and leading slashes", () => {
    expect(splitAttachmentPath("\\images\\img_a.png")).toEqual({
      dir: "images",
      fileName: "img_a.png",
    });
    expect(splitAttachmentPath("/audio/voice.webm")).toEqual({
      dir: "audio",
      fileName: "voice.webm",
    });
  });
});

describe("resolveUniqueFileName", () => {
  it("rejects empty base names", async () => {
    const directory = {
      getFileHandle: vi.fn(),
    } as unknown as FileSystemDirectoryHandle;

    await expect(resolveUniqueFileName(directory, "")).rejects.toThrow(
      "resolveUniqueFileName requires a non-empty base name",
    );
  });

  it("returns the base name when it does not already exist", async () => {
    const directory = {
      getFileHandle: vi.fn().mockRejectedValue(new Error("missing")),
    } as unknown as FileSystemDirectoryHandle;

    await expect(resolveUniqueFileName(directory, "voice.webm")).resolves.toBe("voice.webm");
  });

  it("appends numeric suffixes until a free name is found", async () => {
    const existing = new Set(["note.png", "note_001.png"]);
    const directory = {
      getFileHandle: vi.fn(async (name: string) => {
        if (existing.has(name)) return {};
        throw new Error("missing");
      }),
    } as unknown as FileSystemDirectoryHandle;

    await expect(resolveUniqueFileName(directory, "note.png")).resolves.toBe("note_002.png");
  });

  it("handles names without an extension", async () => {
    const existing = new Set(["voice"]);
    const directory = {
      getFileHandle: vi.fn(async (name: string) => {
        if (existing.has(name)) return {};
        throw new Error("missing");
      }),
    } as unknown as FileSystemDirectoryHandle;

    await expect(resolveUniqueFileName(directory, "voice")).resolves.toBe("voice_001");
  });
});
