import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  LANDING_SHOWCASE_DESC,
  LANDING_SHOWCASE_EYEBROW,
  LANDING_SHOWCASE_IMAGE_HEIGHT,
  LANDING_SHOWCASE_IMAGE_WIDTH,
  LANDING_SHOWCASE_JUMP_LABEL_PREFIX,
  LANDING_SHOWCASE_NEXT_LABEL,
  LANDING_SHOWCASE_PREV_LABEL,
  LANDING_SHOWCASE_REGION_LABEL,
  LANDING_SHOWCASE_SCROLL_SETTLE_MS,
  LANDING_SHOWCASE_SLIDES,
  LANDING_SHOWCASE_TITLE,
  LANDING_SHOWCASE_ZOOM_CLOSE_LABEL,
  LANDING_SHOWCASE_ZOOM_DIALOG_LABEL,
  LANDING_SHOWCASE_ZOOM_HINT,
  LANDING_SHOWCASE_ZOOM_LABEL,
} from "@/lib/constants";

const LAST_INDEX = LANDING_SHOWCASE_SLIDES.length - 1;

/**
 * Screenshot carousel driven by native scroll snapping, so touch swipe works
 * without gesture handling. Clicking a slide opens a full-viewport zoom
 * lightbox on both mobile and desktop.
 */
export function LandingShowcaseCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const isZoomed = zoomIndex !== null;
  const zoomedSlide = isZoomed ? LANDING_SHOWCASE_SLIDES[zoomIndex] : null;

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isZoomed) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setZoomIndex(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setZoomIndex((current) => (current === null || current === 0 ? current : current - 1));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setZoomIndex((current) =>
          current === null || current === LAST_INDEX ? current : current + 1,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      zoomTriggerRef.current?.focus();
    };
  }, [isZoomed]);

  /**
   * Advances relative to the last requested slide, not the live scroll offset,
   * so repeated arrow clicks during a smooth scroll keep moving forward.
   */
  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const clamped = Math.min(Math.max(index, 0), LAST_INDEX);
    setActiveIndex(clamped);
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  };

  // Each slide is exactly one track width, so position maps to index directly.
  // Read it only once scrolling settles, to ignore intermediate offsets.
  const syncActiveIndexWhenSettled = () => {
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);

    settleTimerRef.current = window.setTimeout(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;

      const index = Math.round(track.scrollLeft / track.clientWidth);
      setActiveIndex(Math.min(Math.max(index, 0), LAST_INDEX));
    }, LANDING_SHOWCASE_SCROLL_SETTLE_MS);
  };

  const openZoom = (index: number, trigger: HTMLButtonElement) => {
    zoomTriggerRef.current = trigger;
    setZoomIndex(index);
  };

  const closeZoom = () => {
    setZoomIndex(null);
  };

  return (
    <section className="landing-showcase" aria-labelledby="showcase-heading">
      <div className="landing-section-header">
        <p className="landing-eyebrow">{LANDING_SHOWCASE_EYEBROW}</p>
        <h2 id="showcase-heading" className="landing-section-title">
          {LANDING_SHOWCASE_TITLE}
        </h2>
        <p className="landing-section-desc">{LANDING_SHOWCASE_DESC}</p>
      </div>

      <div
        className="landing-showcase-carousel"
        role="group"
        aria-roledescription="carousel"
        aria-label={LANDING_SHOWCASE_REGION_LABEL}
      >
        <div
          className="landing-showcase-track"
          ref={trackRef}
          onScroll={syncActiveIndexWhenSettled}
        >
          {LANDING_SHOWCASE_SLIDES.map((slide, index) => (
            <figure
              key={slide.src}
              className="landing-showcase-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${LANDING_SHOWCASE_SLIDES.length}`}
            >
              <button
                type="button"
                className="landing-showcase-frame"
                aria-label={`${LANDING_SHOWCASE_ZOOM_LABEL}: ${slide.title}`}
                onClick={(event) => openZoom(index, event.currentTarget)}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  width={LANDING_SHOWCASE_IMAGE_WIDTH}
                  height={LANDING_SHOWCASE_IMAGE_HEIGHT}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>
              <figcaption className="landing-showcase-caption">
                <span className="landing-showcase-caption-title">{slide.title}</span>
                <span className="landing-showcase-caption-body">{slide.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="landing-showcase-controls">
          <button
            type="button"
            className="landing-showcase-arrow"
            aria-label={LANDING_SHOWCASE_PREV_LABEL}
            disabled={activeIndex === 0}
            onClick={() => scrollToIndex(activeIndex - 1)}
          >
            <ChevronIcon direction="left" />
          </button>

          <div className="landing-showcase-dots">
            {LANDING_SHOWCASE_SLIDES.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                className={`landing-showcase-dot ${
                  index === activeIndex ? "landing-showcase-dot-active" : ""
                }`}
                aria-label={`${LANDING_SHOWCASE_JUMP_LABEL_PREFIX} ${index + 1}`}
                aria-current={index === activeIndex ? true : undefined}
                onClick={() => scrollToIndex(index)}
              />
            ))}
          </div>

          <button
            type="button"
            className="landing-showcase-arrow"
            aria-label={LANDING_SHOWCASE_NEXT_LABEL}
            disabled={activeIndex === LAST_INDEX}
            onClick={() => scrollToIndex(activeIndex + 1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>

      {isZoomed && zoomedSlide !== null
        ? createPortal(
            <div
              className="landing-showcase-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={LANDING_SHOWCASE_ZOOM_DIALOG_LABEL}
              aria-describedby={titleId}
              ref={dialogRef}
              tabIndex={-1}
            >
              <button
                type="button"
                className="landing-showcase-lightbox-backdrop"
                aria-label={LANDING_SHOWCASE_ZOOM_CLOSE_LABEL}
                onClick={closeZoom}
              />

              <div className="landing-showcase-lightbox-shell">
                <div className="landing-showcase-lightbox-stage">
                  <button
                    type="button"
                    className="landing-showcase-arrow landing-showcase-lightbox-arrow"
                    aria-label={LANDING_SHOWCASE_PREV_LABEL}
                    disabled={zoomIndex === 0}
                    onClick={() =>
                      setZoomIndex((current) => (current === null ? current : current - 1))
                    }
                  >
                    <ChevronIcon direction="left" />
                  </button>

                  <img
                    className="landing-showcase-lightbox-image"
                    src={zoomedSlide.src}
                    alt={zoomedSlide.alt}
                    width={LANDING_SHOWCASE_IMAGE_WIDTH}
                    height={LANDING_SHOWCASE_IMAGE_HEIGHT}
                    decoding="async"
                    draggable={false}
                  />

                  <button
                    type="button"
                    className="landing-showcase-arrow landing-showcase-lightbox-arrow"
                    aria-label={LANDING_SHOWCASE_NEXT_LABEL}
                    disabled={zoomIndex === LAST_INDEX}
                    onClick={() =>
                      setZoomIndex((current) => (current === null ? current : current + 1))
                    }
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>

                <div className="landing-showcase-lightbox-caption">
                  <p id={titleId} className="landing-showcase-lightbox-title">
                    {zoomedSlide.title}
                  </p>
                  <p className="landing-showcase-lightbox-caption-body">{zoomedSlide.caption}</p>
                  <p className="landing-showcase-lightbox-hint">{LANDING_SHOWCASE_ZOOM_HINT}</p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

/** Chevron used by the carousel arrow controls. */
function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="landing-showcase-arrow-icon">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
