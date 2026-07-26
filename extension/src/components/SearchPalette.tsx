import { PageIcon } from "@/components/PageIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import FlexSearch from "flexsearch";
import { selectSearchablePages, useStore } from "@/store/useStore";
import { extractPlainText } from "@/lib/text";
import { DEFAULT_FOLDER_TITLE, WORKSPACE_SECTION } from "@/lib/constants";
import type { Page } from "@/storage/types";

/** Human-readable location for search results (folder path or workspace root). */
function pageLocationLabel(pages: Page[], page: Page): string {
  if (page.kind === "directory") {
    return WORKSPACE_SECTION;
  }
  if (page.parent_id === null) {
    return WORKSPACE_SECTION;
  }
  const parent = pages.find((entry) => entry.id === page.parent_id);
  if (!parent) {
    return WORKSPACE_SECTION;
  }
  return `${parent.title || DEFAULT_FOLDER_TITLE}`;
}

/**
 * Command palette + full-text search. Index is built in-memory on demand
 * (never persisted) so storage stays lean per spec.
 */
export default function SearchPalette() {
  const { searchOpen, setSearchOpen, pages, setView } = useStore();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const searchablePages = useMemo(() => selectSearchablePages(pages), [pages]);

  const index = useMemo(() => {
    const idx = new FlexSearch.Document({
      tokenize: "forward",
      document: { id: "id", index: ["title", "text", "tags"] },
    });
    for (const p of searchablePages) {
      idx.add({
        id: p.id,
        title: p.title,
        text: extractPlainText(p.doc),
        tags: p.tags.join(" "),
      });
    }
    return idx;
  }, [searchablePages]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 10);
    else setQ("");
  }, [searchOpen]);

  const results = useMemo(() => {
    if (!q.trim()) return searchablePages.slice(0, 8);
    const ids = new Set<string>();
    const res = index.search(q, { limit: 20 }) as Array<{ result: string[] }>;
    for (const r of res) for (const id of r.result) ids.add(id);
    return searchablePages.filter((p) => ids.has(p.id));
  }, [q, index, searchablePages]);

  if (!searchOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={() => setSearchOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[640px] max-w-[92vw] rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: "var(--ko-surface)", borderColor: "var(--ko-border)" }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pages, content, tags…"
          className="w-full px-4 py-3 bg-transparent outline-none text-[var(--ko-text)]"
        />
        <div
          className="border-t max-h-[50vh] overflow-y-auto ko-scroll"
          style={{ borderColor: "var(--ko-border)" }}
        >
          {results.length === 0 && (
            <div className="px-4 py-6 text-sm text-[var(--ko-text-muted)]">No matches</div>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setView({ kind: "page", id: p.id });
                setSearchOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--ko-surface-2)]"
            >
              <PageIcon kind="page" size={16} />
              <div className="min-w-0">
                <div className="truncate text-sm">{p.title || "Untitled"}</div>
                <div className="truncate text-xs text-[var(--ko-text-muted)]">
                  {pageLocationLabel(pages, p)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
