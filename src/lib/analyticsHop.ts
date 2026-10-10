import { track } from "@vercel/analytics";

import { ANALYTICS_HOP_REDIRECT_TIMEOUT_MS } from "@/lib/constants";

/**
 * Fires a Vercel Analytics custom event, waits briefly for the beacon, then navigates away.
 * Used by `/install` and `/uninstall` so hops count before the external redirect.
 */
export async function redirectAfterAnalyticsTrack(
  eventName: string,
  destinationUrl: string,
  trackImpl: typeof track = track,
  redirectImpl: (url: string) => void = (url) => {
    window.location.replace(url);
  },
  timeoutMs: number = ANALYTICS_HOP_REDIRECT_TIMEOUT_MS,
): Promise<void> {
  try {
    trackImpl(eventName);
  } catch {
    // Analytics may be blocked; still complete the hop.
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs);
  });
  redirectImpl(destinationUrl);
}
