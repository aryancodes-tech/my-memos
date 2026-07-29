import {
  DEMO_PATH,
  LANDING_GET_STARTED_DEMO_CTA,
  LANDING_GET_STARTED_DESC,
  LANDING_GET_STARTED_EYEBROW,
  LANDING_GET_STARTED_SECTION_ID,
  LANDING_GET_STARTED_TITLE,
  LANDING_LOCAL_SETUP_STEPS,
} from "@/lib/constants";
import { LandingChromeCta } from "@/components/landing/LandingChromeCta";
import { LandingFaq } from "@/components/landing/LandingFaq";

/** Local setup timeline, Chrome Web Store CTA, and FAQ. */
export function LandingGetStarted() {
  return (
    <section
      id={LANDING_GET_STARTED_SECTION_ID}
      className="landing-get-started"
      aria-labelledby="get-started-heading"
    >
      <div className="landing-get-started-panel">
        <div className="landing-get-started-intro">
          <p className="landing-eyebrow">{LANDING_GET_STARTED_EYEBROW}</p>
          <h2 id="get-started-heading" className="landing-section-title">
            {LANDING_GET_STARTED_TITLE}
          </h2>
          <p className="landing-section-desc">{LANDING_GET_STARTED_DESC}</p>

          <div className="landing-get-started-actions">
            <LandingChromeCta />
            <a href={DEMO_PATH} className="landing-btn landing-btn-ghost">
              {LANDING_GET_STARTED_DEMO_CTA}
            </a>
          </div>
        </div>

        <ol className="landing-get-started-steps">
          {LANDING_LOCAL_SETUP_STEPS.map((step, index) => (
            <li key={step.title} className="landing-get-started-step">
              <div className="landing-get-started-step-rail" aria-hidden>
                <span className="landing-get-started-step-dot">{index + 1}</span>
              </div>
              <div className="landing-get-started-step-copy">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <LandingFaq />
    </section>
  );
}
