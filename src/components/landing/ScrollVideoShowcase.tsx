import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import {
  LANDING_LAUNCH_VIDEO_FULL_WIDTH_PERCENT,
  LANDING_LAUNCH_VIDEO_INITIAL_WIDTH_PERCENT,
  LANDING_LAUNCH_VIDEO_POSTER,
  LANDING_LAUNCH_VIDEO_SRC,
  LANDING_VIDEO_SCROLL_RUNWAY_VH,
} from "@/lib/constants";

/** Scroll progress thresholds for the launch video animation phases. */
const EXPAND_END = 0.38;
const HOLD_END = 0.55;

type ScrollVideoShowcaseProps = {
  /** Hero content rendered in the top half before the video expands on scroll. */
  hero: ReactNode;
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
  const fullWidth = LANDING_LAUNCH_VIDEO_FULL_WIDTH_PERCENT;

  let topPercent = 50;
  let heightPercent = 50;
  let widthPercent = initialWidth;
  let borderRadius = 1.25;
  let shadowStrength = 0.08;

  if (clamped <= EXPAND_END) {
    const t = clamped / EXPAND_END;
    topPercent = 50 * (1 - t);
    heightPercent = 50 + 50 * t;
    widthPercent = lerp(initialWidth, fullWidth, t);
    borderRadius = lerp(1.25, 0.5, t);
    shadowStrength = lerp(0.08, 0.04, t);
  } else if (clamped <= HOLD_END) {
    topPercent = 0;
    heightPercent = 100;
    widthPercent = fullWidth;
    borderRadius = 0.5;
    shadowStrength = 0.04;
  } else {
    const t = (clamped - HOLD_END) / (1 - HOLD_END);
    topPercent = 0;
    heightPercent = 100 - 50 * t;
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
 * Sticky scroll section: launch video starts in the bottom half of the viewport,
 * expands to fullscreen, then shrinks to the top half as the user keeps scrolling.
 */
export function ScrollVideoShowcase({
  hero,
  videoSrc = LANDING_LAUNCH_VIDEO_SRC,
  posterSrc = LANDING_LAUNCH_VIDEO_POSTER,
  label = "Product launch video",
}: ScrollVideoShowcaseProps) {
  const runwayRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(runwayRef);
  const frameStyle = getVideoFrameStyle(progress);
  const isFullscreen = progress > EXPAND_END && progress < HOLD_END;
  const showChrome = progress < HOLD_END;
  const heroOpacity = Math.max(1 - progress * 2.2, 0);
  const heroTranslate = progress * -28;

  return (
    <section
      ref={runwayRef}
      className="landing-video-runway relative"
      style={{ height: `${(1 + LANDING_VIDEO_SCROLL_RUNWAY_VH) * 100}vh` }}
      aria-label="Product launch video"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="landing-hero-overlay pointer-events-none absolute inset-x-0 top-0 z-10 flex h-1/2 items-center"
          style={{
            opacity: heroOpacity,
            transform: `translateY(${heroTranslate}px)`,
          }}
        >
          <div className="landing-hero-shell pointer-events-auto">{hero}</div>
        </div>

        <div className="landing-video-frame" style={frameStyle}>
          <LaunchVideoFrame
            videoSrc={videoSrc}
            posterSrc={posterSrc}
            label={label}
            isFullscreen={isFullscreen}
            showChrome={showChrome}
          />
        </div>

        {progress > HOLD_END && (
          <div
            className="landing-video-scroll-hint pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center"
            style={{ opacity: Math.min((progress - HOLD_END) / 0.15, 1) }}
          >
            <span className="landing-scroll-hint-pill">Keep scrolling — features below</span>
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
  isFullscreen: boolean;
  showChrome: boolean;
};

/** Renders the launch video or a cinematic placeholder when no media file is present yet. */
function LaunchVideoFrame({
  videoSrc,
  posterSrc,
  label,
  isFullscreen,
  showChrome,
}: LaunchVideoFrameProps) {
  const [mediaReady, setMediaReady] = useState(false);
  const hasVideoSrc = videoSrc.length > 0;

  return (
    <div className="landing-video-inner">
      {showChrome && (
        <div className="landing-video-chrome" aria-hidden>
          <span className="landing-video-chrome-dot" data-tone="red" />
          <span className="landing-video-chrome-dot" data-tone="yellow" />
          <span className="landing-video-chrome-dot" data-tone="green" />
          <span className="landing-video-chrome-url">mymemos — new tab</span>
        </div>
      )}

      <div className="landing-video-media">
        {hasVideoSrc ? (
          <video
            className="h-full w-full object-cover"
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
            <div className="landing-video-placeholder-ui" aria-hidden>
              <div className="landing-mock-sidebar">
                <div className="landing-mock-sidebar-line landing-mock-sidebar-line-accent" />
                <div className="landing-mock-sidebar-line" />
                <div className="landing-mock-sidebar-line" />
                <div className="landing-mock-sidebar-line landing-mock-sidebar-line-short" />
              </div>
              <div className="landing-mock-editor">
                <div className="landing-mock-editor-title" />
                <div className="landing-mock-editor-line" />
                <div className="landing-mock-editor-line landing-mock-editor-line-short" />
                <div className="landing-mock-editor-line" />
              </div>
            </div>
            <div className="landing-video-placeholder-label">
              <div className="landing-video-play">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p>{label}</p>
              <span>Add your video to {videoSrc || "/videos/launch.mp4"}</span>
            </div>
          </div>
        )}

        {isFullscreen && (
          <div className="landing-video-caption">
            <p>See MyMemos in action</p>
          </div>
        )}
      </div>
    </div>
  );
}
