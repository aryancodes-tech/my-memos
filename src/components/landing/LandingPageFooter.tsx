import {
  AUTHOR_SITE_URL,
  LANDING_FOOTER_AUTHOR_NAME,
  LANDING_FOOTER_BUILT_BY_CONNECTOR,
  LANDING_FOOTER_BUILT_BY_PREFIX,
  LANDING_FOOTER_DESCRIPTION,
  LANDING_FOOTER_HEART_GLYPH,
  LANDING_FOOTER_LINK_GROUPS,
  LANDING_FOOTER_NAV_LABEL,
  LANDING_FOOTER_RIGHTS_NOTICE,
  PRODUCT_NAME,
} from "@/lib/constants";

/** Shared marketing footer used on the homepage and legal pages. */
export function LandingPageFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-page-footer">
      <div className="landing-page-footer-inner">
        <div className="landing-page-footer-top">
          <div className="landing-page-footer-brand-col">
            <a href="/" className="landing-page-footer-brand">
              {PRODUCT_NAME}
            </a>

            <p className="landing-page-footer-desc">{LANDING_FOOTER_DESCRIPTION}</p>

            <p className="landing-page-footer-credit">
              {LANDING_FOOTER_BUILT_BY_PREFIX}{" "}
              <span className="landing-page-footer-heart" aria-hidden>
                {LANDING_FOOTER_HEART_GLYPH}
              </span>{" "}
              {LANDING_FOOTER_BUILT_BY_CONNECTOR}{" "}
              <a
                href={AUTHOR_SITE_URL}
                className="landing-page-footer-author"
                target="_blank"
                rel="noopener noreferrer"
              >
                {LANDING_FOOTER_AUTHOR_NAME}
              </a>
            </p>
          </div>

          <nav className="landing-page-footer-nav" aria-label={LANDING_FOOTER_NAV_LABEL}>
            {LANDING_FOOTER_LINK_GROUPS.map((group) => (
              <div key={group.title} className="landing-page-footer-group">
                <h2 className="landing-page-footer-group-title">{group.title}</h2>
                <ul className="landing-page-footer-list">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="landing-page-footer-link"
                        target={link.external === true ? "_blank" : undefined}
                        rel={link.external === true ? "noopener noreferrer" : undefined}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="landing-page-footer-bottom">
          <p className="landing-page-footer-copy">
            © {year} {PRODUCT_NAME}. {LANDING_FOOTER_RIGHTS_NOTICE}
          </p>
        </div>
      </div>
    </footer>
  );
}
