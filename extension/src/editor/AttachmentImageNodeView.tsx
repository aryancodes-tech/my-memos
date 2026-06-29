import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getAttachmentObjectUrl } from "@/lib/attachments/attachmentManager";
import { len } from "@/lib/text";

/** Lazy-loaded image block backed by OPFS attachments or legacy base64 `src`. */
export default function AttachmentImageNodeView({ node }: NodeViewProps) {
  const attachmentPath = node.attrs.attachmentPath as string | null;
  const legacySrc = node.attrs.src as string | null;
  const alt = (node.attrs.alt as string | undefined) ?? "Image";

  const [src, setSrc] = useState<string | null>(len(legacySrc ?? "") > 0 ? legacySrc : null);
  const [loading, setLoading] = useState(
    len(attachmentPath ?? "") > 0 && len(legacySrc ?? "") === 0,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (len(attachmentPath ?? "") === 0) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getAttachmentObjectUrl(attachmentPath!)
      .then((url) => {
        if (!cancelled) {
          setSrc(url);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setError("Image unavailable.");
        console.warn("[MyMemos] Failed to load attachment image:", attachmentPath, err);
      });

    return () => {
      cancelled = true;
    };
  }, [attachmentPath]);

  return (
    <NodeViewWrapper className="ko-attachment-image-wrap" data-drag-handle>
      {loading && (
        <div className="ko-attachment-placeholder" aria-busy="true">
          <Loader2 size={18} className="ko-attachment-spinner" strokeWidth={1.75} />
          <span>Loading image…</span>
        </div>
      )}
      {!loading && error && (
        <div className="ko-attachment-error" role="alert">
          <AlertCircle size={16} strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}
      {!loading && !error && src && (
        <img src={src} alt={alt} className="ko-attachment-image" draggable={false} />
      )}
    </NodeViewWrapper>
  );
}
