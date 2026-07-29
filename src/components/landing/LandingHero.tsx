import {
  DEMO_PATH,
  LANDING_DEMO_TOUR_TARGET,
  LANDING_HERO_BADGE,
  LANDING_HERO_DEMO_CTA,
  LANDING_HERO_PILLS,
  LANDING_HERO_SUBTITLE,
  LANDING_HERO_TITLE_LINE_ONE,
  LANDING_HERO_TITLE_LINE_TWO,
} from "@/lib/constants";
import { LandingChromeCta } from "@/components/landing/LandingChromeCta";

/** Hero copy and CTAs rendered over the scroll video section. */
export function LandingHero() {
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
        <LandingChromeCta className="landing-btn-lg" />
        <a
          href={DEMO_PATH}
          className="landing-btn landing-btn-ghost landing-btn-lg"
          data-tour-target={LANDING_DEMO_TOUR_TARGET}
        >
          {LANDING_HERO_DEMO_CTA}
          <ArrowIcon />
        </a>
      </div>
    </div>
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
