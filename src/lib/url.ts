/** Builds an absolute URL from a site origin and path segment. */
export function buildAbsoluteUrl(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}
