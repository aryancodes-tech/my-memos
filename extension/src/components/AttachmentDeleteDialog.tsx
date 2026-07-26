import { Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

/** Confirms deletion of an on-disk attachment referenced by an editor block. */
export default function AttachmentDeleteDialog() {
  const { pendingAttachmentDelete, cancelAttachmentDelete, confirmAttachmentDelete } = useStore();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const open = pendingAttachmentDelete !== null;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelAttachmentDelete();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, cancelAttachmentDelete]);

  if (!open || !pendingAttachmentDelete) return null;

  return (
    <div className="ko-dialog-overlay" role="presentation" onClick={cancelAttachmentDelete}>
      <div
        className="ko-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ko-attachment-delete-title"
        aria-describedby="ko-attachment-delete-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="ko-dialog-close"
          aria-label="Close"
          onClick={cancelAttachmentDelete}
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={16} strokeWidth={1.75} className="text-[var(--ko-text-muted)]" />
          <h2 id="ko-attachment-delete-title" className="ko-dialog-title">
            Delete attachment?
          </h2>
        </div>

        <p id="ko-attachment-delete-desc" className="ko-dialog-body">
          This will permanently remove the attachment file and delete the block from your note. Your
          note text will not be affected.
        </p>

        <div className="ko-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="ko-dialog-btn-keep"
            onClick={cancelAttachmentDelete}
          >
            Keep attachment
          </button>
          <button
            type="button"
            className="ko-dialog-btn-delete"
            onClick={() => void confirmAttachmentDelete()}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
