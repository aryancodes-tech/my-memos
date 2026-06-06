import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import Sidebar from "@/components/Sidebar";
import SearchPalette from "@/components/SearchPalette";
import ThemeDropdown from "@/components/ThemeDropdown";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import CustomThemeDialog from "@/components/CustomThemeDialog";
import LinkDialog from "@/components/LinkDialog";
import EditorToolbar from "@/editor/EditorToolbar";
import Dashboard from "@/views/Dashboard";
import PageView from "@/views/PageView";

export default function App() {
  const { ready, init, view, setSearchOpen, searchOpen, pageEditor } = useStore();

  useEffect(() => {
    void init();
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

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--ko-text-muted)]">
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="ko-app-header shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 border-b"
          style={{ borderColor: "var(--ko-border)", background: "var(--ko-bg)" }}
        >
          <div aria-hidden />
          <div className="justify-self-center max-w-full overflow-x-auto ko-scroll">
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
      <CustomThemeDialog />
    </div>
  );
}
