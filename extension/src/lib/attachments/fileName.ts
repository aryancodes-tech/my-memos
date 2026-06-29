import { nanoid } from "nanoid";
import { len } from "@/lib/text";

/**
 * Builds a collision-safe attachment filename.
 * @param prefix - Logical prefix, e.g. `voice` or `img`.
 * @param extension - File extension including the dot, e.g. `.webm`.
 */
export function buildAttachmentFileName(prefix: string, extension: string): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const idPart = nanoid(8);
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${prefix}_${datePart}_${idPart}${ext}`;
}

/**
 * Returns a unique filename inside `directory` by appending numeric suffixes when needed.
 * @param directory - Parent directory handle.
 * @param baseName - Desired filename without path.
 */
export async function resolveUniqueFileName(
  directory: FileSystemDirectoryHandle,
  baseName: string,
): Promise<string> {
  if (len(baseName) === 0) {
    throw new Error("resolveUniqueFileName requires a non-empty base name");
  }

  const dotIndex = baseName.lastIndexOf(".");
  const stem = dotIndex >= 0 ? baseName.slice(0, dotIndex) : baseName;
  const ext = dotIndex >= 0 ? baseName.slice(dotIndex) : "";

  let candidate = baseName;
  let counter = 1;
  while (await directory.getFileHandle(candidate, { create: false }).catch(() => null)) {
    candidate = `${stem}_${String(counter).padStart(3, "0")}${ext}`;
    counter += 1;
  }
  return candidate;
}

/** Splits a relative attachment path into directory segment and filename. */
export function splitAttachmentPath(relativePath: string): { dir: string; fileName: string } {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex < 0) {
    return { dir: "", fileName: normalized };
  }
  return {
    dir: normalized.slice(0, slashIndex),
    fileName: normalized.slice(slashIndex + 1),
  };
}
