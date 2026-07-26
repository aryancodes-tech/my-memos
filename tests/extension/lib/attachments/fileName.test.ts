import { describe, expect, it } from "vitest";
import {
  buildAttachmentFileName,
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
