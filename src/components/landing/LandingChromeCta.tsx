import { INSTALL_PATH, LANDING_INSTALL_CTA, LANDING_INSTALL_CTA_SUFFIX } from "@/lib/constants";
import { ChromeIcon } from "@/components/landing/ChromeIcon";

type LandingChromeCtaProps = {
  href?: string;
  className?: string;
};

/** Chrome Web Store install CTA with the Chrome mark and a supporting line. */
export function LandingChromeCta({ href = INSTALL_PATH, className = "" }: LandingChromeCtaProps) {
  const classes = ["landing-btn", "landing-btn-chrome", className].filter(
    (part) => part.length > 0,
  );

  return (
    <a href={href} className={classes.join(" ")}>
      <span className="landing-btn-chrome-mark" aria-hidden>
        <ChromeIcon className="landing-btn-chrome-icon" />
      </span>
      <span className="landing-btn-chrome-label">
        <span className="landing-btn-chrome-lead">{LANDING_INSTALL_CTA}</span>
        <span className="landing-btn-chrome-suffix">{LANDING_INSTALL_CTA_SUFFIX}</span>
      </span>
    </a>
  );
}
