import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { FeatureBentoGrid } from "@/components/landing/FeatureBentoGrid";
import { LandingGetStarted } from "@/components/landing/LandingGetStarted";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollVideoShowcase } from "@/components/landing/ScrollVideoShowcase";
import { EXTENSION_ZIP_FILENAME } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyMemos — Your knowledge, on every new tab" },
      {
        name: "description",
        content:
          "Notion-inspired personal knowledge management, study tracker and learning dashboard that replaces your New Tab page.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
    <div className="landing-page">
      <LandingNav onDownload={download} isDownloading={isDownloading} />

      <ScrollVideoShowcase
        hero={
          <LandingHero
            onDownload={download}
            isDownloading={isDownloading}
            downloadError={downloadError}
          />
        }
      />

      <main className="landing-main">
        <FeatureBentoGrid />
        <LandingGetStarted onDownload={download} isDownloading={isDownloading} />
      </main>
    </div>
  );
}
