import {
  DEMO_PATH,
  LANDING_GET_STARTED_DESC,
  LANDING_GET_STARTED_SECTION_ID,
  LANDING_FOOTER_TAGLINE,
  PRODUCT_NAME,
} from "@/lib/constants";
import { LandingFaq } from "@/components/landing/LandingFaq";

const INSTALL_STEPS: Array<{
  title: string;
  body: string;
  code?: string;
}> = [
  {
    title: "Download & unzip",
    body: "Grab the extension bundle and extract it to a folder on your machine.",
  },
  {
    title: "Open Chrome extensions",
    body: "Navigate to chrome://extensions in your browser.",
    code: "chrome://extensions",
  },
  {
    title: "Enable developer mode",
    body: "Toggle Developer mode in the top-right corner of the extensions page.",
  },
  {
    title: "Load unpacked",
    body: "Click Load unpacked and select the folder you extracted.",
  },
  {
    title: "Open a new tab",
    body: `${PRODUCT_NAME} replaces your New Tab - start writing immediately.`,
  },
];

type LandingGetStartedProps = {
  onDownload: () => void;
  isDownloading: boolean;
};

/**
 * Closing section: a compact install timeline and minimal page footer.
 * Replaces the previous separate install grid and CTA band.
 */
export function LandingGetStarted({ onDownload, isDownloading }: LandingGetStartedProps) {
  return (
    <section
      id={LANDING_GET_STARTED_SECTION_ID}
      className="landing-get-started"
      aria-labelledby="get-started-heading"
    >
      <div className="landing-get-started-panel">
        <div className="landing-get-started-intro">
          <p className="landing-eyebrow">Get started</p>
          <h2 id="get-started-heading" className="landing-section-title">
            Up and running in five steps
          </h2>
          <p className="landing-section-desc">{LANDING_GET_STARTED_DESC}</p>

          <div className="landing-get-started-actions">
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="landing-btn landing-btn-primary"
            >
              {isDownloading ? "Downloading…" : "Download extension"}
            </button>
            <a href={DEMO_PATH} className="landing-btn landing-btn-ghost">
              Try live demo
            </a>
          </div>
        </div>

        <ol className="landing-get-started-steps">
          {INSTALL_STEPS.map((step, index) => (
            <li key={step.title} className="landing-get-started-step">
              <div className="landing-get-started-step-rail" aria-hidden>
                <span className="landing-get-started-step-dot">{index + 1}</span>
              </div>
              <div className="landing-get-started-step-copy">
                <h3>{step.title}</h3>
                <p>
                  {"code" in step && step.code !== undefined && step.code.length > 0 ? (
                    <>
                      Navigate to <code className="landing-code">{step.code}</code> in your browser.
                    </>
                  ) : (
                    step.body
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <LandingFaq />

      <footer className="landing-page-footer">
        <span className="landing-page-footer-brand">{PRODUCT_NAME}</span>
        <span className="landing-page-footer-sep" aria-hidden>
          ·
        </span>
        <span className="landing-page-footer-copy">{LANDING_FOOTER_TAGLINE}</span>
      </footer>
    </section>
  );
}
