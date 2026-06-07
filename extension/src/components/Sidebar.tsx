import {
  useStore,
  selectFavoritePages,
  selectRecentPages,
  selectWorkspaceRoots,
  selectWorkspaceChildren,
} from "@/store/useStore";
import type { Page } from "@/storage/types";
import {
  PRODUCT_NAME,
  SIDEBAR_INDENT_PX,
  SIDEBAR_MENU_MIN_WIDTH_PX,
  SIDEBAR_WIDTH_PX,
  SEARCH_SHORTCUT_LABEL,
  WORKSPACE_DRAG_MIME,
  WORKSPACE_SECTION,
} from "@/lib/constants";
import { len } from "@/lib/text";
import {
  canDropOntoFolder,
  canDropOntoPage,
  canMoveWorkspaceItem,
  resolveFolderDropParentId,
} from "@/lib/workspace-tree";
import { PageIcon } from "@/components/PageIcon";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

/** Drag-and-drop props shared by workspace sidebar rows. */
interface WorkspaceDragProps {
  dragPageId: string | null;
  dragPageIdRef: RefObject<string | null>;
  beginWorkspaceDrag: (pageId: string) => void;
  endWorkspaceDrag: () => void;
  finishWorkspaceDrag: () => void;
}

export default function Sidebar() {
  const { pages, sidebarCollapsed, toggleSidebar, view, setView, setSearchOpen } = useStore();
  const [dragPageId, setDragPageId] = useState<string | null>(null);
  const dragPageIdRef = useRef<string | null>(null);

  const beginWorkspaceDrag = (pageId: string) => {
    dragPageIdRef.current = pageId;
    setDragPageId(pageId);
  };

  const endWorkspaceDrag = () => {
    setDragPageId(null);
  };

  const finishWorkspaceDrag = () => {
    dragPageIdRef.current = null;
    setDragPageId(null);
  };

  const workspaceDrag: WorkspaceDragProps = {
    dragPageId,
    dragPageIdRef,
    beginWorkspaceDrag,
    endWorkspaceDrag,
    finishWorkspaceDrag,
  };

  const favorites = useMemo(() => selectFavoritePages(pages), [pages]);
  const recent = useMemo(() => selectRecentPages(pages), [pages]);
  const workspaceRoots = useMemo(() => selectWorkspaceRoots(pages), [pages]);

  if (sidebarCollapsed) {
    return (
      <aside className="ko-sidebar w-11 shrink-0 border-r flex flex-col items-center py-3 gap-1">
        <IconRailButton title="Expand sidebar" onClick={toggleSidebar}>
          <ChevronRight size={16} strokeWidth={1.75} />
        </IconRailButton>
        <IconRailButton
          title={`Search (${SEARCH_SHORTCUT_LABEL})`}
          onClick={() => setSearchOpen(true)}
        >
          <Search size={16} strokeWidth={1.75} />
        </IconRailButton>
        <IconRailButton title="Dashboard" onClick={() => setView({ kind: "dashboard" })}>
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
        <IconRailButton title="Collapse sidebar" onClick={toggleSidebar}>
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

        <Section title="Recent">
          {recent.length === 0 ? (
            <p className="ko-sidebar-empty">Recently opened pages appear here.</p>
          ) : (
            recent.map((page) => <PageRow key={page.id} page={page} menuVariant="recent" />)
          )}
        </Section>

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
        aria-label="Add new page or folder"
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
            label="New folder"
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
        title={expanded ? "Collapse" : "Expand"}
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
          placeholder="Untitled folder"
        />
      ) : (
        <div
          className="ko-sidebar-row-label cursor-pointer"
          onDoubleClick={() => setEditing(true)}
          onClick={onToggle}
        >
          {item.title || "Untitled folder"}
        </div>
      )}
      <div className="ko-sidebar-row-actions">
        <div className="relative">
          <button
            className="ko-icon-btn !p-1"
            title="Add inside"
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
                label="New folder"
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
                    label="Add to favorites"
                    onClick={() => {
                      void updatePage(page.id, { favorite: true });
                      setMenuOpen(false);
                    }}
                  />
                )}
                {(menuVariant === "favorites" || page.favorite) && (
                  <MenuItem
                    icon={<Star size={14} strokeWidth={1.75} />}
                    label="Remove from favorites"
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

/** Starts a workspace row drag unless the pointer is on an interactive child. */
function startWorkspaceRowDrag(
  event: React.DragEvent<HTMLElement>,
  pageId: string,
  onBegin: (pageId: string) => void,
) {
  if (!shouldStartWorkspaceRowDrag(event.target)) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.setData(WORKSPACE_DRAG_MIME, pageId);
  event.dataTransfer.setData("text/plain", pageId);
  event.dataTransfer.effectAllowed = "move";
  onBegin(pageId);
}

/** Returns false when the event target is a button, menu, or other non-drag control. */
function shouldStartWorkspaceRowDrag(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return target.closest(".ko-sidebar-row-actions, .ko-sidebar-menu, .ko-sidebar-chevron, input") === null;
}

/** Clears the drag ref after drop runs; no-op when drop already finished the drag. */
function scheduleWorkspaceDragCleanup(
  finishWorkspaceDrag: () => void,
  dragPageIdRef: RefObject<string | null>,
) {
  window.setTimeout(() => {
    if (len(dragPageIdRef.current ?? "") > 0) {
      finishWorkspaceDrag();
    }
  }, 0);
}

/** Prefers the live drag ref/state; falls back to dataTransfer on drop. */
function resolveDragPageId(
  event: React.DragEvent,
  dragPageId: string | null,
  dragPageIdRef: RefObject<string | null>,
): string {
  if (len(dragPageIdRef.current ?? "") > 0) {
    return dragPageIdRef.current!;
  }

  if (len(dragPageId ?? "") > 0) {
    return dragPageId!;
  }

  const fromMime = event.dataTransfer.getData(WORKSPACE_DRAG_MIME);
  if (len(fromMime) > 0) {
    return fromMime;
  }

  return event.dataTransfer.getData("text/plain");
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
