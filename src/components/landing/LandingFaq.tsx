import { useState } from "react";

import {
  LANDING_FAQ_DESC,
  LANDING_FAQ_EYEBROW,
  LANDING_FAQ_SECTION_ID,
  LANDING_FAQ_TITLE,
} from "@/lib/constants";
import {
  LANDING_FAQ_ITEMS,
  type LandingFaqItem,
} from "@/lib/landingFaqContent";

export { LANDING_FAQ_ITEMS, type LandingFaqItem };

/** Renders a FAQ answer as plain text or with inline links. */
function LandingFaqAnswer({ item }: { item: LandingFaqItem }) {
  if (item.answerSegments === undefined || item.answerSegments.length === 0) {
    return <p>{item.answer}</p>;
  }

  return (
    <p>
      {item.answerSegments.map((segment, index) => {
        if (segment.type === "link") {
          return (
            <a
              key={`${segment.href}-${index}`}
              href={segment.href}
              className="landing-faq-link"
            >
              {segment.label}
            </a>
          );
        }

        return <span key={`text-${index}`}>{segment.text}</span>;
      })}
    </p>
  );
}

/** FAQ section with collapsible accordions for the landing page. */
export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id={LANDING_FAQ_SECTION_ID} className="landing-faq" aria-labelledby="faq-heading">
      <div className="landing-faq-header">
        <p className="landing-faq-eyebrow">{LANDING_FAQ_EYEBROW}</p>
        <h2 id="faq-heading" className="landing-faq-title">
          {LANDING_FAQ_TITLE}
        </h2>
        <p className="landing-faq-desc">{LANDING_FAQ_DESC}</p>
      </div>

      <div className="landing-faq-accordion">
        {LANDING_FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `landing-faq-panel-${index}`;
          const triggerId = `landing-faq-trigger-${index}`;

          return (
            <article key={item.question} className="landing-faq-item">
              <h3 className="landing-faq-question">
                <button
                  type="button"
                  id={triggerId}
                  className="landing-faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleItem(index)}
                >
                  <span>{item.question}</span>
                  <span className="landing-faq-icon" aria-hidden />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="landing-faq-panel"
                hidden={!isOpen}
              >
                <LandingFaqAnswer item={item} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
