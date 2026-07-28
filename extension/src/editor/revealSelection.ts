import type { Editor } from "@tiptap/react";
import { EDITOR_SELECTION_REVEAL_VIEWPORT_RATIO } from "@/lib/constants";

/** Closest scroll container driving the page editor viewport, if any. */
function nearestScrollContainer(root: HTMLElement): HTMLElement | null {
  return root.closest("main.ko-scroll");
}

/**
 * Smoothly reveals the current editor selection when it sits outside the main
 * viewport band. Respects reduced-motion preferences.
 */
export function smoothRevealSelection(editor: Editor): void {
  if (typeof window === "undefined" || editor.isDestroyed) return;

  window.requestAnimationFrame(() => {
    if (editor.isDestroyed) return;

    let coords: { top: number; bottom: number };
    try {
      coords = editor.view.coordsAtPos(editor.state.selection.from);
    } catch {
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = nearestScrollContainer(editor.view.dom);

    if (container) {
      const rect = container.getBoundingClientRect();
      const targetTop = rect.top + container.clientHeight * EDITOR_SELECTION_REVEAL_VIEWPORT_RATIO;
      const targetBottom =
        rect.top + container.clientHeight * (1 - EDITOR_SELECTION_REVEAL_VIEWPORT_RATIO);
      const alreadyVisible = coords.top >= targetTop && coords.bottom <= targetBottom;
      if (alreadyVisible) return;

      const top = Math.max(0, container.scrollTop + (coords.top - targetTop));
      container.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      return;
    }

    const targetTop = window.innerHeight * EDITOR_SELECTION_REVEAL_VIEWPORT_RATIO;
    const targetBottom = window.innerHeight * (1 - EDITOR_SELECTION_REVEAL_VIEWPORT_RATIO);
    const alreadyVisible = coords.top >= targetTop && coords.bottom <= targetBottom;
    if (alreadyVisible) return;

    const top = Math.max(0, window.scrollY + coords.top - targetTop);

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });
}
