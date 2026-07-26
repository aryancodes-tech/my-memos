import { afterEach, describe, expect, it, vi } from "vitest";
import type { DragEvent, RefObject } from "react";
import { WORKSPACE_DRAG_MIME } from "@/lib/constants";
import {
  resolveDragPageId,
  scheduleWorkspaceDragCleanup,
  shouldStartWorkspaceRowDrag,
  startWorkspaceRowDrag,
} from "@/lib/workspace-drag";

function mockDragEvent(overrides: {
  target?: EventTarget | null;
  getData?: (type: string) => string;
  preventDefault?: () => void;
  setData?: (type: string, value: string) => void;
}): DragEvent<HTMLElement> {
  return {
    target: overrides.target ?? document.createElement("div"),
    preventDefault: overrides.preventDefault ?? vi.fn(),
    dataTransfer: {
      setData: overrides.setData ?? vi.fn(),
      getData: overrides.getData ?? (() => ""),
      effectAllowed: "none",
    },
  } as unknown as DragEvent<HTMLElement>;
}

describe("shouldStartWorkspaceRowDrag", () => {
  it("allows drag from plain row content", () => {
    expect(shouldStartWorkspaceRowDrag(document.createElement("span"))).toBe(true);
  });

  it("allows drag when target is not an HTMLElement", () => {
    expect(shouldStartWorkspaceRowDrag(null)).toBe(true);
    expect(shouldStartWorkspaceRowDrag(document.createTextNode("x"))).toBe(true);
  });

  it("blocks drag from interactive sidebar controls", () => {
    const row = document.createElement("div");
    row.innerHTML = `<div class="ko-sidebar-row-actions"><button type="button">···</button></div>`;
    const button = row.querySelector("button");
    expect(shouldStartWorkspaceRowDrag(button)).toBe(false);

    const menu = document.createElement("div");
    menu.className = "ko-sidebar-menu";
    const item = document.createElement("button");
    menu.appendChild(item);
    document.body.appendChild(menu);
    expect(shouldStartWorkspaceRowDrag(item)).toBe(false);
    menu.remove();

    const chevron = document.createElement("button");
    chevron.className = "ko-sidebar-chevron";
    expect(shouldStartWorkspaceRowDrag(chevron)).toBe(false);

    const input = document.createElement("input");
    expect(shouldStartWorkspaceRowDrag(input)).toBe(false);
  });
});

describe("startWorkspaceRowDrag", () => {
  it("sets mime + plain text and begins the drag", () => {
    const setData = vi.fn();
    const onBegin = vi.fn();
    const event = mockDragEvent({ setData });

    startWorkspaceRowDrag(event, "page-1", onBegin);

    expect(setData).toHaveBeenCalledWith(WORKSPACE_DRAG_MIME, "page-1");
    expect(setData).toHaveBeenCalledWith("text/plain", "page-1");
    expect(event.dataTransfer.effectAllowed).toBe("move");
    expect(onBegin).toHaveBeenCalledWith("page-1");
  });

  it("prevents default and skips begin when target is interactive", () => {
    const preventDefault = vi.fn();
    const onBegin = vi.fn();
    const button = document.createElement("button");
    button.className = "ko-sidebar-chevron";
    const event = mockDragEvent({ target: button, preventDefault });

    startWorkspaceRowDrag(event, "page-1", onBegin);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(onBegin).not.toHaveBeenCalled();
  });
});

describe("resolveDragPageId", () => {
  it("prefers the live drag ref over state and dataTransfer", () => {
    const event = mockDragEvent({
      getData: (type) => (type === WORKSPACE_DRAG_MIME ? "from-mime" : "from-plain"),
    });
    const ref: RefObject<string | null> = { current: "from-ref" };

    expect(resolveDragPageId(event, "from-state", ref)).toBe("from-ref");
  });

  it("falls back to state when the ref is empty", () => {
    const event = mockDragEvent({
      getData: () => "from-mime",
    });
    const ref: RefObject<string | null> = { current: null };

    expect(resolveDragPageId(event, "from-state", ref)).toBe("from-state");
  });

  it("falls back to custom MIME then text/plain", () => {
    const event = mockDragEvent({
      getData: (type) => (type === WORKSPACE_DRAG_MIME ? "from-mime" : ""),
    });
    const emptyRef: RefObject<string | null> = { current: "" };

    expect(resolveDragPageId(event, null, emptyRef)).toBe("from-mime");

    const plainOnly = mockDragEvent({
      getData: (type) => (type === "text/plain" ? "from-plain" : ""),
    });
    expect(resolveDragPageId(plainOnly, null, emptyRef)).toBe("from-plain");
  });
});

describe("scheduleWorkspaceDragCleanup", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("finishes the drag when the ref still holds an id after drop", () => {
    vi.useFakeTimers();
    const finish = vi.fn();
    const ref: RefObject<string | null> = { current: "page-1" };

    scheduleWorkspaceDragCleanup(finish, ref);
    expect(finish).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(finish).toHaveBeenCalledOnce();
  });

  it("no-ops when drop already cleared the ref", () => {
    vi.useFakeTimers();
    const finish = vi.fn();
    const ref: RefObject<string | null> = { current: null };

    scheduleWorkspaceDragCleanup(finish, ref);
    vi.runAllTimers();
    expect(finish).not.toHaveBeenCalled();
  });
});
