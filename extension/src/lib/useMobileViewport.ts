import { useEffect, useState } from "react";

/**
 * Returns whether the viewport width is at or below the given breakpoint.
 * When `enabled` is false, always returns false.
 */
function getMobileViewportMatch(maxWidthPx: number, enabled: boolean): boolean {
  if (!enabled || typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches;
}

/**
 * Tracks whether the viewport is at or below a max-width breakpoint.
 */
export function useMobileViewport(maxWidthPx: number, enabled = true): boolean {
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    getMobileViewportMatch(maxWidthPx, enabled),
  );

  useEffect(() => {
    if (!enabled) {
      setIsMobileViewport(false);
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const update = () => setIsMobileViewport(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [maxWidthPx, enabled]);

  return isMobileViewport;
}
