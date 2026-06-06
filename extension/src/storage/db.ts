import { openDB, type IDBPDatabase } from "idb";
import { decodeDoc, encodeDoc } from "./codec";
import type { BlockDoc, ImageBlob, Page } from "./types";
import { len } from "@/lib/text";

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
      },
    });
  }
  return dbPromise;
}

// --- Pages ------------------------------------------------------------------

interface StoredPage extends Omit<Page, "doc"> {
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

/** Validates that an unknown value is a well-formed page for import. */
export function isValidImportPage(value: unknown): value is Page {
  if (!value || typeof value !== "object") return false;
  const page = value as Page;
  const doc = page.doc as BlockDoc | undefined;
  return (
    typeof page.id === "string" &&
    len(page.id) > 0 &&
    typeof page.title === "string" &&
    typeof page.updated_at === "number" &&
    typeof page.created_at === "number" &&
    typeof page.section === "string" &&
    (page.parent_id === null || typeof page.parent_id === "string") &&
    (page.kind === "page" || page.kind === "directory") &&
    typeof page.favorite === "boolean" &&
    typeof page.archived === "boolean" &&
    Array.isArray(page.tags) &&
    doc?.type === "doc" &&
    Array.isArray(doc.content)
  );
}

export async function exportWorkspace() {
  const pages = await listPages();
  return { version: 1, exported_at: Date.now(), pages };
}

/** Imports pages from an exported workspace payload. Rejects malformed data. */
export async function importWorkspace(data: { pages?: unknown[] }) {
  if (!data?.pages || !Array.isArray(data.pages)) {
    throw new Error("Invalid workspace import: expected a pages array");
  }
  for (const page of data.pages) {
    if (!isValidImportPage(page)) {
      throw new Error("Invalid workspace import: malformed page entry");
    }
    await putPage(page);
  }
}
