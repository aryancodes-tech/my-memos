import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useStore } from "@/store/useStore";
import {
  PRODUCT_TOUR_DONE_LABEL,
  PRODUCT_TOUR_NEXT_LABEL,
  PRODUCT_TOUR_PREV_LABEL,
  PRODUCT_TOUR_SKIP_LABEL,
  PRODUCT_TOUR_SPOTLIGHT_PADDING_PX,
  PRODUCT_TOUR_START_LABEL,
  PRODUCT_TOUR_STEPS,
  PRODUCT_TOUR_TRANSITION_MS,
  PRODUCT_TOUR_Z_INDEX,
} from "@/lib/constants";
import { tourStepNeedsPage, tourStepPrefersDashboard } from "@/onboarding/tourSteps";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CENTER_CARD: CSSProperties = {
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
};

/** Coachmark overlay: dim backdrop, animated spotlight, step card. */
export default function ProductTour() {
  const {
    tourActive,
    tourHydrated,
    tourStepIndex,
    nextTourStep,
    prevTourStep,
    skipTour,
    completeTour,
    view,
    pages,
    setView,
    createPage,
  } = useStore();

  const step = PRODUCT_TOUR_STEPS[tourStepIndex] ?? PRODUCT_TOUR_STEPS[0];
  const isFirst = tourStepIndex === 0;
  const isLast = tourStepIndex === PRODUCT_TOUR_STEPS.length - 1;
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const [cardStyle, setCardStyle] = useState<CSSProperties>(CENTER_CARD);
  const [contentKey, setContentKey] = useState(0);
  const [entered, setEntered] = useState(false);
  const measureAttempts = useRef(0);

  useEffect(() => {
    if (!tourActive) {
      setEntered(false);
      return;
    }
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, [tourActive]);

  useEffect(() => {
    if (!tourActive || !tourHydrated) return;

    if (tourStepPrefersDashboard(step.id) && view.kind !== "dashboard") {
      setView({ kind: "dashboard" });
      return;
    }

    if (tourStepNeedsPage(step.id) && view.kind !== "page") {
      const firstPage = pages.find((page) => page.kind !== "directory" && !page.archived);
      if (firstPage) {
        setView({ kind: "page", id: firstPage.id });
      } else {
        void createPage();
      }
    }
  }, [tourActive, tourHydrated, step.id, view.kind, pages, setView, createPage]);

  useEffect(() => {
    setContentKey((value) => value + 1);
  }, [tourStepIndex]);

  useLayoutEffect(() => {
    if (!tourActive) return;

    measureAttempts.current = 0;
    let raf = 0;
    let cancelled = false;

    const placeCentered = () => {
      setSpotlightVisible(false);
      setCardStyle(CENTER_CARD);
    };

    const measure = () => {
      if (cancelled) return;
      const pad = PRODUCT_TOUR_SPOTLIGHT_PADDING_PX;

      if (!step.target) {
        placeCentered();
        return;
      }

      const el = document.querySelector<HTMLElement>(`[data-tour-target="${step.target}"]`);
      if (!el) {
        placeCentered();
        measureAttempts.current += 1;
        if (measureAttempts.current < 24) {
          raf = window.requestAnimationFrame(measure);
        }
        return;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        measureAttempts.current += 1;
        if (measureAttempts.current < 24) {
          raf = window.requestAnimationFrame(measure);
        }
        return;
      }

      const spot: SpotlightRect = {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      };
      setSpotlight(spot);
      setSpotlightVisible(true);

      const cardWidth = 320;
      const gap = 16;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let top = spot.top + spot.height + gap;
      let left = spot.left;
      if (top + 220 > vh) {
        top = Math.max(16, spot.top - 220 - gap);
      }
      if (left + cardWidth > vw - 16) {
        left = Math.max(16, vw - cardWidth - 16);
      }
      setCardStyle({ top, left, transform: "none" });
    };

    raf = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [tourActive, step.target, tourStepIndex, view.kind]);

  useEffect(() => {
    if (!tourActive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void skipTour();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isLast) {
          void completeTour();
        } else {
          nextTourStep();
        }
        return;
      }
      if (event.key === "ArrowLeft" && !isFirst) {
        event.preventDefault();
        prevTourStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourActive, skipTour, isLast, isFirst, completeTour, nextTourStep, prevTourStep]);

  if (!tourHydrated || !tourActive) return null;

  const primaryLabel = isFirst
    ? PRODUCT_TOUR_START_LABEL
    : isLast
      ? PRODUCT_TOUR_DONE_LABEL
      : PRODUCT_TOUR_NEXT_LABEL;

  const onPrimary = () => {
    if (isLast) {
      void completeTour();
      return;
    }
    nextTourStep();
  };

  const motionStyle = {
    ["--ko-tour-ms" as string]: `${PRODUCT_TOUR_TRANSITION_MS}ms`,
  };

  return (
    <div
      className={`ko-tour-root ${entered ? "is-entered" : ""}`}
      style={{ zIndex: PRODUCT_TOUR_Z_INDEX, ...motionStyle }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ko-tour-title"
    >
      <div className="ko-tour-backdrop" aria-hidden />
      <div
        className={`ko-tour-spotlight ${spotlightVisible ? "is-visible" : ""}`}
        style={
          spotlight
            ? {
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
              }
            : {
                top: "50%",
                left: "50%",
                width: 0,
                height: 0,
              }
        }
        aria-hidden
      />
      <div className="ko-tour-card" style={cardStyle}>
        <div key={contentKey} className="ko-tour-card-inner">
          <p className="ko-tour-step-count">
            {tourStepIndex + 1} / {PRODUCT_TOUR_STEPS.length}
          </p>
          <h2 id="ko-tour-title" className="ko-tour-title">
            {step.title}
          </h2>
          <p className="ko-tour-body">{step.body}</p>
        </div>
        <div className="ko-tour-actions">
          <button type="button" className="ko-tour-btn-skip" onClick={() => void skipTour()}>
            {PRODUCT_TOUR_SKIP_LABEL}
          </button>
          <div className="ko-tour-actions-nav">
            {!isFirst && (
              <button type="button" className="ko-tour-btn-prev" onClick={prevTourStep}>
                {PRODUCT_TOUR_PREV_LABEL}
              </button>
            )}
            <button type="button" className="ko-tour-btn-primary" onClick={onPrimary}>
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
