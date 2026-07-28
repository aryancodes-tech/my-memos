import { Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  ATTACHMENT_DELETE_BODY,
  ATTACHMENT_DELETE_CONFIRM_LABEL,
  ATTACHMENT_DELETE_KEEP_LABEL,
  ATTACHMENT_DELETE_TITLE,
  DIALOG_CLOSE_ARIA_LABEL,
} from "@/lib/constants";
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
          aria-label={DIALOG_CLOSE_ARIA_LABEL}
          onClick={cancelAttachmentDelete}
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={16} strokeWidth={1.75} className="text-[var(--ko-text-muted)]" />
          <h2 id="ko-attachment-delete-title" className="ko-dialog-title">
            {ATTACHMENT_DELETE_TITLE}
          </h2>
        </div>

        <p id="ko-attachment-delete-desc" className="ko-dialog-body">
          {ATTACHMENT_DELETE_BODY}
        </p>

        <div className="ko-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="ko-dialog-btn-keep"
            onClick={cancelAttachmentDelete}
          >
            {ATTACHMENT_DELETE_KEEP_LABEL}
          </button>
          <button
            type="button"
            className="ko-dialog-btn-delete"
            onClick={() => void confirmAttachmentDelete()}
          >
            {ATTACHMENT_DELETE_CONFIRM_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
