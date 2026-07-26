import { len } from "@/lib/text";
import type { BlockDoc, BlockNode } from "@/storage/types";

/** Node types that store a relative OPFS path in `attachmentPath`. */
const ATTACHMENT_NODE_TYPES = new Set(["voiceNote", "image"]);

/**
 * Returns a copy of the block document safe to persist.
 * Drops in-progress voice recording blocks (ephemeral UI state).
 */
export function sanitizeBlockDocForPersistence(doc: BlockDoc): BlockDoc {
  return {
    type: "doc",
    content: sanitizeNodes(doc.content ?? []),
  };
}

function sanitizeNodes(nodes: BlockNode[]): BlockNode[] {
  const sanitized: BlockNode[] = [];

  for (const node of nodes) {
    if (node.type === "voiceNote" && node.attrs?.status === "recording") {
      continue;
    }

    const next: BlockNode = { ...node };
    if (next.attrs && "autoStart" in next.attrs) {
      const { autoStart: _autoStart, ...rest } = next.attrs;
      next.attrs = rest;
    }
    if (next.content) {
      next.content = sanitizeNodes(next.content);
    }
    sanitized.push(next);
  }

  return sanitized;
}

/**
 * Collects unique attachment paths referenced anywhere in a block document.
 * @param doc - Page block JSON.
 */
export function collectAttachmentPathsFromDoc(doc: BlockDoc): string[] {
  const paths = new Set<string>();
  walkNodes(doc.content ?? [], paths);
  return [...paths];
}

function walkNodes(nodes: BlockNode[], paths: Set<string>): void {
  for (const node of nodes) {
    if (ATTACHMENT_NODE_TYPES.has(node.type)) {
      const path = node.attrs?.attachmentPath;
      if (typeof path === "string" && len(path) > 0) {
        paths.add(path);
      }
    }
    if (node.content) walkNodes(node.content, paths);
  }
}

/**
 * Builds a reference count map for attachment paths across all pages.
 * Used to avoid deleting files still referenced elsewhere.
 */
export function buildAttachmentRefCounts(pages: Array<{ doc: BlockDoc }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    for (const path of collectAttachmentPathsFromDoc(page.doc)) {
      counts.set(path, (counts.get(path) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Returns attachment paths whose last reference lives on one of `pageIds`.
 * @param pages - All pages before deletion.
 * @param pageIds - Page ids being removed (including folder descendants).
 */
export function collectOrphanedAttachmentPaths(
  pages: Array<{ id: string; doc: BlockDoc }>,
  pageIds: Set<string>,
): string[] {
  const refCounts = buildAttachmentRefCounts(pages);
  const orphaned = new Set<string>();

  for (const page of pages) {
    if (!pageIds.has(page.id)) continue;
    for (const path of collectAttachmentPathsFromDoc(page.doc)) {
      const count = refCounts.get(path) ?? 0;
      refCounts.set(path, count - 1);
      if (count === 1) orphaned.add(path);
    }
  }

  return [...orphaned];
}
