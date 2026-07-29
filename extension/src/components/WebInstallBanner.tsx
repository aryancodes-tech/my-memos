import { useState } from "react";
import { X } from "lucide-react";
import { WEB_INSTALL_BANNER_DISMISS_KEY, EXTENSION_INSTALL_PAGE_URL } from "@/lib/constants";
import { isWebAppContext } from "@/lib/platform";

/** Dismissible banner shown only in the standalone web app build. */
export default function WebInstallBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(WEB_INSTALL_BANNER_DISMISS_KEY) === "1";
  });

  if (!isWebAppContext() || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(WEB_INSTALL_BANNER_DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="ko-web-banner shrink-0 flex items-center justify-between gap-3 px-4 py-2 text-sm border-b"
      style={{
        borderColor: "var(--ko-border)",
        background: "var(--ko-surface)",
        color: "var(--ko-text)",
      }}
      role="status"
    >
      <p className="min-w-0">
        <span className="font-medium">Live demo.</span>{" "}
        <span className="text-[var(--ko-text-muted)]">
          You are viewing the live demo. Notes stay in this browser only and are separate from the
          installed extension.
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={EXTENSION_INSTALL_PAGE_URL}
          className="rounded-md px-3 py-1.5 text-xs font-medium hover:opacity-90"
          style={{ background: "var(--ko-text)", color: "var(--ko-bg)" }}
        >
          Install extension
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="rounded p-1 text-[var(--ko-text-muted)] hover:bg-[var(--ko-surface-2)]"
          aria-label="Dismiss web app banner"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
