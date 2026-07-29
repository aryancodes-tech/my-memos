import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { FeatureBentoGrid } from "@/components/landing/FeatureBentoGrid";
import { LandingDemoTour } from "@/components/landing/LandingDemoTour";
import { LandingGetStarted } from "@/components/landing/LandingGetStarted";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingPageFooter } from "@/components/landing/LandingPageFooter";
import { LandingShowcaseCarousel } from "@/components/landing/LandingShowcaseCarousel";
import { ScrollVideoShowcase } from "@/components/landing/ScrollVideoShowcase";
import { LANDING_HERO_SHELL_PADDING_TOP_REM, LANDING_MAIN_OVERLAP_VH } from "@/lib/constants";
import {
  buildLandingJsonLdScripts,
  buildLandingLinkTags,
  buildLandingMetaTags,
  resolveSiteOrigin,
} from "@/lib/seo";
import { getSeoRequestOrigin } from "@/lib/seoRequestOrigin";

export const Route = createFileRoute("/")({
  loader: async () => ({
    requestOrigin: await getSeoRequestOrigin(),
  }),
  head: ({ loaderData }) => {
    const origin = resolveSiteOrigin(loaderData?.requestOrigin);

    return {
      meta: buildLandingMetaTags(origin),
      links: buildLandingLinkTags(origin),
      scripts: buildLandingJsonLdScripts(origin),
    };
  },
  component: Index,
});

function Index() {
  const [navHidden, setNavHidden] = useState(false);

  return (
    <div
      className="landing-page"
      style={{
        ["--landing-hero-padding-top" as string]: `${LANDING_HERO_SHELL_PADDING_TOP_REM}rem`,
      }}
    >
      <LandingNav hidden={navHidden} />
      <LandingDemoTour />

      <ScrollVideoShowcase onVideoFullscreenChange={setNavHidden} hero={<LandingHero />} />

      <main className="landing-main" style={{ marginTop: `-${LANDING_MAIN_OVERLAP_VH}vh` }}>
        <FeatureBentoGrid />
        <LandingShowcaseCarousel />
        <LandingGetStarted />
      </main>

      <LandingPageFooter />
    </div>
  );
}
