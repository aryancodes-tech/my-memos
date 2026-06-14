import { createServerFn } from "@tanstack/react-start";

/** Server handler: reads the active request origin for SEO canonical URLs. */
const readSeoRequestOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  return new URL(getRequest().url).origin;
});

/** Resolves the request origin on the client or during SSR. */
export async function getSeoRequestOrigin(): Promise<string> {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return readSeoRequestOrigin();
}
