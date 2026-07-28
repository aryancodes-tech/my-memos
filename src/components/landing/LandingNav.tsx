import {
  GITHUB_REPO_URL,
  LANDING_GET_STARTED_SECTION_ID,
  LANDING_NAV_INSTALL_LINK_LABEL,
  LANDING_NAV_TAGLINE,
  PRODUCT_NAME,
} from "@/lib/constants";

type LandingNavProps = {
  /** When true, slides the nav off-screen (used during fullscreen launch video). */
  hidden?: boolean;
};

/** Fixed glass navigation bar for the landing page. */
export function LandingNav({ hidden = false }: LandingNavProps) {
  return (
    <nav
      className={`landing-nav ${hidden ? "landing-nav-hidden" : ""}`}
      aria-label="Main navigation"
      aria-hidden={hidden}
    >
      <div className="landing-nav-inner">
        <a href="/" className="landing-nav-brand">
          {/* <span className="landing-nav-logo" aria-hidden>
            M
          </span> */}
          <span className="landing-nav-brand-copy">
            <span className="landing-nav-brand-name">{PRODUCT_NAME}</span>
            <span className="landing-nav-brand-tagline">{LANDING_NAV_TAGLINE}</span>
          </span>
        </a>

        <div className="landing-nav-actions">
          <a href={`/#${LANDING_GET_STARTED_SECTION_ID}`} className="landing-nav-link">
            {LANDING_NAV_INSTALL_LINK_LABEL}
          </a>

          <a
            href={GITHUB_REPO_URL}
            className="landing-nav-github"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </nav>
  );
}

/** GitHub mark used in the landing navigation. */
function GitHubIcon() {
  return (
    <svg
      className="landing-nav-github-icon"
      viewBox="-1 -1 26 26"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.234 1.91 1.234 3.22 0 4.61-2.807 5.624-5.48 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
