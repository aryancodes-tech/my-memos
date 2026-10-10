import { afterEach, describe, expect, it, vi } from "vitest";

import { redirectAfterAnalyticsTrack } from "@/lib/analyticsHop";

describe("redirectAfterAnalyticsTrack", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("tracks the event then redirects after the flush window", async () => {
    vi.useFakeTimers();
    const trackImpl = vi.fn();
    const redirectImpl = vi.fn();

    const pending = redirectAfterAnalyticsTrack(
      "install_hop",
      "https://example.com/store",
      trackImpl,
      redirectImpl,
      50,
    );

    expect(trackImpl).toHaveBeenCalledWith("install_hop");
    expect(redirectImpl).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);
    await pending;

    expect(redirectImpl).toHaveBeenCalledWith("https://example.com/store");
  });

  it("still redirects when track throws", async () => {
    vi.useFakeTimers();
    const trackImpl = vi.fn(() => {
      throw new Error("blocked");
    });
    const redirectImpl = vi.fn();

    const pending = redirectAfterAnalyticsTrack(
      "uninstall_hop",
      "https://example.com/form",
      trackImpl,
      redirectImpl,
      100,
    );

    await vi.advanceTimersByTimeAsync(100);
    await pending;

    expect(redirectImpl).toHaveBeenCalledWith("https://example.com/form");
  });
});
