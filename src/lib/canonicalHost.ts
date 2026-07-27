/**
 * Builds a permanent-redirect Location when the request host/protocol
 * is a www/apex variant of the configured canonical origin.
 *
 * Returns `null` when no redirect is needed (already canonical, localhost,
 * or a different site such as a preview deploy).
 */
export function getCanonicalHostRedirectUrl(
  requestUrl: string,
  canonicalOrigin: string,
): string | null {
  if (canonicalOrigin.length === 0) {
    return null;
  }

  let request: URL;
  let canonical: URL;
  try {
    request = new URL(requestUrl);
    canonical = new URL(canonicalOrigin.endsWith("/") ? canonicalOrigin : `${canonicalOrigin}/`);
  } catch {
    return null;
  }

  const requestHost = request.hostname.toLowerCase();
  const canonicalHost = canonical.hostname.toLowerCase();

  if (
    requestHost === "localhost" ||
    requestHost.endsWith(".localhost") ||
    requestHost === "127.0.0.1"
  ) {
    return null;
  }

  if (requestHost === canonicalHost && request.protocol === canonical.protocol) {
    return null;
  }

  const apexOf = (host: string): string => (host.startsWith("www.") ? host.slice(4) : host);
  if (apexOf(requestHost) !== apexOf(canonicalHost)) {
    return null;
  }

  const target = new URL(`${request.pathname}${request.search}`, canonical.origin);
  return target.href;
}
