import { openDB, type IDBPDatabase } from "idb";
import LZString from "lz-string";
import type { Page, ImageBlob, BlockDoc } from "./types";

/**
 * KnowledgeOS storage layer.
 * - IndexedDB stores pages (block JSON, LZString-compressed) and image blobs.
 * - chrome.storage.local holds lightweight metadata (settings, theme, last opened page).
 *
 * Design notes (per spec):
 *  - Only source data is stored. Rendered HTML / markdown are never persisted.
 *  - Documents are compact JSON blobs of Tiptap-compatible block structures.
 *  - Image binaries live in a separate object store, referenced by id from blocks.
 *  - Schema versioned via DB_VERSION; future fields can be added non-destructively.
 */

const DB_NAME = "knowledgeos";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains("pages")) {
          const s = d.createObjectStore("pages", { keyPath: "id" });
          s.createIndex("updated_at", "updated_at");
          s.createIndex("parent_id", "parent_id");
          s.createIndex("favorite", "favorite");
        }
        if (!d.objectStoreNames.contains("images")) {
          d.createObjectStore("images", { keyPath: "id" });
        }
      }
    });
  }
  return dbPromise;
}

// --- Compression helpers ----------------------------------------------------

function encodeDoc(doc: BlockDoc): string {
  // Store compressed JSON; LZString UTF16 is friendly to IndexedDB string values.
  return LZString.compressToUTF16(JSON.stringify(doc));
}
function decodeDoc(s: string | undefined | null): BlockDoc {
  if (!s) return { type: "doc", content: [] };
  try {
    const raw = LZString.decompressFromUTF16(s);
    if (!raw) return { type: "doc", content: [] };
    return JSON.parse(raw) as BlockDoc;
  } catch {
    return { type: "doc", content: [] };
  }
}

// --- Pages ------------------------------------------------------------------

export interface StoredPage extends Omit<Page, "doc"> {
  /** Compressed JSON string. Never store rendered HTML. */
  doc_c: string;
}

function toStored(p: Page): StoredPage {
  const { doc, ...rest } = p;
  return { ...rest, doc_c: encodeDoc(doc) };
}
function fromStored(s: StoredPage): Page {
  const { doc_c, ...rest } = s;
  return { ...rest, doc: decodeDoc(doc_c) };
}

export async function listPages(): Promise<Page[]> {
  const d = await db();
  const rows = (await d.getAll("pages")) as StoredPage[];
  return rows.map(fromStored).sort((a, b) => b.updated_at - a.updated_at);
}

export async function getPage(id: string): Promise<Page | undefined> {
  const d = await db();
  const row = (await d.get("pages", id)) as StoredPage | undefined;
  return row ? fromStored(row) : undefined;
}

export async function putPage(page: Page): Promise<void> {
  const d = await db();
  await d.put("pages", toStored(page));
}

export async function deletePage(id: string): Promise<void> {
  const d = await db();
  await d.delete("pages", id);
}

// --- Images -----------------------------------------------------------------

export async function putImage(img: ImageBlob): Promise<void> {
  const d = await db();
  await d.put("images", img);
}
export async function getImage(id: string): Promise<ImageBlob | undefined> {
  const d = await db();
  return (await d.get("images", id)) as ImageBlob | undefined;
}

// --- Settings (chrome.storage.local with localStorage fallback) -------------

const HAS_CHROME = typeof chrome !== "undefined" && !!chrome.storage?.local;

export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  if (HAS_CHROME) {
    return new Promise((res) => chrome.storage.local.get(key, (v) => res(v[key] as T)));
  }
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}
export async function setSetting<T = unknown>(key: string, value: T): Promise<void> {
  if (HAS_CHROME) {
    return new Promise((res) => chrome.storage.local.set({ [key]: value }, () => res()));
  }
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Export / Import --------------------------------------------------------

export async function exportWorkspace() {
  const pages = await listPages();
  return { version: 1, exported_at: Date.now(), pages };
}
export async function importWorkspace(data: { pages?: Page[] }) {
  if (data.pages) for (const p of data.pages) await putPage(p);
}
