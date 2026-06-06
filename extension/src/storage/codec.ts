import LZString from "lz-string";
import type { BlockDoc } from "./types";

/** Empty document returned when decoding fails or input is missing. */
export const EMPTY_BLOCK_DOC: BlockDoc = { type: "doc", content: [] };

/**
 * Compresses a block document to a UTF-16 string for IndexedDB storage.
 * Only source JSON is stored - never rendered HTML or markdown.
 */
export function encodeDoc(doc: BlockDoc): string {
  return LZString.compressToUTF16(JSON.stringify(doc));
}

/**
 * Decompresses a stored document string back into a block document.
 * Returns an empty doc on missing, corrupt, or invalid input.
 */
export function decodeDoc(encoded: string | undefined | null): BlockDoc {
  if (!encoded) return EMPTY_BLOCK_DOC;
  try {
    const raw = LZString.decompressFromUTF16(encoded);
    if (!raw) return EMPTY_BLOCK_DOC;
    const parsed = JSON.parse(raw) as BlockDoc;
    if (parsed?.type !== "doc" || !Array.isArray(parsed.content)) {
      return EMPTY_BLOCK_DOC;
    }
    return parsed;
  } catch (error) {
    console.warn("[KnowledgeOS] Failed to decode page document; using empty doc.", error);
    return EMPTY_BLOCK_DOC;
  }
}
