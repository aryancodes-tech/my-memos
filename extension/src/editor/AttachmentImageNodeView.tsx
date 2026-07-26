import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import {
  AlertCircle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Download,
  Loader2,
  MoreHorizontal,
  Replace,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteAttachment,
  saveImageAttachment,
} from "@/lib/attachments/attachmentManager";
import { splitAttachmentPath } from "@/lib/attachments/fileName";
import {
  IMAGE_ALIGN_DEFAULT,
  IMAGE_ALIGNMENTS,
  IMAGE_CAPTION_PLACEHOLDER,
  IMAGE_ALIGN_GROUP_ARIA,
  IMAGE_REMOVE_LABEL,
} from "@/lib/constants";
import {
  useAttachmentImageChrome,
  useAttachmentImageSource,
} from "@/editor/hooks/useAttachmentImage";
import { useStore } from "@/store/useStore";
import { len } from "@/lib/text";

type ImageAlign = (typeof IMAGE_ALIGNMENTS)[number];

function normalizeAlign(value: unknown): ImageAlign {
  if (value === "left" || value === "center" || value === "right") return value;
  return IMAGE_ALIGN_DEFAULT;
}

/** Lazy-loaded image block backed by OPFS attachments or legacy base64 `src`. */
export default function AttachmentImageNodeView({
  node,
  selected,
  deleteNode,
  updateAttributes,
}: NodeViewProps) {
  const attachmentPath = node.attrs.attachmentPath as string | null;
  const legacySrc = node.attrs.src as string | null;
  const alt = (node.attrs.alt as string | undefined) ?? "Image";
  const caption = (node.attrs.caption as string | undefined) ?? "";
  const align = normalizeAlign(node.attrs.align);

  const requestAttachmentDelete = useStore((state) => state.requestAttachmentDelete);
  const { src, loading, error } = useAttachmentImageSource(attachmentPath, legacySrc);
  const { lightboxOpen, setLightboxOpen, menuOpen, setMenuOpen, closeMenuOnOutside } =
    useAttachmentImageChrome();

  const [captionDraft, setCaptionDraft] = useState(caption);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCaptionDraft(caption);
  }, [caption]);

  useEffect(
    () => closeMenuOnOutside(menuRef.current, moreBtnRef.current),
    [closeMenuOnOutside, menuOpen],
  );

  const commitCaption = useCallback(() => {
    const next = captionDraft.trim();
    if (next !== caption) updateAttributes({ caption: next });
  }, [caption, captionDraft, updateAttributes]);

  const setAlign = useCallback(
    (next: ImageAlign) => {
      updateAttributes({ align: next });
    },
    [updateAttributes],
  );

  const handleDelete = useCallback(() => {
    setMenuOpen(false);
    if (len(attachmentPath ?? "") === 0) {
      deleteNode();
      return;
    }
    requestAttachmentDelete({
      attachmentPath: attachmentPath!,
    });
  }, [attachmentPath, deleteNode, requestAttachmentDelete, setMenuOpen]);

  const handleDownload = useCallback(() => {
    if (len(src ?? "") === 0) return;
    const fileName =
      len(attachmentPath ?? "") > 0 ? splitAttachmentPath(attachmentPath!).fileName : "image.png";
    const anchor = document.createElement("a");
    anchor.href = src!;
    anchor.download = fileName;
    anchor.click();
  }, [attachmentPath, src]);

  const handleCopyImage = useCallback(async () => {
    if (len(src ?? "") === 0 || !navigator.clipboard?.write) return;
    try {
      const blob = await (await fetch(src!)).blob();
      const type = blob.type.startsWith("image/") ? blob.type : "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      setMenuOpen(false);
    } catch (err) {
      console.warn("[MyMemos] Failed to copy image:", err);
    }
  }, [setMenuOpen, src]);

  const handleReplace = useCallback(() => {
    setMenuOpen(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void (async () => {
        try {
          const previousPath = attachmentPath;
          const path = await saveImageAttachment(file);
          updateAttributes({
            attachmentPath: path,
            attachmentSize: file.size,
            alt: file.name,
            src: null,
          });
          if (len(previousPath ?? "") > 0 && previousPath !== path) {
            await deleteAttachment(previousPath!);
          }
        } catch (err) {
          console.warn("[MyMemos] Failed to replace image:", err);
        }
      })();
    };
    input.click();
  }, [attachmentPath, setMenuOpen, updateAttributes]);

  const stop = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <NodeViewWrapper
      className={`ko-attachment-image-wrap ${selected ? "is-selected" : ""}`}
      data-align={align}
      data-drag-handle
    >
      {loading && (
        <div className="ko-attachment-placeholder" aria-busy="true">
          <Loader2 size={18} className="ko-attachment-spinner" strokeWidth={1.75} />
          <span>Loading image…</span>
        </div>
      )}

      {!loading && error && (
        <div className="ko-attachment-error" role="alert">
          <span className="ko-attachment-error-msg">
            <AlertCircle size={16} strokeWidth={1.75} />
            <span>{error}</span>
          </span>
          <button
            type="button"
            className="ko-attachment-tool-btn ko-attachment-tool-danger"
            title={IMAGE_REMOVE_LABEL}
            aria-label={IMAGE_REMOVE_LABEL}
            onClick={handleDelete}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {!loading && !error && src && (
        <div className="ko-attachment-image-block">
          <div
            className="ko-attachment-image-frame"
            onClick={() => setLightboxOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setLightboxOpen(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`View ${alt}`}
          >
            <img src={src} alt={alt} className="ko-attachment-image" draggable={false} />

            <div className="ko-attachment-toolbar" onClick={stop} onMouseDown={stop}>
              <div
                className="ko-attachment-tool-group"
                role="group"
                aria-label={IMAGE_ALIGN_GROUP_ARIA}
              >
                <button
                  type="button"
                  className={`ko-attachment-tool-btn ${align === "left" ? "is-active" : ""}`}
                  title="Align left"
                  aria-label="Align left"
                  aria-pressed={align === "left"}
                  onClick={() => setAlign("left")}
                >
                  <AlignLeft size={14} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className={`ko-attachment-tool-btn ${align === "center" ? "is-active" : ""}`}
                  title="Align center"
                  aria-label="Align center"
                  aria-pressed={align === "center"}
                  onClick={() => setAlign("center")}
                >
                  <AlignCenter size={14} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className={`ko-attachment-tool-btn ${align === "right" ? "is-active" : ""}`}
                  title="Align right"
                  aria-label="Align right"
                  aria-pressed={align === "right"}
                  onClick={() => setAlign("right")}
                >
                  <AlignRight size={14} strokeWidth={1.75} />
                </button>
              </div>

              <span className="ko-attachment-tool-divider" aria-hidden />

              <button
                type="button"
                className="ko-attachment-tool-btn"
                title="Download"
                aria-label="Download image"
                onClick={handleDownload}
              >
                <Download size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="ko-attachment-tool-btn ko-attachment-tool-danger"
                title="Delete"
                aria-label="Delete image"
                onClick={handleDelete}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>

              <span className="ko-attachment-tool-divider" aria-hidden />

              <div className="ko-attachment-more-wrap">
                <button
                  ref={moreBtnRef}
                  type="button"
                  className={`ko-attachment-tool-btn ${menuOpen ? "is-active" : ""}`}
                  title="More options"
                  aria-label="More options"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <MoreHorizontal size={14} strokeWidth={1.75} />
                </button>

                {menuOpen && (
                  <div ref={menuRef} className="ko-attachment-menu" role="menu">
                    <button
                      type="button"
                      className="ko-attachment-menu-item"
                      role="menuitem"
                      onClick={handleReplace}
                    >
                      <Replace size={14} strokeWidth={1.75} />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      className="ko-attachment-menu-item"
                      role="menuitem"
                      onClick={() => void handleCopyImage()}
                    >
                      <Copy size={14} strokeWidth={1.75} />
                      <span>Copy image</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <input
            type="text"
            className="ko-attachment-caption"
            value={captionDraft}
            placeholder={IMAGE_CAPTION_PLACEHOLDER}
            aria-label="Image caption"
            onClick={stop}
            onMouseDown={stop}
            onChange={(event) => setCaptionDraft(event.target.value)}
            onBlur={commitCaption}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
        </div>
      )}

      {lightboxOpen &&
        src &&
        createPortal(
          <div
            className="ko-attachment-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Zoomed image"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              className="ko-attachment-lightbox-close"
              aria-label="Close zoom"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={18} strokeWidth={1.75} />
            </button>
            <img
              src={src}
              alt={alt}
              className="ko-attachment-lightbox-img"
              draggable={false}
              onClick={(event) => event.stopPropagation()}
            />
            {len(caption) > 0 && <p className="ko-attachment-lightbox-caption">{caption}</p>}
          </div>,
          document.body,
        )}
    </NodeViewWrapper>
  );
}
