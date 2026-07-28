import { createFileRoute, Link } from "@tanstack/react-router";

import { LandingNav } from "@/components/landing/LandingNav";
import { LandingPageFooter } from "@/components/landing/LandingPageFooter";
import { PrivacyPolicyContent } from "@/components/landing/PrivacyPolicyContent";
import {
  LANDING_HERO_SHELL_PADDING_TOP_REM,
  PRIVACY_PAGE_HEADING,
  PRODUCT_NAME,
} from "@/lib/constants";
import { buildPrivacyLinkTags, buildPrivacyMetaTags, resolveSiteOrigin } from "@/lib/seo";
import { getSeoRequestOrigin } from "@/lib/seoRequestOrigin";

export const Route = createFileRoute("/privacy")({
  loader: async () => ({
    requestOrigin: await getSeoRequestOrigin(),
  }),
  head: ({ loaderData }) => {
    const origin = resolveSiteOrigin(loaderData?.requestOrigin);
    return {
      meta: buildPrivacyMetaTags(origin),
      links: buildPrivacyLinkTags(origin),
    };
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div
      className="landing-page landing-legal-page"
      style={{
        ["--landing-hero-padding-top" as string]: `${LANDING_HERO_SHELL_PADDING_TOP_REM}rem`,
      }}
    >
      <LandingNav />
      <main className="landing-legal-main">
        <p className="landing-eyebrow">Legal</p>
        <h1 className="landing-legal-title">{PRIVACY_PAGE_HEADING}</h1>
        <p className="landing-legal-lead">
          How {PRODUCT_NAME} handles data across the extension, live demo, and this site.
        </p>
        <PrivacyPolicyContent />
        <p className="landing-legal-back">
          <Link to="/">← Back to {PRODUCT_NAME}</Link>
        </p>
      </main>
      <LandingPageFooter />
    </div>
  );
}
