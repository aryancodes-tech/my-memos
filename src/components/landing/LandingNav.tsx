import { DEMO_PATH, PRODUCT_NAME } from "@/lib/constants";

type LandingNavProps = {
  onDownload: () => void;
  isDownloading: boolean;
};

/** Fixed glass navigation bar for the landing page. */
export function LandingNav({ onDownload, isDownloading }: LandingNavProps) {
  return (
    <nav className="landing-nav" aria-label="Main navigation">
      <div className="landing-nav-inner">
        <a href="/" className="landing-nav-brand">
          <span className="landing-nav-logo" aria-hidden>
            M
          </span>
          <span>{PRODUCT_NAME}</span>
        </a>

        <div className="landing-nav-actions">
          <a href={DEMO_PATH} className="landing-nav-link">
            Live demo
          </a>
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="landing-btn landing-btn-primary landing-btn-sm"
          >
            {isDownloading ? "Downloading…" : "Get extension"}
          </button>
        </div>
      </div>
    </nav>
  );
}