import {
  useStore,
  selectFavoritePages,
  selectRecentPages,
  selectWorkspaceRoots,
  selectWorkspaceChildren,
} from "@/store/useStore";
import type { Page } from "@/storage/types";
import {
  DEFAULT_FOLDER_TITLE,
  PRODUCT_NAME,
  SEARCH_SHORTCUT_LABEL,
  SIDEBAR_ADD_INSIDE_LABEL,
  SIDEBAR_ADD_NEW_ARIA_LABEL,
  SIDEBAR_ADD_TO_FAVORITES_LABEL,
  SIDEBAR_COLLAPSE_LABEL,
  SIDEBAR_DASHBOARD_LABEL,
  SIDEBAR_EXPAND_LABEL,
  SIDEBAR_FOLDER_TOGGLE_COLLAPSE,
  SIDEBAR_FOLDER_TOGGLE_EXPAND,
  SIDEBAR_INDENT_PX,
  SIDEBAR_MENU_MIN_WIDTH_PX,
  SIDEBAR_NEW_FOLDER_LABEL,
  SIDEBAR_RECENT_SHOW_LESS_LABEL,
  SIDEBAR_RECENT_SHOW_MORE_LABEL,
  SIDEBAR_RECENT_VISIBLE_LIMIT,
  SIDEBAR_REMOVE_FROM_FAVORITES_LABEL,
  SIDEBAR_WIDTH_PX,
  WORKSPACE_SECTION,
} from "@/lib/constants";
import { len } from "@/lib/text";
import {
  canDropOntoFolder,
  canDropOntoPage,
  canMoveWorkspaceItem,
  resolveFolderDropParentId,
} from "@/lib/workspaceTree";
import {
  resolveDragPageId,
  scheduleWorkspaceDragCleanup,
  startWorkspaceRowDrag,
  useWorkspaceDrag,
  type WorkspaceDragProps,
} from "@/lib/workspaceDrag";
import { PageIcon } from "@/components/PageIcon";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export default function Sidebar() {
  const { pages, sidebarCollapsed, toggleSidebar, view, setView, setSearchOpen } = useStore();
  const workspaceDrag = useWorkspaceDrag();

  const favorites = useMemo(() => selectFavoritePages(pages), [pages]);
  const recent = useMemo(() => selectRecentPages(pages), [pages]);
  const workspaceRoots = useMemo(() => selectWorkspaceRoots(pages), [pages]);

  if (sidebarCollapsed) {
    return (
      <aside className="ko-sidebar w-11 shrink-0 border-r flex flex-col items-center py-3 gap-1">
        <IconRailButton title={SIDEBAR_EXPAND_LABEL} onClick={toggleSidebar}>
          <ChevronRight size={16} strokeWidth={1.75} />
        </IconRailButton>
        <IconRailButton
          title={`Search (${SEARCH_SHORTCUT_LABEL})`}
          onClick={() => setSearchOpen(true)}
        >
          <Search size={16} strokeWidth={1.75} />
        </IconRailButton>
        <IconRailButton
          title={SIDEBAR_DASHBOARD_LABEL}
          onClick={() => setView({ kind: "dashboard" })}
        >
          <LayoutDashboard size={16} strokeWidth={1.75} />
        </IconRailButton>
      </aside>
    );
  }

  return (
    <aside
      className="ko-sidebar shrink-0 border-r flex flex-col"
      style={{
        width: SIDEBAR_WIDTH_PX,
        ["--ko-sidebar-menu-min-width" as string]: `${SIDEBAR_MENU_MIN_WIDTH_PX}px`,
      }}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <div className="text-sm font-semibold tracking-tight text-[var(--ko-text)]">
          {PRODUCT_NAME}
        </div>
        <IconRailButton title={SIDEBAR_COLLAPSE_LABEL} onClick={toggleSidebar}>
          <ChevronLeft size={16} strokeWidth={1.75} />
        </IconRailButton>
      </div>

      <div className="px-1.5 space-y-0.5 shrink-0">
        <NavItem
          icon={<Search size={15} strokeWidth={1.75} />}
          label="Search"
          shortcut={SEARCH_SHORTCUT_LABEL}
          onClick={() => setSearchOpen(true)}
        />
        <NavItem
          icon={<LayoutDashboard size={15} strokeWidth={1.75} />}
          label="Dashboard"
          active={view.kind === "dashboard"}
          onClick={() => setView({ kind: "dashboard" })}
        />
      </div>

      <div className="ko-sidebar-scroll ko-scroll flex-1 min-h-0">
        <Section title="Favorites">
          {favorites.length === 0 ? (
            <p className="ko-sidebar-empty">Star a page to add it here.</p>
          ) : (
            favorites.map((page) => <PageRow key={page.id} page={page} menuVariant="favorites" />)
          )}
        </Section>

        <RecentSection pages={recent} />

        <WorkspaceSection action={<WorkspaceAddButton />}>
          {workspaceRoots.map((item) => (
            <WorkspaceTreeItem key={item.id} item={item} depth={0} workspaceDrag={workspaceDrag} />
          ))}
        </WorkspaceSection>
      </div>
    </aside>
  );
}

function IconRailButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className="ko-icon-btn !p-1.5 text-[var(--ko-text-muted)]"
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function NavItem({
  icon,
  label,
  shortcut,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  /** Keyboard shortcut hint shown on the right (e.g. ⌘ K). */
  shortcut?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className={`ko-sidebar-row w-full ${active ? "is-active" : ""}`}>
      <span className="text-[var(--ko-text-muted)]">{icon}</span>
      <span className="flex-1 min-w-0 truncate text-left">{label}</span>
      {shortcut && len(shortcut) > 0 && <span className="ko-sidebar-shortcut">{shortcut}</span>}
    </button>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="ko-sidebar-section-header">
        <div className="ko-sidebar-section-title">{title}</div>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/** Recent pages with a collapsed default view and optional show-more control. */
function RecentSection({ pages }: { pages: Page[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = pages.length > SIDEBAR_RECENT_VISIBLE_LIMIT;
  const visiblePages = expanded ? pages : pages.slice(0, SIDEBAR_RECENT_VISIBLE_LIMIT);

  return (
    <Section title="Recent">
      {pages.length === 0 ? (
        <p className="ko-sidebar-empty">Recently opened pages appear here.</p>
      ) : (
        <>
          {visiblePages.map((page) => (
            <PageRow key={page.id} page={page} menuVariant="recent" />
          ))}
          {hasOverflow && (
            <button
              type="button"
              className="ko-sidebar-show-more"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? SIDEBAR_RECENT_SHOW_LESS_LABEL : SIDEBAR_RECENT_SHOW_MORE_LABEL}
            </button>
          )}
        </>
      )}
    </Section>
  );
}

/** Pages section containing the workspace tree. */
function WorkspaceSection({ action, children }: { action: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-5 first:mt-0 ko-workspace-section">
      <div className="ko-sidebar-section-header">
        <div className="ko-sidebar-section-title">{WORKSPACE_SECTION}</div>
        {action}
      </div>
      <div className="ko-workspace-tree">{children}</div>
    </div>
  );
}

/** Permanent add control beside the Pages section title. */
function WorkspaceAddButton() {
  const { createPage, createDirectory } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="ko-sidebar-section-action relative" ref={ref}>
      <button
        type="button"
        className="ko-icon-btn !p-1"
        title="Add new"
        aria-label={SIDEBAR_ADD_NEW_ARIA_LABEL}
        onClick={() => setOpen((value) => !value)}
      >
        <Plus size={13} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="ko-sidebar-menu">
          <MenuItem
            icon={<FileText size={14} strokeWidth={1.75} />}
            label="New page"
            onClick={() => {
              void createPage();
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Folder size={14} strokeWidth={1.75} />}
            label={SIDEBAR_NEW_FOLDER_LABEL}
            onClick={() => {
              void createDirectory();
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function WorkspaceTreeItem({
  item,
  depth,
  workspaceDrag,
}: {
  item: Page;
  depth: number;
  workspaceDrag: WorkspaceDragProps;
}) {
  const { pages, collapsedDirs, toggleDirectory } = useStore();
  const children = useMemo(() => selectWorkspaceChildren(pages, item.id), [pages, item.id]);
  const isCollapsed = collapsedDirs[item.id] === true;

  if (item.kind === "directory") {
    return (
      <div>
        <DirectoryRow
          item={item}
          depth={depth}
          expanded={!isCollapsed}
          childCount={children.length}
          workspaceDrag={workspaceDrag}
          onToggle={() => toggleDirectory(item.id)}
        />
        {!isCollapsed &&
          children.map((child) => (
            <WorkspaceTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              workspaceDrag={workspaceDrag}
            />
          ))}
      </div>
    );
  }

  return (
    <PageRow page={item} depth={depth} menuVariant="workspace" workspaceDrag={workspaceDrag} />
  );
}

function DirectoryRow({
  item,
  depth,
  expanded,
  childCount,
  onToggle,
  workspaceDrag,
}: {
  item: Page;
  depth: number;
  expanded: boolean;
  childCount: number;
  onToggle: () => void;
  workspaceDrag: WorkspaceDragProps;
}) {
  const { pages, updatePage, requestDelete, createPage, createDirectory, moveWorkspaceItem } =
    useStore();
  const { dragPageId, dragPageIdRef, beginWorkspaceDrag, endWorkspaceDrag, finishWorkspaceDrag } =
    workspaceDrag;
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => {
    setMenuOpen(false);
    setAddOpen(false);
  });

  return (
    <div
      ref={ref}
      className={`ko-sidebar-row group relative ${dropTarget ? "is-drop-target" : ""} ${dragPageId === item.id ? "is-dragging" : ""}`}
      style={{ paddingLeft: `${depth * SIDEBAR_INDENT_PX + 6}px` }}
      draggable={!editing}
      onDragStart={(event) => startWorkspaceRowDrag(event, item.id, beginWorkspaceDrag)}
      onDragEnd={() => {
        endWorkspaceDrag();
        setDropTarget(false);
        scheduleWorkspaceDragCleanup(finishWorkspaceDrag, dragPageIdRef);
      }}
      onDragOver={(event) => {
        const draggedId = dragPageIdRef.current;
        if (len(draggedId ?? "") === 0 || !canDropOntoFolder(pages, draggedId!, item)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        setDropTarget(true);
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const pageId = resolveDragPageId(event, dragPageId, dragPageIdRef);
        const targetParentId = resolveFolderDropParentId(pages, pageId, item);
        if (len(pageId) === 0 || !canMoveWorkspaceItem(pages, pageId, targetParentId)) {
          setDropTarget(false);
          return;
        }
        void moveWorkspaceItem(pageId, targetParentId);
        finishWorkspaceDrag();
        setDropTarget(false);
      }}
    >
      <button
        className="ko-sidebar-chevron"
        draggable={false}
        title={expanded ? SIDEBAR_FOLDER_TOGGLE_COLLAPSE : SIDEBAR_FOLDER_TOGGLE_EXPAND}
        onClick={onToggle}
      >
        <ChevronRight
          size={13}
          strokeWidth={1.75}
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>
      <PageIcon kind="directory" expanded={expanded} size={15} />
      {editing ? (
        <input
          autoFocus
          value={item.title}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") setEditing(false);
          }}
          onChange={(e) => void updatePage(item.id, { title: e.target.value })}
          className="ko-sidebar-row-label"
          placeholder={DEFAULT_FOLDER_TITLE}
        />
      ) : (
        <div
          className="ko-sidebar-row-label cursor-pointer"
          onDoubleClick={() => setEditing(true)}
          onClick={onToggle}
        >
          {item.title || DEFAULT_FOLDER_TITLE}
        </div>
      )}
      <div className="ko-sidebar-row-actions">
        <div className="relative">
          <button
            className="ko-icon-btn !p-1"
            title={SIDEBAR_ADD_INSIDE_LABEL}
            onClick={() => {
              setAddOpen((value) => !value);
              setMenuOpen(false);
            }}
          >
            <Plus size={13} strokeWidth={1.75} />
          </button>
          {addOpen && (
            <div className="ko-sidebar-menu">
              <MenuItem
                icon={<FileText size={14} strokeWidth={1.75} />}
                label="New page"
                onClick={() => {
                  void createPage(item.id);
                  setAddOpen(false);
                }}
              />
              <MenuItem
                icon={<Folder size={14} strokeWidth={1.75} />}
                label={SIDEBAR_NEW_FOLDER_LABEL}
                onClick={() => {
                  void createDirectory(item.id);
                  setAddOpen(false);
                }}
              />
            </div>
          )}
        </div>
        <div className="relative">
          <button
            className="ko-icon-btn !p-1"
            title="More"
            onClick={() => {
              setMenuOpen((value) => !value);
              setAddOpen(false);
            }}
          >
            <MoreHorizontal size={13} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div className="ko-sidebar-menu">
              <MenuItem
                icon={<Pencil size={14} strokeWidth={1.75} />}
                label="Rename"
                onClick={() => {
                  setEditing(true);
                  setMenuOpen(false);
                }}
              />
              <MenuItem
                icon={<Trash2 size={14} strokeWidth={1.75} />}
                label="Delete"
                danger
                onClick={() => {
                  setMenuOpen(false);
                  requestDelete(item.id, childCount);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageRow({
  page,
  depth = 0,
  menuVariant = "none",
  workspaceDrag,
}: {
  page: Page;
  depth?: number;
  menuVariant?: "none" | "favorites" | "recent" | "workspace";
  workspaceDrag?: WorkspaceDragProps;
}) {
  const { pages, setView, view, updatePage, requestDelete, moveWorkspaceItem } = useStore();
  const active = view.kind === "page" && view.id === page.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasMenu = menuVariant !== "none";
  const isWorkspace = menuVariant === "workspace";
  const dragPageId = workspaceDrag?.dragPageId ?? null;
  const dragPageIdRef = workspaceDrag?.dragPageIdRef ?? { current: null };

  useClickOutside(ref, () => setMenuOpen(false));

  return (
    <div
      ref={ref}
      className={`ko-sidebar-row group relative ${active ? "is-active" : ""} ${dropTarget ? "is-drop-target" : ""} ${dragPageId === page.id ? "is-dragging" : ""}`}
      style={{ paddingLeft: `${depth * SIDEBAR_INDENT_PX + (depth > 0 ? 24 : 6)}px` }}
      draggable={isWorkspace && !menuOpen}
      onDragStart={
        isWorkspace && workspaceDrag
          ? (event) => startWorkspaceRowDrag(event, page.id, workspaceDrag.beginWorkspaceDrag)
          : undefined
      }
      onDragEnd={
        isWorkspace && workspaceDrag
          ? () => {
              workspaceDrag.endWorkspaceDrag();
              setDropTarget(false);
              scheduleWorkspaceDragCleanup(
                workspaceDrag.finishWorkspaceDrag,
                workspaceDrag.dragPageIdRef,
              );
            }
          : undefined
      }
      onDragOver={
        isWorkspace
          ? (event) => {
              const draggedId = dragPageIdRef.current;
              if (len(draggedId ?? "") === 0 || !canDropOntoPage(pages, draggedId!, page)) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "move";
              setDropTarget(true);
            }
          : undefined
      }
      onDragLeave={isWorkspace ? () => setDropTarget(false) : undefined}
      onDrop={
        isWorkspace
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              const pageId = resolveDragPageId(event, dragPageId, dragPageIdRef);
              if (len(pageId) === 0 || !canDropOntoPage(pages, pageId, page)) {
                setDropTarget(false);
                return;
              }
              void moveWorkspaceItem(pageId, page.parent_id);
              workspaceDrag?.finishWorkspaceDrag();
              setDropTarget(false);
            }
          : undefined
      }
    >
      <div
        className="flex flex-1 min-w-0 items-center gap-2 text-left cursor-pointer"
        onClick={() => setView({ kind: "page", id: page.id })}
      >
        <PageIcon kind="page" size={15} />
        <span className="ko-sidebar-row-label">{page.title || "Untitled"}</span>
      </div>
      {hasMenu && (
        <div className="ko-sidebar-row-actions">
          <div className="relative">
            <button
              className="ko-icon-btn !p-1"
              title="More"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <MoreHorizontal size={13} strokeWidth={1.75} />
            </button>
            {menuOpen && (
              <div className="ko-sidebar-menu">
                {(menuVariant === "recent" || menuVariant === "workspace") && !page.favorite && (
                  <MenuItem
                    icon={<Star size={14} strokeWidth={1.75} />}
                    label={SIDEBAR_ADD_TO_FAVORITES_LABEL}
                    onClick={() => {
                      void updatePage(page.id, { favorite: true });
                      setMenuOpen(false);
                    }}
                  />
                )}
                {(menuVariant === "favorites" || page.favorite) && (
                  <MenuItem
                    icon={<Star size={14} strokeWidth={1.75} />}
                    label={SIDEBAR_REMOVE_FROM_FAVORITES_LABEL}
                    onClick={() => {
                      void updatePage(page.id, { favorite: false });
                      setMenuOpen(false);
                    }}
                  />
                )}
                <MenuItem
                  icon={<Trash2 size={14} strokeWidth={1.75} />}
                  label="Delete"
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    requestDelete(page.id);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`ko-sidebar-menu-item ${danger ? "is-danger" : ""}`} onClick={onClick}>
      {icon}
      <span className="ko-sidebar-menu-item-label">{label}</span>
    </button>
  );
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [onClose, ref]);
}
