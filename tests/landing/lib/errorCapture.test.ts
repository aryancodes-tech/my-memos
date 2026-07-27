import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("consumeLastCapturedError", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined when nothing was captured", async () => {
    const { consumeLastCapturedError } = await import("@/lib/errorCapture");
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("captures window error events and clears after consume", async () => {
    const { consumeLastCapturedError } = await import("@/lib/errorCapture");
    const error = new Error("ssr boom");
    window.dispatchEvent(new ErrorEvent("error", { error, message: "ssr boom" }));

    expect(consumeLastCapturedError()).toBe(error);
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("captures unhandledrejection reasons", async () => {
    const { consumeLastCapturedError } = await import("@/lib/errorCapture");
    const reason = new Error("rejected");
    const event = new Event("unhandledrejection") as Event & { reason: Error };
    event.reason = reason;
    window.dispatchEvent(event);

    expect(consumeLastCapturedError()).toBe(reason);
  });

  it("expires captured errors after the TTL", async () => {
    const { consumeLastCapturedError } = await import("@/lib/errorCapture");
    const error = new Error("stale");
    window.dispatchEvent(new ErrorEvent("error", { error }));

    vi.setSystemTime(new Date("2026-01-01T00:00:06.000Z"));
    expect(consumeLastCapturedError()).toBeUndefined();
  });
});
