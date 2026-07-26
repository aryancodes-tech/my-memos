import { len } from "@/lib/text";
import { isImageFile } from "@/lib/attachments/imageFiles";

/** Collects image files from a paste or drop DataTransfer. */
export function collectImageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];

  const fromFiles = Array.from(data.files ?? []).filter(isImageFile);
  if (fromFiles.length > 0) return fromFiles;

  const fromItems: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file && isImageFile(file)) fromItems.push(file);
  }
  return fromItems;
}

/** Extracts unique `img[src]` URLs from an HTML string. */
export function extractImageSrcsFromHtml(html: string): string[] {
  if (len(html) === 0) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const srcs: string[] = [];
  const seen = new Set<string>();

  for (const img of Array.from(doc.querySelectorAll("img[src]"))) {
    const src = img.getAttribute("src")?.trim() ?? "";
    if (len(src) === 0 || seen.has(src)) continue;
    // Skip tiny tracking pixels / empty placeholders when obvious.
    const width = Number(img.getAttribute("width") ?? 0);
    const height = Number(img.getAttribute("height") ?? 0);
    if (width > 0 && height > 0 && width <= 2 && height <= 2) continue;

    seen.add(src);
    srcs.push(src);
  }

  return srcs;
}

/**
 * Fetches an image URL (http(s), data:, blob:) into a File for OPFS storage.
 * Returns null on failure (CORS, network, non-image).
 */
export async function fetchImageSrcAsFile(src: string): Promise<File | null> {
  if (len(src) === 0) return null;

  try {
    if (src.startsWith("data:")) {
      const file = dataUrlToFile(src);
      return file && isImageFile(file) ? file : null;
    }

    const response = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!isImageFile(blob) && !blob.type.startsWith("image/")) {
      // Some CDNs omit MIME; still accept if URL looks like an image.
      if (!/\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|$)/i.test(src)) return null;
    }

    const name = fileNameFromSrc(src, blob.type);
    return new File([blob], name, { type: blob.type || "image/png" });
  } catch (err) {
    console.warn("[MyMemos] Could not fetch pasted image:", src.slice(0, 120), err);
    return null;
  }
}

/**
 * Resolves image Files from clipboard/drop: prefer binary files, else HTML `<img>` srcs.
 * @returns Files ready for OPFS insert (may be empty).
 */
export async function resolveImagesFromDataTransfer(data: DataTransfer | null): Promise<File[]> {
  if (!data) return [];

  const files = collectImageFilesFromDataTransfer(data);
  if (files.length > 0) return files;

  const html = data.getData("text/html");
  const srcs = extractImageSrcsFromHtml(html);
  if (srcs.length === 0) return [];

  const resolved: File[] = [];
  for (const src of srcs) {
    const file = await fetchImageSrcAsFile(src);
    if (file) resolved.push(file);
  }
  return resolved;
}

function dataUrlToFile(dataUrl: string): File | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;

  const mime = match[1] || "image/png";
  const isBase64 = Boolean(match[2]);
  const data = match[3] ?? "";

  let bytes: Uint8Array;
  if (isBase64) {
    const binary = atob(data);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(data));
  }

  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime });
  const ext = mime.split("/")[1]?.split("+")[0] || "png";
  return new File([blob], `pasted.${ext}`, { type: mime });
}

function fileNameFromSrc(src: string, mime: string): string {
  try {
    const url = new URL(src, typeof location !== "undefined" ? location.href : undefined);
    const last = url.pathname.split("/").filter(Boolean).pop();
    if (last && /\.[a-z0-9]+$/i.test(last)) return last;
  } catch {
    // ignore
  }
  const ext = mime.split("/")[1]?.split("+")[0] || "png";
  return `pasted.${ext}`;
}
