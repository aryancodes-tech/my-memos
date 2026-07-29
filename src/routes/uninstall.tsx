import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  LANDING_HERO_SHELL_PADDING_TOP_REM,
  UNINSTALL_FEEDBACK_CONTINUE_LABEL,
  UNINSTALL_FEEDBACK_FORM_URL,
  UNINSTALL_FEEDBACK_HOME_LABEL,
  UNINSTALL_FEEDBACK_REASONS,
  UNINSTALL_PAGE_HEADING,
  UNINSTALL_PAGE_LEAD,
} from "@/lib/constants";
import { buildUninstallLinkTags, buildUninstallMetaTags, resolveSiteOrigin } from "@/lib/seo";
import { getSeoRequestOrigin } from "@/lib/seoRequestOrigin";

const hasUninstallFormUrl = UNINSTALL_FEEDBACK_FORM_URL.length > 0;

export const Route = createFileRoute("/uninstall")({
  loader: async () => ({
    requestOrigin: await getSeoRequestOrigin(),
  }),
  beforeLoad: () => {
    if (hasUninstallFormUrl) {
      throw redirect({ href: UNINSTALL_FEEDBACK_FORM_URL });
    }
  },
  head: ({ loaderData }) => {
    const origin = resolveSiteOrigin(loaderData?.requestOrigin);
    return {
      meta: buildUninstallMetaTags(),
      links: buildUninstallLinkTags(origin),
    };
  },
  component: UninstallPage,
});

/**
 * Fallback when {@link UNINSTALL_FEEDBACK_FORM_URL} is unset.
 * Once the Google Form URL is configured, `beforeLoad` redirects there instead.
 */
function UninstallPage() {
  useEffect(() => {
    if (!hasUninstallFormUrl) {
      return;
    }
    window.location.replace(UNINSTALL_FEEDBACK_FORM_URL);
  }, []);

  return (
    <div
      className="landing-page landing-legal-page"
      style={{
        ["--landing-hero-padding-top" as string]: `${LANDING_HERO_SHELL_PADDING_TOP_REM}rem`,
      }}
    >
      <main className="landing-legal-main">
        <p className="landing-eyebrow">Feedback</p>
        <h1 className="landing-legal-title">{UNINSTALL_PAGE_HEADING}</h1>
        <p className="landing-legal-lead">{UNINSTALL_PAGE_LEAD}</p>

        {hasUninstallFormUrl ? (
          <p className="landing-legal-back">
            <a href={UNINSTALL_FEEDBACK_FORM_URL} className="landing-btn landing-btn-primary">
              {UNINSTALL_FEEDBACK_CONTINUE_LABEL}
            </a>
          </p>
        ) : (
          <>
            <ul className="landing-uninstall-reasons">
              {UNINSTALL_FEEDBACK_REASONS.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="landing-legal-back">
              <Link to="/">{UNINSTALL_FEEDBACK_HOME_LABEL}</Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
