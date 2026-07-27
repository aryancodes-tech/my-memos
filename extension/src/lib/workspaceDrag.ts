import type { DragEvent, RefObject } from "react";
import { useRef, useState } from "react";
import { WORKSPACE_DRAG_MIME } from "@/lib/constants";
import { len } from "@/lib/text";

/** Drag-and-drop props shared by workspace sidebar rows. */
export interface WorkspaceDragProps {
  dragPageId: string | null;
  dragPageIdRef: RefObject<string | null>;
  beginWorkspaceDrag: (pageId: string) => void;
  endWorkspaceDrag: () => void;
  finishWorkspaceDrag: () => void;
}

/** Local drag session state for the workspace sidebar tree. */
export function useWorkspaceDrag(): WorkspaceDragProps {
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

  return {
    dragPageId,
    dragPageIdRef,
    beginWorkspaceDrag,
    endWorkspaceDrag,
    finishWorkspaceDrag,
  };
}

/** Starts a workspace row drag unless the pointer is on an interactive child. */
export function startWorkspaceRowDrag(
  event: DragEvent<HTMLElement>,
  pageId: string,
  onBegin: (pageId: string) => void,
): void {
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
export function shouldStartWorkspaceRowDrag(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return (
    target.closest(".ko-sidebar-row-actions, .ko-sidebar-menu, .ko-sidebar-chevron, input") === null
  );
}

/** Clears the drag ref after drop runs; no-op when drop already finished the drag. */
export function scheduleWorkspaceDragCleanup(
  finishWorkspaceDrag: () => void,
  dragPageIdRef: RefObject<string | null>,
): void {
  window.setTimeout(() => {
    if (len(dragPageIdRef.current ?? "") > 0) {
      finishWorkspaceDrag();
    }
  }, 0);
}

/** Prefers the live drag ref/state; falls back to dataTransfer on drop. */
export function resolveDragPageId(
  event: DragEvent,
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
