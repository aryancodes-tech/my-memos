import { useStore } from "@/store/useStore";
import { EDITOR_LINK_PLACEHOLDER } from "@/lib/constants";
import { len } from "@/lib/text";
import { Link2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Modal for adding, editing, or removing hyperlinks in the page editor. */
export default function LinkDialog() {
  const { pendingLink, cancelLink, applyLink, removeLink } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [href, setHref] = useState("");

  const open = pendingLink !== null;
  const hasExistingLink = len(pendingLink?.initialHref ?? "") > 0;
  const canSave = len(href.trim()) > 0;

  useEffect(() => {
    if (!open) return;
    setHref(hasExistingLink ? pendingLink!.initialHref : EDITOR_LINK_PLACEHOLDER);
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelLink();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, pendingLink, hasExistingLink, cancelLink]);

  if (!open || !pendingLink) return null;

  const title = hasExistingLink ? "Edit link" : "Add link";
  const description = hasExistingLink
    ? "Update the URL for the selected text, or remove the link entirely."
    : "Paste or type a URL for the selected text.";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    applyLink(href);
  };

  return (
    <div className="ko-dialog-overlay" role="presentation" onClick={cancelLink}>
      <div
        className="ko-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ko-link-title"
        aria-describedby="ko-link-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="ko-dialog-close" aria-label="Close" onClick={cancelLink}>
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Link2 size={16} strokeWidth={1.75} className="text-[var(--ko-text-muted)]" />
          <h2 id="ko-link-title" className="ko-dialog-title">
            {title}
          </h2>
        </div>

        <p id="ko-link-desc" className="ko-dialog-body">
          {description}
        </p>

        <form className="ko-dialog-form" onSubmit={handleSubmit}>
          <label htmlFor="ko-link-url" className="ko-dialog-label">
            URL
          </label>
          <input
            ref={inputRef}
            id="ko-link-url"
            type="url"
            className="ko-dialog-input"
            value={href}
            placeholder={EDITOR_LINK_PLACEHOLDER}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setHref(event.target.value)}
          />

          {hasExistingLink && (
            <button type="button" className="ko-dialog-link-remove" onClick={removeLink}>
              Remove link
            </button>
          )}

          <div className="ko-dialog-actions">
            <button type="button" className="ko-dialog-btn-delete" onClick={cancelLink}>
              Cancel
            </button>
            <button type="submit" className="ko-dialog-btn-keep" disabled={!canSave}>
              {hasExistingLink ? "Apply link" : "Add link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
