import { DEMO_PATH, PRODUCT_NAME } from "@/lib/constants";

type LandingHeroProps = {
  onDownload: () => void;
  isDownloading: boolean;
  downloadError: string | null;
};

const HERO_PILLS = ["Local-first", "Offline-only", "Zero Backend", "7 themes", "⌘ K search"];

/** Hero copy and CTAs rendered over the scroll video section. */
export function LandingHero({ onDownload, isDownloading, downloadError }: LandingHeroProps) {
  return (
    <div className="landing-hero">
      {/* <div className="landing-hero-badge">
        <span className="landing-hero-badge-dot" aria-hidden />
        Chrome Extension · Manifest V3
      </div> */}

      <h1 className="landing-hero-title">
        Your knowledge,
        <br />
        on every new tab.
      </h1>

      <p className="landing-hero-subtitle">
        {PRODUCT_NAME} is a Notion-inspired workspace for learners - nested pages, slash
        commands, themes, and instant search. Everything stays on your device.
      </p>

      <div className="landing-hero-pills" role="list" aria-label="Product highlights">
        {HERO_PILLS.map((pill) => (
          <span key={pill} className="landing-hero-pill" role="listitem">
            {pill}
          </span>
        ))}
      </div>

      <div className="landing-hero-actions">
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="landing-btn landing-btn-primary landing-btn-lg"
        >
          <DownloadIcon />
          {isDownloading ? "Downloading…" : "Download extension"}
        </button>
        <a href={DEMO_PATH} className="landing-btn landing-btn-ghost landing-btn-lg">
          Try live demo
          <ArrowIcon />
        </a>
      </div>

      {downloadError !== null && downloadError.length > 0 && (
        <p className="landing-hero-error" role="alert">
          {downloadError}
        </p>
      )}

      <div className="landing-scroll-cue" aria-hidden>
        <span>Scroll to watch</span>
        <span className="landing-scroll-cue-line" />
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M10 3v9m0 0l3.5-3.5M10 12l-3.5-3.5M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M4 10h12m0 0l-4-4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
