import {
  DEMO_PATH,
  LANDING_HERO_BADGE,
  LANDING_HERO_PILLS,
  LANDING_HERO_SUBTITLE,
  LANDING_HERO_TITLE_LINE_ONE,
  LANDING_HERO_TITLE_LINE_TWO,
} from "@/lib/constants";

type LandingHeroProps = {
  onDownload: () => void;
  isDownloading: boolean;
  downloadError: string | null;
};

/** Hero copy and CTAs rendered over the scroll video section. */
export function LandingHero({ onDownload, isDownloading, downloadError }: LandingHeroProps) {
  return (
    <div className="landing-hero">
      <div className="landing-hero-badge">
        <span className="landing-hero-badge-dot" aria-hidden />
        {LANDING_HERO_BADGE}
      </div>

      <h1 className="landing-hero-title">
        {LANDING_HERO_TITLE_LINE_ONE}
        <br />
        {LANDING_HERO_TITLE_LINE_TWO}
      </h1>

      <p className="landing-hero-subtitle">{LANDING_HERO_SUBTITLE}</p>

      <div className="landing-hero-pills" role="list" aria-label="Product highlights">
        {LANDING_HERO_PILLS.map((pill) => (
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
          {isDownloading ? "Downloading…" : "Replace your New Tab"}
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
