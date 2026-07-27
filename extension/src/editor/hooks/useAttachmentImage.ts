import { useCallback, useEffect, useState, type RefObject } from "react";
import { getAttachmentObjectUrl } from "@/lib/attachments/attachmentManager";
import { IMAGE_TOOLBAR_COMPACT_MAX_WIDTH_PX, IMAGE_UNAVAILABLE_MESSAGE } from "@/lib/constants";
import { len } from "@/lib/text";

/** Loads an OPFS (or legacy) image URL for the attachment image node. */
export function useAttachmentImageSource(
  attachmentPath: string | null,
  legacySrc: string | null,
) {
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
        setError(IMAGE_UNAVAILABLE_MESSAGE);
        console.warn("[MyMemos] Failed to load attachment image:", attachmentPath, err);
      });

    return () => {
      cancelled = true;
    };
  }, [attachmentPath]);

  return { src, loading, error };
}

/** Lightbox + overflow menu chrome for the attachment image toolbar. */
export function useAttachmentImageChrome() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  const closeMenuOnOutside = useCallback(
    (menuEl: HTMLElement | null, moreBtnEl: HTMLElement | null) => {
      if (!menuOpen) return () => undefined;
      const onPointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (menuEl?.contains(target) || moreBtnEl?.contains(target)) return;
        setMenuOpen(false);
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setMenuOpen(false);
      };
      window.addEventListener("mousedown", onPointerDown);
      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("mousedown", onPointerDown);
        window.removeEventListener("keydown", onKey);
      };
    },
    [menuOpen],
  );

  return {
    lightboxOpen,
    setLightboxOpen,
    menuOpen,
    setMenuOpen,
    closeMenuOnOutside,
  };
}

/**
 * True when the image frame is narrower than the full toolbar, so chrome
 * should collapse into a single overflow menu.
 */
export function useAttachmentImageCompactToolbar(
  frameRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCompact(false);
      return;
    }

    const el = frameRef.current;
    if (!el) return;

    const update = (width: number) => {
      setCompact(width > 0 && width < IMAGE_TOOLBAR_COMPACT_MAX_WIDTH_PX);
    };

    update(el.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      update(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, frameRef]);

  return compact;
}
