import { afterEach, describe, expect, it, vi } from "vitest";
import { ATTACHMENT_FS_UNSUPPORTED_MESSAGE } from "@/lib/constants";
import { AttachmentFsUnsupportedError } from "@/lib/attachments/errors";
import {
  getSubdirectoryHandle,
  getWritableAttachmentRoot,
  isAttachmentStorageSupported,
  verifyAttachmentRootAccess,
} from "@/lib/attachments/fileSystemManager";

describe("isAttachmentStorageSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when navigator.storage.getDirectory exists", () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn() },
    });
    expect(isAttachmentStorageSupported()).toBe(true);
  });

  it("returns false when OPFS APIs are missing", () => {
    vi.stubGlobal("navigator", {});
    expect(isAttachmentStorageSupported()).toBe(false);

    vi.stubGlobal("navigator", { storage: {} });
    expect(isAttachmentStorageSupported()).toBe(false);
  });
});

describe("getSubdirectoryHandle", () => {
  it("returns the root for an empty relative path", async () => {
    const root = { name: "root" } as unknown as FileSystemDirectoryHandle;
    await expect(getSubdirectoryHandle(root, "")).resolves.toBe(root);
  });

  it("walks nested path segments and creates directories", async () => {
    const audio = { name: "audio" };
    const images = {
      name: "images",
      getDirectoryHandle: vi.fn().mockResolvedValue(audio),
    };
    const root = {
      name: "root",
      getDirectoryHandle: vi.fn().mockResolvedValue(images),
    } as unknown as FileSystemDirectoryHandle;

    const handle = await getSubdirectoryHandle(root, "images/audio");
    expect(root.getDirectoryHandle).toHaveBeenCalledWith("images", { create: true });
    expect(images.getDirectoryHandle).toHaveBeenCalledWith("audio", { create: true });
    expect(handle).toBe(audio);
  });

  it("skips empty segments from slashes", async () => {
    const child = { name: "images" };
    const root = {
      getDirectoryHandle: vi.fn().mockResolvedValue(child),
    } as unknown as FileSystemDirectoryHandle;

    await getSubdirectoryHandle(root, "/images/");
    expect(root.getDirectoryHandle).toHaveBeenCalledOnce();
    expect(root.getDirectoryHandle).toHaveBeenCalledWith("images", { create: true });
  });
});

describe("verifyAttachmentRootAccess", () => {
  it("returns true when the audio directory exists", async () => {
    const root = {
      getDirectoryHandle: vi.fn().mockResolvedValue({}),
    } as unknown as FileSystemDirectoryHandle;
    await expect(verifyAttachmentRootAccess(root)).resolves.toBe(true);
  });

  it("returns false when the audio directory is missing", async () => {
    const root = {
      getDirectoryHandle: vi.fn().mockRejectedValue(new Error("missing")),
    } as unknown as FileSystemDirectoryHandle;
    await expect(verifyAttachmentRootAccess(root)).resolves.toBe(false);
  });
});

describe("getWritableAttachmentRoot", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws AttachmentFsUnsupportedError when OPFS is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    await expect(getWritableAttachmentRoot()).rejects.toBeInstanceOf(AttachmentFsUnsupportedError);
    await expect(getWritableAttachmentRoot()).rejects.toThrow(ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
  });
});
