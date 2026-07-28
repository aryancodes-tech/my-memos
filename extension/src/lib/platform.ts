/**
 * True when the UI runs inside the browser extension (new-tab page or extension origin).
 * Uses runtime id because content scripts and ordinary pages do not expose it.
 */
export function isExtensionContext(): boolean {
  return typeof chrome !== "undefined" && typeof chrome.runtime?.id === "string";
}

/** True when the same React app is served as the standalone browser web app. */
export function isWebAppContext(): boolean {
  return !isExtensionContext();
}
