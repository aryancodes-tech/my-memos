import { useStore } from "@/store/useStore";
import Editor from "@/editor/Editor";
import {
  CONTENT_MAX_WIDTH_PX,
  DEFAULT_PAGE_TITLE,
  EDITOR_SAVE_DEBOUNCE_MS,
  PAGE_CONTENT_PADDING_TOP_PX,
  PAGE_CONTENT_PADDING_X_PX,
  PRODUCT_TOUR_TARGETS,
} from "@/lib/constants";
import { Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** Formats a page updated timestamp for the page header metadata row. */
function formatPageEditedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PageView({ id }: { id: string }) {
  const { pages, updatePage, requestDelete } = useStore();
  const page = useMemo(() => pages.find((p) => p.id === id), [pages, id]);
  const [titleDraft, setTitleDraft] = useState(page?.title ?? "");
  const titleDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    setTitleDraft(page?.title ?? "");
  }, [page?.id, page?.title]);

  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) window.clearTimeout(titleDebounceRef.current);
    };
  }, []);

  if (!page) {
    return <div className="p-10 text-[var(--ko-text-muted)]">Page not found.</div>;
  }

  if (page.kind === "directory") {
    return (
      <div className="p-10 text-[var(--ko-text-muted)]">
        This is a folder. Expand it in the sidebar to see its pages.
      </div>
    );
  }

  return (
    <article
      className="ko-page-view mx-auto pb-16"
      style={{
        maxWidth: CONTENT_MAX_WIDTH_PX,
        paddingLeft: PAGE_CONTENT_PADDING_X_PX,
        paddingRight: PAGE_CONTENT_PADDING_X_PX,
        paddingTop: PAGE_CONTENT_PADDING_TOP_PX,
      }}
    >
      <header className="ko-page-header group" data-tour-target={PRODUCT_TOUR_TARGETS.slashMenu}>
        <div className="ko-page-title-row">
          <input
            value={titleDraft}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitleDraft(nextTitle);
              if (titleDebounceRef.current) window.clearTimeout(titleDebounceRef.current);
              titleDebounceRef.current = window.setTimeout(() => {
                void updatePage(id, { title: nextTitle });
              }, EDITOR_SAVE_DEBOUNCE_MS);
            }}
            placeholder={DEFAULT_PAGE_TITLE}
            aria-label="Page title"
            className="ko-page-title"
          />

          <div className="ko-page-actions">
            <button
              type="button"
              className="ko-icon-btn"
              title={page.favorite ? "Remove from favorites" : "Add to favorites"}
              aria-label={page.favorite ? "Remove from favorites" : "Add to favorites"}
              onClick={() => updatePage(id, { favorite: !page.favorite })}
            >
              <Star
                size={16}
                strokeWidth={1.75}
                className={page.favorite ? "fill-[var(--ko-accent)] text-[var(--ko-accent)]" : ""}
              />
            </button>
            <button
              type="button"
              className="ko-icon-btn"
              title="Delete page"
              aria-label="Delete page"
              onClick={() => requestDelete(id)}
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <p className="ko-page-meta">Last edited {formatPageEditedAt(page.updated_at)}</p>
      </header>

      <Editor
        key={page.id}
        docKey={page.id}
        initial={page.doc}
        onChange={(doc) => updatePage(id, { doc })}
      />
    </article>
  );
}
