import { useEffect, useRef } from "react";

import {
  MARKETING_HOME_PATH,
  MOBILE_EXPERIENCE_NOTICE_BODY,
  MOBILE_EXPERIENCE_NOTICE_CTA,
  MOBILE_EXPERIENCE_NOTICE_TITLE,
} from "@/lib/constants";

/** Modal warning shown on the live demo when opened on a small viewport. */
export default function MobileExperienceNotice() {
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    ctaRef.current?.focus();
  }, []);

  return (
    <div
      className="ko-dialog ko-mobile-notice-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ko-mobile-notice-title"
      aria-describedby="ko-mobile-notice-body"
    >
      <h2 id="ko-mobile-notice-title" className="ko-dialog-title">
        {MOBILE_EXPERIENCE_NOTICE_TITLE}
      </h2>

      <p id="ko-mobile-notice-body" className="ko-dialog-body">
        {MOBILE_EXPERIENCE_NOTICE_BODY}
      </p>

      <div className="ko-dialog-actions">
        <a
          ref={ctaRef}
          href={MARKETING_HOME_PATH}
          className="ko-dialog-btn-keep ko-mobile-notice-cta"
        >
          {MOBILE_EXPERIENCE_NOTICE_CTA}
        </a>
      </div>
    </div>
  );
}
