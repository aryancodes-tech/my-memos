import type { BlockDoc, BlockNode } from "@/storage/types";

/** Returns the length of a string, used for empty-string checks. */
export function len(value: string): number {
  return value.length;
}

/** Recursively extract plain text from a block doc for indexing / previews. */
export function extractPlainText(doc: BlockDoc): string {
  const out: string[] = [];
  const walk = (n: BlockNode) => {
    if (n.text) out.push(n.text);
    if (n.content) for (const c of n.content) walk(c);
  };
  for (const n of doc.content) walk(n);
  return out.join(" ");
}
