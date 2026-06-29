import {
  ATTACHMENT_DIR_AUDIO,
  ATTACHMENT_DIR_DATABASE,
  ATTACHMENT_DIR_IMAGES,
  ATTACHMENT_FS_UNSUPPORTED_MESSAGE,
  ATTACHMENT_OPFS_ROOT_DIR,
} from "@/lib/constants";
import { len } from "@/lib/text";
import { AttachmentFsUnsupportedError } from "@/lib/attachments/errors";

/** In-memory cache of the OPFS attachment root for the current session. */
let cachedRootHandle: FileSystemDirectoryHandle | null = null;

/** Returns true when Origin Private File System storage is available. */
export function isAttachmentStorageSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function"
  );
}

/** @deprecated Use {@link isAttachmentStorageSupported}. */
export function isFileSystemAccessSupported(): boolean {
  return isAttachmentStorageSupported();
}

/** Clears the in-memory root handle cache. */
export function clearAttachmentRootCache(): void {
  cachedRootHandle = null;
}

/** Creates `database/`, `images/`, and `audio/` under the attachment root. */
async function ensureAttachmentSubdirectories(root: FileSystemDirectoryHandle): Promise<void> {
  await root.getDirectoryHandle(ATTACHMENT_DIR_DATABASE, { create: true });
  await root.getDirectoryHandle(ATTACHMENT_DIR_IMAGES, { create: true });
  await root.getDirectoryHandle(ATTACHMENT_DIR_AUDIO, { create: true });
}

/**
 * Returns the writable attachment root from OPFS (no user prompt).
 * Files live in a hidden per-origin directory until cloud sync is added.
 */
export async function getWritableAttachmentRoot(): Promise<FileSystemDirectoryHandle> {
  if (!isAttachmentStorageSupported()) {
    throw new AttachmentFsUnsupportedError(ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
  }

  if (cachedRootHandle) {
    return cachedRootHandle;
  }

  const opfsRoot = await navigator.storage.getDirectory();
  const appRoot = await opfsRoot.getDirectoryHandle(ATTACHMENT_OPFS_ROOT_DIR, { create: true });
  await ensureAttachmentSubdirectories(appRoot);
  cachedRootHandle = appRoot;
  return appRoot;
}

/**
 * Resolves a subdirectory handle under the attachment root.
 * @param root - Attachment root directory.
 * @param relativeDir - Subfolder name such as `images` or `audio`.
 */
export async function getSubdirectoryHandle(
  root: FileSystemDirectoryHandle,
  relativeDir: string,
): Promise<FileSystemDirectoryHandle> {
  if (len(relativeDir) === 0) return root;

  const parts = relativeDir.split("/").filter((part) => len(part) > 0);
  let current = root;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

/** Verifies that attachment subdirectories are reachable. */
export async function verifyAttachmentRootAccess(
  root: FileSystemDirectoryHandle,
): Promise<boolean> {
  try {
    await root.getDirectoryHandle(ATTACHMENT_DIR_AUDIO);
    return true;
  } catch {
    return false;
  }
}
