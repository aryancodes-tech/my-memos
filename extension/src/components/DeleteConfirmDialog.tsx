import { useStore } from "@/store/useStore";
import { PageIcon } from "@/components/PageIcon";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

/** Modal that confirms page or folder deletion with a cautious, friction-first layout. */
export default function DeleteConfirmDialog() {
  const { pages, pendingDelete, cancelDelete, confirmDelete } = useStore();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const item = useMemo(
    () => (pendingDelete ? pages.find((page) => page.id === pendingDelete.pageId) : undefined),
    [pages, pendingDelete]
  );

  const open = pendingDelete !== null && item !== undefined;
  const childCount = pendingDelete?.childCount ?? 0;
  const isDirectory = item?.kind === "directory";
  const label =
    item?.title || (isDirectory ? "Untitled folder" : "Untitled");

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelDelete();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, cancelDelete]);

  if (!open || !item) return null;

  const title = isDirectory ? "Delete this folder?" : "Delete this page?";
  const description = isDirectory
    ? childCount > 0
      ? `"${label}" contains ${childCount} item${childCount === 1 ? "" : "s"}. Deleting it will permanently remove the folder and everything inside. This cannot be undone.`
      : `"${label}" will be permanently removed. This cannot be undone.`
    : `"${label}" and all of its content will be permanently removed. This cannot be undone.`;

  return (
    <div
      className="ko-dialog-overlay"
      role="presentation"
      onClick={cancelDelete}
    >
      <div
        className="ko-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ko-delete-title"
        aria-describedby="ko-delete-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="ko-dialog-close"
          aria-label="Close"
          onClick={cancelDelete}
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <PageIcon kind={item.kind} size={16} expanded={isDirectory} />
          <h2 id="ko-delete-title" className="ko-dialog-title">
            {title}
          </h2>
        </div>

        <p id="ko-delete-desc" className="ko-dialog-body">
          {description}
        </p>

        {isDirectory && childCount > 0 && (
          <p className="ko-dialog-warning">
            Tip: Move pages out of this folder first if you only want to reorganize.
          </p>
        )}

        <div className="ko-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="ko-dialog-btn-keep"
            onClick={cancelDelete}
          >
            Keep {isDirectory ? "folder" : "page"}
          </button>
          <button
            type="button"
            className="ko-dialog-btn-delete"
            onClick={() => void confirmDelete()}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
