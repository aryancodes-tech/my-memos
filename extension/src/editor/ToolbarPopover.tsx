import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ToolbarPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  /** Align popover edge to the right of the anchor (for items near the screen edge). */
  align?: "left" | "right";
}

/** Renders toolbar dropdowns in a portal so header overflow does not clip them. */
export function ToolbarPopover({
  open,
  onClose,
  anchorRef,
  children,
  align = "left",
}: ToolbarPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? 180;
      const margin = 8;

      let left = align === "left" ? rect.left : rect.right - popoverWidth;
      left = Math.max(margin, Math.min(left, window.innerWidth - popoverWidth - margin));

      setStyle({ top: rect.bottom + 6, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, anchorRef, open, children]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      onClose();
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [anchorRef, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="ko-toolbar-popover ko-toolbar-popover-portal"
      style={{ top: style.top, left: style.left }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  );
}

/** Prevents the editor from losing focus when clicking toolbar controls. */
export function preventEditorBlur(event: React.MouseEvent) {
  event.preventDefault();
}
