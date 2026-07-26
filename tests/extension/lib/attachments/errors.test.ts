import { describe, expect, it } from "vitest";
import {
  AttachmentFsUnsupportedError,
  AttachmentIoError,
  AttachmentStorageUnavailableError,
} from "@/lib/attachments/errors";

describe("attachment error classes", () => {
  it("sets distinct names for instanceof / catch branching", () => {
    const unsupported = new AttachmentFsUnsupportedError("no fs");
    const unavailable = new AttachmentStorageUnavailableError("unavailable");
    const io = new AttachmentIoError("io failed");

    expect(unsupported).toBeInstanceOf(Error);
    expect(unsupported).toBeInstanceOf(AttachmentFsUnsupportedError);
    expect(unsupported.name).toBe("AttachmentFsUnsupportedError");
    expect(unsupported.message).toBe("no fs");

    expect(unavailable.name).toBe("AttachmentStorageUnavailableError");
    expect(io.name).toBe("AttachmentIoError");
    expect(io).not.toBeInstanceOf(AttachmentFsUnsupportedError);
  });
});
