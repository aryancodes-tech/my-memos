import { beforeEach, describe, expect, it, vi } from "vitest";
import { smoothRevealSelection } from "@/editor/revealSelection";

describe("smoothRevealSelection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
      })),
    );
  });

  it("scrolls the nearest editor scroll container smoothly", () => {
    const scrollTo = vi.fn();
    const container = {
      clientHeight: 600,
      scrollTop: 1200,
      scrollTo,
      getBoundingClientRect: () => ({ top: 100 }),
    };
    const root = document.createElement("div");
    vi.spyOn(root, "closest").mockReturnValue(container as unknown as HTMLElement);

    const editor = {
      isDestroyed: false,
      view: {
        dom: root,
        coordsAtPos: () => ({ top: 820, bottom: 860 }),
      },
      state: {
        selection: { from: 10 },
      },
    } as any;

    smoothRevealSelection(editor);

    expect(scrollTo).toHaveBeenCalledWith({
      top: 1710,
      behavior: "smooth",
    });
  });

  it("falls back to window scroll when no container exists", () => {
    const root = document.createElement("div");
    vi.spyOn(root, "closest").mockReturnValue(null);
    const windowScrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const editor = {
      isDestroyed: false,
      view: {
        dom: root,
        coordsAtPos: () => ({ top: 900, bottom: 940 }),
      },
      state: {
        selection: { from: 5 },
      },
    } as any;

    smoothRevealSelection(editor);

    expect(windowScrollTo).toHaveBeenCalledWith({
      top: 631.2,
      behavior: "smooth",
    });
  });
});
