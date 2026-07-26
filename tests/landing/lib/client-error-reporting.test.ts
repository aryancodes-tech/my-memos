import { afterEach, describe, expect, it, vi } from "vitest";
import { reportClientError } from "@/lib/client-error-reporting";

describe("reportClientError", () => {
  afterEach(() => {
    delete window.__clientErrorReporter;
  });

  it("no-ops when no reporter is installed", () => {
    expect(() => reportClientError(new Error("x"))).not.toThrow();
  });

  it("forwards errors with route defaults and merged context", () => {
    const captureException = vi.fn();
    window.__clientErrorReporter = { captureException };

    const error = new Error("boom");
    reportClientError(error, { feature: "faq" });

    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        source: "react_error_boundary",
        route: expect.any(String),
        feature: "faq",
      }),
      expect.objectContaining({
        mechanism: "react_error_boundary",
        handled: false,
        severity: "error",
      }),
    );
  });
});
