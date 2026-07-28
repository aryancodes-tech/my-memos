import { useStore, selectDashboardRecentPages } from "@/store/useStore";
import { PageIcon } from "@/components/PageIcon";
import {
  CONTENT_MAX_WIDTH_PX,
  PAGE_CONTENT_PADDING_X_PX,
  PAGE_CONTENT_PADDING_TOP_PX,
  PRODUCT_TOUR_TARGETS,
} from "@/lib/constants";
import { FileText, Folder, ChevronRight, Plus } from "lucide-react";
import { useMemo } from "react";
import type { Page } from "@/storage/types";

/** Formats a page updated timestamp for the dashboard recent list. */
function formatRecentActivity(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Edited just now";
  if (minutes < 60) return `Edited ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Edited ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Edited ${days}d ago`;

  return `Edited ${new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

export default function Dashboard() {
  const { pages, createPage, createDirectory, setView } = useStore();
  const recent = useMemo(() => selectDashboardRecentPages(pages), [pages]);

  return (
    <div
      className="ko-dashboard mx-auto pb-16"
      style={{
        maxWidth: CONTENT_MAX_WIDTH_PX,
        paddingLeft: PAGE_CONTENT_PADDING_X_PX,
        paddingRight: PAGE_CONTENT_PADDING_X_PX,
        paddingTop: PAGE_CONTENT_PADDING_TOP_PX,
      }}
    >
      <header className="ko-dashboard-header">
        <h1 className="ko-dashboard-title">Good to see you.</h1>
        <p className="ko-dashboard-subtitle">
          Your knowledge dashboard. Hit ⌘K to search anything.
        </p>
      </header>

      <CreateWorkspaceCta
        onCreatePage={() => void createPage()}
        onCreateFolder={() => void createDirectory()}
      />

      <section className="ko-dashboard-recent" aria-labelledby="ko-dashboard-recent-title">
        <div className="ko-dashboard-recent-header">
          <h2 id="ko-dashboard-recent-title" className="ko-dashboard-recent-title">
            Recent
          </h2>
          {recent.length > 0 && <span className="ko-dashboard-recent-count">{recent.length}</span>}
        </div>

        {recent.length === 0 ? (
          <div className="ko-dashboard-recent-empty">
            <p>Pages you open or edit will show up here, newest first.</p>
          </div>
        ) : (
          <ul className="ko-dashboard-recent-list">
            {recent.map((page) => (
              <RecentPageRow
                key={page.id}
                page={page}
                onOpen={() => setView({ kind: "page", id: page.id })}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface CreateWorkspaceCtaProps {
  onCreatePage: () => void;
  onCreateFolder: () => void;
}

/** Large dotted CTA for creating a new page or folder. */
function CreateWorkspaceCta({ onCreatePage, onCreateFolder }: CreateWorkspaceCtaProps) {
  return (
    <div className="ko-dashboard-create">
      <button
        type="button"
        className="ko-dashboard-create-action"
        data-tour-target={PRODUCT_TOUR_TARGETS.createPage}
        onClick={onCreatePage}
      >
        <span className="ko-dashboard-create-icon" aria-hidden>
          <FileText size={18} strokeWidth={1.75} />
        </span>
        <span className="ko-dashboard-create-copy">
          <span className="ko-dashboard-create-label">New page</span>
          <span className="ko-dashboard-create-hint">Start writing from scratch</span>
        </span>
        <Plus size={16} strokeWidth={1.75} className="ko-dashboard-create-plus" />
      </button>

      <button type="button" className="ko-dashboard-create-action" onClick={onCreateFolder}>
        <span className="ko-dashboard-create-icon" aria-hidden>
          <Folder size={18} strokeWidth={1.75} />
        </span>
        <span className="ko-dashboard-create-copy">
          <span className="ko-dashboard-create-label">New folder</span>
          <span className="ko-dashboard-create-hint">Organize pages in the sidebar</span>
        </span>
        <Plus size={16} strokeWidth={1.75} className="ko-dashboard-create-plus" />
      </button>
    </div>
  );
}

interface RecentPageRowProps {
  page: Page;
  onOpen: () => void;
}

/** Clickable row for a recently visited page. */
function RecentPageRow({ page, onOpen }: RecentPageRowProps) {
  return (
    <li>
      <button type="button" className="ko-dashboard-recent-row" onClick={onOpen}>
        <span className="ko-dashboard-recent-row-icon" aria-hidden>
          <PageIcon kind={page.kind} size={16} />
        </span>
        <span className="ko-dashboard-recent-row-title">{page.title || "Untitled"}</span>
        <span className="ko-dashboard-recent-row-meta">
          {formatRecentActivity(page.updated_at)}
        </span>
        <ChevronRight size={15} strokeWidth={1.75} className="ko-dashboard-recent-row-chevron" />
      </button>
    </li>
  );
}
