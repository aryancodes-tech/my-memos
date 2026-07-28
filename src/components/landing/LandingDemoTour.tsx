import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  LANDING_DEMO_TOUR_BODY,
  LANDING_DEMO_TOUR_DONE_LABEL,
  LANDING_DEMO_TOUR_EXIT_MIN_WIDTH_PX,
  LANDING_DEMO_TOUR_HISTORY_GUARD_KEY,
  LANDING_DEMO_TOUR_SCROLL_DISMISS_PX,
  LANDING_DEMO_TOUR_SKIP_LABEL,
  LANDING_DEMO_TOUR_SPOTLIGHT_PADDING_PX,
  LANDING_DEMO_TOUR_STORAGE_KEY,
  LANDING_DEMO_TOUR_TARGET,
  LANDING_DEMO_TOUR_TITLE,
  LANDING_DEMO_TOUR_Z_INDEX,
} from "@/lib/constants";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(LANDING_DEMO_TOUR_STORAGE_KEY) === "done";
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    window.localStorage.setItem(LANDING_DEMO_TOUR_STORAGE_KEY, "done");
  } catch {
    // Ignore quota / private-mode failures; tour just won't persist.
  }
}

function isExitNudgeViewport(): boolean {
  return window.matchMedia(`(min-width: ${LANDING_DEMO_TOUR_EXIT_MIN_WIDTH_PX}px)`).matches;
}

function pushTourHistoryGuard(): void {
  const current =
    typeof history.state === "object" && history.state !== null
      ? (history.state as Record<string, unknown>)
      : {};
  history.pushState(
    { ...current, [LANDING_DEMO_TOUR_HISTORY_GUARD_KEY]: true },
    "",
    window.location.href,
  );
}

/**
 * One-step landing coachmark that spotlights the hero “Try before you install” CTA.
 * On tablet/desktop it appears when the user tries to leave via Back (not on first load).
 * Dismissed via Skip, Got it, Escape, scroll, a second Back, or clicking the demo link.
 */
export function LandingDemoTour() {
  const [active, setActive] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardStyle, setCardStyle] = useState<CSSProperties>({});
  const activeRef = useRef(false);
  const shownThisVisitRef = useRef(false);
  const scrollOriginY = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const dismiss = useCallback(() => {
    persistDismissed();
    setActive(false);
  }, []);

  // Tablet/desktop: intercept the first Back press to show the demo coachmark.
  useEffect(() => {
    if (readDismissed() || !isExitNudgeViewport()) return;

    pushTourHistoryGuard();

    const onPopState = () => {
      if (readDismissed()) return;

      // Already showing (or already shown this visit): let Back leave the page.
      if (activeRef.current || shownThisVisitRef.current) {
        if (activeRef.current) {
          persistDismissed();
          setActive(false);
        }
        return;
      }

      shownThisVisitRef.current = true;
      pushTourHistoryGuard();
      setActive(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    scrollOriginY.current = window.scrollY;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    };

    const onDemoClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(`[data-tour-target="${LANDING_DEMO_TOUR_TARGET}"]`)) {
        dismiss();
      }
    };

    const onScroll = () => {
      if (Math.abs(window.scrollY - scrollOriginY.current) >= LANDING_DEMO_TOUR_SCROLL_DISMISS_PX) {
        dismiss();
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onDemoClick, true);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDemoClick, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [active, dismiss]);

  useLayoutEffect(() => {
    if (!active) return;

    const measure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-tour-target="${LANDING_DEMO_TOUR_TARGET}"]`,
      );
      if (!el) {
        setSpotlight(null);
        setCardStyle({
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        });
        return;
      }

      const pad = LANDING_DEMO_TOUR_SPOTLIGHT_PADDING_PX;
      const rect = el.getBoundingClientRect();
      const spot: SpotlightRect = {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      };
      setSpotlight(spot);

      const cardWidth = 320;
      const gap = 16;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let top = spot.top + spot.height + gap;
      let left = spot.left;
      if (top + 200 > vh) {
        top = Math.max(16, spot.top - 200 - gap);
      }
      if (left + cardWidth > vw - 16) {
        left = Math.max(16, vw - cardWidth - 16);
      }
      setCardStyle({ top, left, transform: "none" });
    };

    measure();
    const raf = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="landing-tour-root"
      style={{ zIndex: LANDING_DEMO_TOUR_Z_INDEX }}
      role="dialog"
      aria-modal="false"
      aria-labelledby="landing-tour-title"
    >
      {spotlight && (
        <div
          className="landing-tour-spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden
        />
      )}
      <div className="landing-tour-card" style={cardStyle}>
        <p className="landing-tour-step-count">1 / 1</p>
        <h2 id="landing-tour-title" className="landing-tour-title">
          {LANDING_DEMO_TOUR_TITLE}
        </h2>
        <p className="landing-tour-body">{LANDING_DEMO_TOUR_BODY}</p>
        <div className="landing-tour-actions">
          <button type="button" className="landing-tour-btn-skip" onClick={dismiss}>
            {LANDING_DEMO_TOUR_SKIP_LABEL}
          </button>
          <button type="button" className="landing-tour-btn-primary" onClick={dismiss}>
            {LANDING_DEMO_TOUR_DONE_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
