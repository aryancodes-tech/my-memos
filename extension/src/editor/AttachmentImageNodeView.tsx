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
import { deleteAttachment, saveImageAttachment } from "@/lib/attachments/attachmentManager";
import { splitAttachmentPath } from "@/lib/attachments/fileName";
import {
  EDITOR_ALIGN_CENTER_LABEL,
  EDITOR_ALIGN_LEFT_LABEL,
  EDITOR_ALIGN_RIGHT_LABEL,
  IMAGE_ALIGN_DEFAULT,
  IMAGE_ALIGNMENTS,
  IMAGE_CAPTION_OVERFLOW_HINT,
  IMAGE_CAPTION_PLACEHOLDER,
  IMAGE_ALIGN_GROUP_ARIA,
  IMAGE_COPY_LABEL,
  IMAGE_DELETE_LABEL,
  IMAGE_DOWNLOAD_LABEL,
  IMAGE_MORE_OPTIONS_LABEL,
  IMAGE_REMOVE_LABEL,
  IMAGE_REPLACE_LABEL,
} from "@/lib/constants";
import {
  useAttachmentImageChrome,
  useAttachmentImageCompactToolbar,
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
  const [captionFocused, setCaptionFocused] = useState(false);
  const [captionOverflowing, setCaptionOverflowing] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const compactToolbar = useAttachmentImageCompactToolbar(
    frameRef,
    !loading && !error && len(src ?? "") > 0,
  );

  useEffect(() => {
    setCaptionDraft(caption);
  }, [caption]);

  useEffect(
    () => closeMenuOnOutside(menuRef.current, moreBtnRef.current),
    [closeMenuOnOutside, menuOpen],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [compactToolbar, setMenuOpen]);

  useEffect(() => {
    const input = captionInputRef.current;
    if (!input) return;

    const updateCaptionOverflow = () => {
      setCaptionOverflowing(input.scrollWidth - input.clientWidth > 1);
    };

    updateCaptionOverflow();

    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", updateCaptionOverflow);
      return () => window.removeEventListener("resize", updateCaptionOverflow);
    }

    const observer = new ResizeObserver(updateCaptionOverflow);
    observer.observe(input);
    return () => observer.disconnect();
  }, [captionDraft]);

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
    setMenuOpen(false);
  }, [attachmentPath, setMenuOpen, src]);

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

  const moreMenu = menuOpen && (
    <div ref={menuRef} className="ko-attachment-menu" role="menu">
      {compactToolbar && (
        <>
          <button
            type="button"
            className={`ko-attachment-menu-item ${align === "left" ? "is-active" : ""}`}
            role="menuitemradio"
            aria-checked={align === "left"}
            onClick={() => {
              setAlign("left");
              setMenuOpen(false);
            }}
          >
            <AlignLeft size={14} strokeWidth={1.75} />
            <span>{EDITOR_ALIGN_LEFT_LABEL}</span>
          </button>
          <button
            type="button"
            className={`ko-attachment-menu-item ${align === "center" ? "is-active" : ""}`}
            role="menuitemradio"
            aria-checked={align === "center"}
            onClick={() => {
              setAlign("center");
              setMenuOpen(false);
            }}
          >
            <AlignCenter size={14} strokeWidth={1.75} />
            <span>{EDITOR_ALIGN_CENTER_LABEL}</span>
          </button>
          <button
            type="button"
            className={`ko-attachment-menu-item ${align === "right" ? "is-active" : ""}`}
            role="menuitemradio"
            aria-checked={align === "right"}
            onClick={() => {
              setAlign("right");
              setMenuOpen(false);
            }}
          >
            <AlignRight size={14} strokeWidth={1.75} />
            <span>{EDITOR_ALIGN_RIGHT_LABEL}</span>
          </button>
          <div className="ko-attachment-menu-divider" role="separator" />
          <button
            type="button"
            className="ko-attachment-menu-item"
            role="menuitem"
            onClick={handleDownload}
          >
            <Download size={14} strokeWidth={1.75} />
            <span>{IMAGE_DOWNLOAD_LABEL}</span>
          </button>
          <button
            type="button"
            className="ko-attachment-menu-item is-danger"
            role="menuitem"
            onClick={handleDelete}
          >
            <Trash2 size={14} strokeWidth={1.75} />
            <span>{IMAGE_DELETE_LABEL}</span>
          </button>
          <div className="ko-attachment-menu-divider" role="separator" />
        </>
      )}
      <button
        type="button"
        className="ko-attachment-menu-item"
        role="menuitem"
        onClick={handleReplace}
      >
        <Replace size={14} strokeWidth={1.75} />
        <span>{IMAGE_REPLACE_LABEL}</span>
      </button>
      <button
        type="button"
        className="ko-attachment-menu-item"
        role="menuitem"
        onClick={() => void handleCopyImage()}
      >
        <Copy size={14} strokeWidth={1.75} />
        <span>{IMAGE_COPY_LABEL}</span>
      </button>
    </div>
  );

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
            ref={frameRef}
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

            <div
              className={`ko-attachment-toolbar ${compactToolbar ? "is-compact" : ""}`}
              onClick={stop}
              onMouseDown={stop}
            >
              {!compactToolbar && (
                <>
                  <div
                    className="ko-attachment-tool-group"
                    role="group"
                    aria-label={IMAGE_ALIGN_GROUP_ARIA}
                  >
                    <button
                      type="button"
                      className={`ko-attachment-tool-btn ${align === "left" ? "is-active" : ""}`}
                      title={EDITOR_ALIGN_LEFT_LABEL}
                      aria-label={EDITOR_ALIGN_LEFT_LABEL}
                      aria-pressed={align === "left"}
                      onClick={() => setAlign("left")}
                    >
                      <AlignLeft size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={`ko-attachment-tool-btn ${align === "center" ? "is-active" : ""}`}
                      title={EDITOR_ALIGN_CENTER_LABEL}
                      aria-label={EDITOR_ALIGN_CENTER_LABEL}
                      aria-pressed={align === "center"}
                      onClick={() => setAlign("center")}
                    >
                      <AlignCenter size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={`ko-attachment-tool-btn ${align === "right" ? "is-active" : ""}`}
                      title={EDITOR_ALIGN_RIGHT_LABEL}
                      aria-label={EDITOR_ALIGN_RIGHT_LABEL}
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
                    title={IMAGE_DOWNLOAD_LABEL}
                    aria-label={IMAGE_DOWNLOAD_LABEL}
                    onClick={handleDownload}
                  >
                    <Download size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    className="ko-attachment-tool-btn ko-attachment-tool-danger"
                    title={IMAGE_DELETE_LABEL}
                    aria-label={IMAGE_DELETE_LABEL}
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>

                  <span className="ko-attachment-tool-divider" aria-hidden />
                </>
              )}

              <div className="ko-attachment-more-wrap">
                <button
                  ref={moreBtnRef}
                  type="button"
                  className={`ko-attachment-tool-btn ${menuOpen ? "is-active" : ""}`}
                  title={IMAGE_MORE_OPTIONS_LABEL}
                  aria-label={IMAGE_MORE_OPTIONS_LABEL}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <MoreHorizontal size={14} strokeWidth={1.75} />
                </button>
                {moreMenu}
              </div>
            </div>
          </div>

          <div
            className="ko-attachment-caption-wrap"
            data-overflow={captionOverflowing && !captionFocused ? "true" : "false"}
          >
            <input
              ref={captionInputRef}
              type="text"
              className="ko-attachment-caption"
              value={captionDraft}
              placeholder={IMAGE_CAPTION_PLACEHOLDER}
              aria-label="Image caption"
              onClick={stop}
              onMouseDown={stop}
              onChange={(event) => setCaptionDraft(event.target.value)}
              onFocus={() => setCaptionFocused(true)}
              onBlur={() => {
                setCaptionFocused(false);
                commitCaption();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
            />
            <span className="ko-attachment-caption-overflow" aria-hidden>
              {IMAGE_CAPTION_OVERFLOW_HINT}
            </span>
          </div>
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
            <div
              className="ko-attachment-lightbox-matte"
              onClick={(event) => event.stopPropagation()}
            >
              <img src={src} alt={alt} className="ko-attachment-lightbox-img" draggable={false} />
            </div>
            {len(caption) > 0 && <p className="ko-attachment-lightbox-caption">{caption}</p>}
          </div>,
          document.body,
        )}
    </NodeViewWrapper>
  );
}
