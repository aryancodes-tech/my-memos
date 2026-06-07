import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import {
  LANDING_LAUNCH_VIDEO_CAPTION,
  LANDING_LAUNCH_VIDEO_CHROME_LABEL,
  LANDING_LAUNCH_VIDEO_FULL_WIDTH_PERCENT,
  LANDING_LAUNCH_VIDEO_INITIAL_HEIGHT_PERCENT,
  LANDING_LAUNCH_VIDEO_INITIAL_TOP_PERCENT,
  LANDING_LAUNCH_VIDEO_INITIAL_WIDTH_PERCENT,
  LANDING_LAUNCH_VIDEO_HIDE_MAX_WIDTH_PX,
  LANDING_LAUNCH_VIDEO_POSTER,
  LANDING_LAUNCH_VIDEO_SRC,
  LANDING_VIDEO_EXPAND_END,
  LANDING_VIDEO_HOLD_END,
  LANDING_VIDEO_SCROLL_RUNWAY_VH,
} from "@/lib/constants";

type ScrollVideoShowcaseProps = {
  /** Hero content rendered in the top half before the video expands on scroll. */
  hero: ReactNode;
  /** Called when the launch video enters or leaves the fullscreen scroll phase. */
  onVideoFullscreenChange?: (isFullscreen: boolean) => void;
  /** Optional override for the launch video source URL. */
  videoSrc?: string;
  /** Optional override for the launch video poster image URL. */
  posterSrc?: string;
  /** Short label shown on the video placeholder before media is added. */
  label?: string;
};

/**
 * Linearly interpolates between two numeric values.
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Maps scroll progress (0–1) through expand → hold → shrink phases for the launch video frame.
 */
function getVideoFrameStyle(progress: number): CSSProperties {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const initialWidth = LANDING_LAUNCH_VIDEO_INITIAL_WIDTH_PERCENT;
  const initialTop = LANDING_LAUNCH_VIDEO_INITIAL_TOP_PERCENT;
  const initialHeight = LANDING_LAUNCH_VIDEO_INITIAL_HEIGHT_PERCENT;
  const fullWidth = LANDING_LAUNCH_VIDEO_FULL_WIDTH_PERCENT;

  let topPercent = initialTop;
  let heightPercent = initialHeight;
  let widthPercent = initialWidth;
  let borderRadius = 1.25;
  let shadowStrength = 0.08;

  if (clamped <= LANDING_VIDEO_EXPAND_END) {
    const t = clamped / LANDING_VIDEO_EXPAND_END;
    topPercent = lerp(initialTop, 0, t);
    heightPercent = lerp(initialHeight, 100, t);
    widthPercent = lerp(initialWidth, fullWidth, t);
    borderRadius = lerp(1.25, 0.5, t);
    shadowStrength = lerp(0.08, 0.04, t);
  } else if (clamped <= LANDING_VIDEO_HOLD_END) {
    topPercent = 0;
    heightPercent = 100;
    widthPercent = fullWidth;
    borderRadius = 0.5;
    shadowStrength = 0.04;
  } else {
    const t = (clamped - LANDING_VIDEO_HOLD_END) / (1 - LANDING_VIDEO_HOLD_END);
    topPercent = 0;
    heightPercent = lerp(100, initialHeight, t);
    widthPercent = lerp(fullWidth, initialWidth, t);
    borderRadius = lerp(0.5, 1.25, t);
    shadowStrength = lerp(0.04, 0.08, t);
  }

  return {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    width: `${widthPercent}%`,
    left: "50%",
    transform: "translateX(-50%)",
    borderRadius: `${borderRadius}rem`,
    ["--video-shadow-strength" as string]: String(shadowStrength),
  };
}

/**
 * Tracks vertical scroll progress (0–1) for an element whose height defines the scroll runway.
 */
function useScrollProgress(containerRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      const next = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      setProgress(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [containerRef]);

  return progress;
}

/**
 * Tracks whether the viewport is below the launch video hide breakpoint.
 */
function useIsMobileViewport(maxWidthPx: number) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [maxWidthPx]);

  return isMobile;
}

/**
 * Sticky scroll section: launch video starts in the bottom half of the viewport,
 * expands to fullscreen, then shrinks to the top half as the user keeps scrolling.
 */
export function ScrollVideoShowcase({
  hero,
  onVideoFullscreenChange,
  videoSrc = LANDING_LAUNCH_VIDEO_SRC,
  posterSrc = LANDING_LAUNCH_VIDEO_POSTER,
  label = "Product launch video",
}: ScrollVideoShowcaseProps) {
  const isMobileViewport = useIsMobileViewport(LANDING_LAUNCH_VIDEO_HIDE_MAX_WIDTH_PX);
  const runwayRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(runwayRef);
  const frameStyle = getVideoFrameStyle(progress);
  const isFullscreen = progress >= LANDING_VIDEO_EXPAND_END && progress < LANDING_VIDEO_HOLD_END;
  const showChrome = progress < LANDING_VIDEO_HOLD_END;
  const showCaption = isFullscreen;
  const isScrolling = progress > 0.01;
  const heroOpacity = isScrolling ? 0 : 1;
  const backdropOpacity = isScrolling ? Math.min(progress * 4, 1) : 0;

  useEffect(() => {
    onVideoFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onVideoFullscreenChange]);

  useEffect(() => {
    if (isMobileViewport) {
      onVideoFullscreenChange?.(false);
    }
  }, [isMobileViewport, onVideoFullscreenChange]);

  useEffect(() => {
    return () => {
      onVideoFullscreenChange?.(false);
    };
  }, [onVideoFullscreenChange]);

  if (isMobileViewport) {
    return (
      <section
        className="landing-video-runway landing-video-runway--mobile relative"
        aria-label="Product introduction"
      >
        <div className="landing-hero-overlay pointer-events-auto relative inset-x-0 top-0 z-10">
          <div className="landing-hero-shell">{hero}</div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={runwayRef}
      className="landing-video-runway relative"
      style={{ height: `${(1 + LANDING_VIDEO_SCROLL_RUNWAY_VH) * 100}vh` }}
      aria-label="Product launch video"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="landing-video-backdrop"
          style={{ opacity: backdropOpacity }}
          aria-hidden
        />

        <div
          className="landing-hero-overlay pointer-events-none absolute inset-x-0 top-0 z-10 h-1/2"
          style={{
            opacity: heroOpacity,
            visibility: isScrolling ? "hidden" : "visible",
          }}
          aria-hidden={isScrolling}
        >
          <div className={`landing-hero-shell ${isScrolling ? "pointer-events-none" : "pointer-events-auto"}`}>
            {hero}
          </div>
        </div>

        <div className="landing-video-frame" style={frameStyle}>
          <LaunchVideoFrame
            videoSrc={videoSrc}
            posterSrc={posterSrc}
            label={label}
            showCaption={showCaption}
            showChrome={showChrome}
          />
        </div>

        {isFullscreen && (
          <div className="landing-video-hold-hint pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center">
            <span className="landing-scroll-hint-pill">Keep scrolling to continue</span>
          </div>
        )}

        {progress > LANDING_VIDEO_HOLD_END && progress < 0.92 && (
          <div
            className="landing-video-scroll-hint pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center"
            style={{ opacity: Math.min((progress - LANDING_VIDEO_HOLD_END) / 0.12, 1) }}
          >
            <span className="landing-scroll-hint-pill">Keep scrolling - features below</span>
          </div>
        )}
      </div>
    </section>
  );
}

type LaunchVideoFrameProps = {
  videoSrc: string;
  posterSrc: string;
  label: string;
  showCaption: boolean;
  showChrome: boolean;
};

/** Renders the launch video or a cinematic placeholder when no media file is present yet. */
function LaunchVideoFrame({
  videoSrc,
  posterSrc,
  label,
  showCaption,
  showChrome,
}: LaunchVideoFrameProps) {
  const [mediaReady, setMediaReady] = useState(false);
  const hasVideoSrc = videoSrc.length > 0;

  return (
    <>
      {showChrome && (
        <div className="landing-video-chrome" aria-hidden>
          <span className="landing-video-chrome-dot" data-tone="red" />
          <span className="landing-video-chrome-dot" data-tone="yellow" />
          <span className="landing-video-chrome-dot" data-tone="green" />
          <span className="landing-video-chrome-url">{LANDING_LAUNCH_VIDEO_CHROME_LABEL}</span>
        </div>
      )}

      <div className="landing-video-inner">
        <div className="landing-video-media">
          {hasVideoSrc ? (
            <video
              className="landing-video-element"
              src={videoSrc}
              poster={posterSrc.length > 0 ? posterSrc : undefined}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setMediaReady(true)}
              onError={() => setMediaReady(false)}
            />
          ) : null}

          {!mediaReady && (
            <div className="landing-video-placeholder">
              <div className="landing-video-placeholder-mesh" aria-hidden />
              <div className="landing-video-placeholder-label">
                <div className="landing-video-play">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p>{label}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCaption && (
        <div className="landing-video-caption-strip">
          <p>{LANDING_LAUNCH_VIDEO_CAPTION}</p>
        </div>
      )}
    </>
  );
}
