import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { revokeAllAttachmentObjectUrls } from "@/lib/attachments/attachmentManager";
import Sidebar from "@/components/Sidebar";
import SearchPalette from "@/components/SearchPalette";
import ThemeDropdown from "@/components/ThemeDropdown";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import CustomThemeDialog from "@/components/CustomThemeDialog";
import LinkDialog from "@/components/LinkDialog";
import AttachmentDeleteDialog from "@/components/AttachmentDeleteDialog";
import EditorToolbar from "@/editor/EditorToolbar";
import MobileExperienceNotice from "@/components/MobileExperienceNotice";
import WebInstallBanner from "@/components/WebInstallBanner";
import { MOBILE_EXPERIENCE_MAX_WIDTH_PX } from "@/lib/constants";
import { isWebAppContext } from "@/lib/platform";
import { useMobileViewport } from "@/lib/useMobileViewport";
import Dashboard from "@/views/Dashboard";
import PageView from "@/views/PageView";

export default function App() {
  const { ready, init, view, setSearchOpen, searchOpen, pageEditor } = useStore();
  const isDemoWebApp = isWebAppContext();
  const isMobileViewport = useMobileViewport(MOBILE_EXPERIENCE_MAX_WIDTH_PX, isDemoWebApp);
  const showMobileNotice = isDemoWebApp && isMobileViewport;

  useEffect(() => {
    void init();
    return () => revokeAllAttachmentObjectUrls();
  }, [init]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === "Escape" && searchOpen) setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen]);

  if (showMobileNotice) {
    return (
      <div className="ko-mobile-notice-shell">
        <MobileExperienceNotice />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--ko-text-muted)]">
        Loading workspace…
      </div>
    );
  }

  const shellClass = isWebAppContext()
    ? "ko-demo-shell fixed inset-0 flex flex-col overflow-hidden"
    : "h-full flex flex-col";

  return (
    <div className={shellClass}>
      <WebInstallBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="ko-app-header shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 border-b"
            style={{ borderColor: "var(--ko-border)", background: "var(--ko-bg)" }}
          >
            <div aria-hidden />
            <div className="justify-self-center max-w-full overflow-x-auto overflow-y-hidden ko-scroll">
              {view.kind === "page" && pageEditor && <EditorToolbar editor={pageEditor} />}
            </div>
            <div className="justify-self-end shrink-0">
              <ThemeDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto ko-scroll">
            {view.kind === "dashboard" && <Dashboard />}
            {view.kind === "page" && <PageView id={view.id} />}
          </main>
        </div>
        <SearchPalette />
        <DeleteConfirmDialog />
        <LinkDialog />
        <AttachmentDeleteDialog />
        <CustomThemeDialog />
      </div>
    </div>
  );
}
