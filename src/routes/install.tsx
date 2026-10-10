import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { LandingChromeCta } from "@/components/landing/LandingChromeCta";
import { redirectAfterAnalyticsTrack } from "@/lib/analyticsHop";
import {
  ANALYTICS_EVENT_INSTALL_HOP,
  CHROME_WEB_STORE_URL,
  INSTALL_PAGE_HEADING,
  INSTALL_PAGE_LEAD,
  LANDING_HERO_SHELL_PADDING_TOP_REM,
  UNINSTALL_FEEDBACK_HOME_LABEL,
} from "@/lib/constants";
import { buildInstallLinkTags, buildInstallMetaTags, resolveSiteOrigin } from "@/lib/seo";
import { getSeoRequestOrigin } from "@/lib/seoRequestOrigin";

const hasChromeWebStoreUrl = CHROME_WEB_STORE_URL.length > 0;

export const Route = createFileRoute("/install")({
  loader: async () => ({
    requestOrigin: await getSeoRequestOrigin(),
  }),
  head: ({ loaderData }) => {
    const origin = resolveSiteOrigin(loaderData?.requestOrigin);
    return {
      meta: buildInstallMetaTags(),
      links: buildInstallLinkTags(origin),
    };
  },
  component: InstallPage,
});

/**
 * Analytics hop to the Chrome Web Store.
 * Renders briefly so Vercel Analytics can record `/install`, then redirects.
 */
function InstallPage() {
  useEffect(() => {
    if (!hasChromeWebStoreUrl) {
      return;
    }
    void redirectAfterAnalyticsTrack(ANALYTICS_EVENT_INSTALL_HOP, CHROME_WEB_STORE_URL);
  }, []);

  return (
    <div
      className="landing-page landing-legal-page"
      style={{
        ["--landing-hero-padding-top" as string]: `${LANDING_HERO_SHELL_PADDING_TOP_REM}rem`,
      }}
    >
      <main className="landing-legal-main">
        <p className="landing-eyebrow">Install</p>
        <h1 className="landing-legal-title">{INSTALL_PAGE_HEADING}</h1>
        <p className="landing-legal-lead">{INSTALL_PAGE_LEAD}</p>

        {hasChromeWebStoreUrl ? (
          <p className="landing-legal-back">
            <LandingChromeCta href={CHROME_WEB_STORE_URL} />
          </p>
        ) : (
          <p className="landing-legal-back">
            <Link to="/">{UNINSTALL_FEEDBACK_HOME_LABEL}</Link>
          </p>
        )}
      </main>
    </div>
  );
}
