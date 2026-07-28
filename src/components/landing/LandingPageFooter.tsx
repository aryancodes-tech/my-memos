import {
  LANDING_FOOTER_PRIVACY_LABEL,
  LANDING_FOOTER_TAGLINE,
  PRIVACY_POLICY_PATH,
  PRODUCT_NAME,
} from "@/lib/constants";

/** Shared marketing footer used on the homepage and legal pages. */
export function LandingPageFooter() {
  return (
    <footer className="landing-page-footer">
      <a href="/" className="landing-page-footer-brand">
        {PRODUCT_NAME}
      </a>
      <span className="landing-page-footer-sep" aria-hidden>
        ·
      </span>
      <span className="landing-page-footer-copy">{LANDING_FOOTER_TAGLINE}</span>
      <span className="landing-page-footer-sep" aria-hidden>
        ·
      </span>
      <a href={PRIVACY_POLICY_PATH} className="landing-page-footer-link">
        {LANDING_FOOTER_PRIVACY_LABEL}
      </a>
    </footer>
  );
}
