import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { FeatureBentoGrid } from "@/components/landing/FeatureBentoGrid";
import { LandingDemoTour } from "@/components/landing/LandingDemoTour";
import { LandingGetStarted } from "@/components/landing/LandingGetStarted";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollVideoShowcase } from "@/components/landing/ScrollVideoShowcase";
import {
  EXTENSION_ZIP_FILENAME,
  LANDING_HERO_SHELL_PADDING_TOP_REM,
  LANDING_MAIN_OVERLAP_VH,
} from "@/lib/constants";
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
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  const download = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const res = await fetch(`/${EXTENSION_ZIP_FILENAME}`);
      if (!res.ok)
        throw new Error(`Download failed (${res.status}). Run npm run package:extension first.`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = EXTENSION_ZIP_FILENAME;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="landing-page"
      style={{
        ["--landing-hero-padding-top" as string]: `${LANDING_HERO_SHELL_PADDING_TOP_REM}rem`,
      }}
    >
      <LandingNav hidden={navHidden} />
      <LandingDemoTour />

      <ScrollVideoShowcase
        onVideoFullscreenChange={setNavHidden}
        hero={
          <LandingHero
            onDownload={download}
            isDownloading={isDownloading}
            downloadError={downloadError}
          />
        }
      />

      <main className="landing-main" style={{ marginTop: `-${LANDING_MAIN_OVERLAP_VH}vh` }}>
        <FeatureBentoGrid />
        <LandingGetStarted onDownload={download} isDownloading={isDownloading} />
      </main>
    </div>
  );
}
