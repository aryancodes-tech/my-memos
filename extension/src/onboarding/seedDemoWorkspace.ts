import { nanoid } from "nanoid";
import * as db from "@/storage/db";
import type { AttachmentRef, BlockDoc, BlockNode, Page } from "@/storage/types";
import {
  saveImageAttachment,
  saveUploadedAudioAttachment,
} from "@/lib/attachments/attachmentManager";
import { isAttachmentStorageSupported } from "@/lib/attachments/fileSystemManager";
import {
  DEMO_SEED_IMAGE_ALT,
  DEMO_SEED_IMAGE_CAPTION,
  DEMO_SEED_IMAGE_FILE_NAME,
  DEMO_SEED_IMAGE_PUBLIC_PATH,
  DEMO_SEED_PAGE_TITLE,
  DEMO_SEED_VOICE_FILE_NAME,
  DEMO_SEED_VOICE_PUBLIC_PATH,
  DEMO_SEED_VOICE_TITLE,
  DEMO_WORKSPACE_SEED_VERSION,
  SETTINGS_KEYS,
  WORKSPACE_SECTION,
} from "@/lib/constants";
import { len } from "@/lib/text";
import type { View } from "@/store/types";

/** Optional attrs when a sample voice file was copied into OPFS. */
export type DemoSeedVoiceAttrs = {
  attachmentPath: string;
  duration: number;
  size: number;
  title: string;
  createdAt: string;
};

/** Optional attrs when a sample image was copied into OPFS. */
export type DemoSeedImageAttrs = {
  attachmentPath: string;
  attachmentSize: number;
  alt: string;
  caption: string;
};

/** Media attachments available when building the demo seed document. */
export type DemoSeedMedia = {
  voice?: DemoSeedVoiceAttrs | null;
  image?: DemoSeedImageAttrs | null;
};

/**
 * Rich sample BlockDoc for the web-demo empty workspace.
 * Includes image / voice blocks when OPFS-backed media is provided.
 */
export function buildDemoSeedBlockDoc(media?: DemoSeedMedia | null): BlockDoc {
  const voice = media?.voice ?? null;
  const image = media?.image ?? null;

  const content: BlockNode[] = [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to MyMemos" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This sample page shows what you can capture in a New Tab workspace. Everything stays on this device - edit freely.",
        },
      ],
    },
  ];

  if (image && len(image.attachmentPath) > 0) {
    content.push(
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Sample image" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Images paste, drop, or pick from the toolbar - this one ships with the demo so you can try captions and lightbox right away.",
          },
        ],
      },
      {
        type: "image",
        attrs: {
          attachmentPath: image.attachmentPath,
          attachmentSize: image.attachmentSize,
          alt: image.alt,
          caption: image.caption,
          src: null,
        },
      },
    );
  }

  content.push(
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Try these" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Type " },
                { type: "text", marks: [{ type: "code" }], text: "/" },
                { type: "text", text: " in a blank line for the slash menu" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Use the toolbar Image or Voice buttons to attach media",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Press ⌘K to search pages and content" }],
            },
          ],
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Open this demo page" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Create your own page from the sidebar" }],
            },
          ],
        },
      ],
    },
  );

  if (voice && len(voice.attachmentPath) > 0) {
    content.push(
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Sample voice note" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Play the clip below - the same Voice control in the toolbar lets you record or attach your own audio.",
          },
        ],
      },
      {
        type: "voiceNote",
        attrs: {
          status: "saved",
          attachmentPath: voice.attachmentPath,
          duration: voice.duration,
          size: voice.size,
          title: voice.title,
          createdAt: voice.createdAt,
        },
      },
    );
  }

  content.push(
    {
      type: "codeBlock",
      attrs: { language: "markdown" },
      content: [
        {
          type: "text",
          text: "# Quick capture\n- Ideas on every ⌘T\n- Local-first, no account",
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Tip: Image and Voice live in the editor toolbar - try them when you are ready. Files stay in this browser origin.",
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "When you install the browser extension, your New Tab becomes this same workspace - private to your machine.",
        },
      ],
    },
  );

  return { type: "doc", content };
}

/**
 * Candidate URLs for a demo asset (landing root, then demo base).
 * @internal Exported for unit tests.
 */
export function demoSeedAssetFetchUrls(
  fileName: string,
  publicPath: string,
  baseUrl: string = import.meta.env.BASE_URL ?? "/",
): string[] {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const underBase = `${normalizedBase}${fileName}`;
  return [...new Set([publicPath, underBase])];
}

/** @deprecated Prefer `demoSeedAssetFetchUrls` - kept for existing tests. */
export function demoSeedVoiceFetchUrls(
  baseUrl: string = import.meta.env.BASE_URL ?? "/",
): string[] {
  return demoSeedAssetFetchUrls(DEMO_SEED_VOICE_FILE_NAME, DEMO_SEED_VOICE_PUBLIC_PATH, baseUrl);
}

/**
 * Fetches a public demo asset and returns a File, or null when unavailable.
 * @internal Exported for unit tests.
 */
export async function fetchDemoSeedAssetFile(
  fileName: string,
  publicPath: string,
  fallbackMime: string,
  fetchImpl: typeof fetch = fetch,
  baseUrl?: string,
): Promise<File | null> {
  for (const url of demoSeedAssetFetchUrls(fileName, publicPath, baseUrl)) {
    try {
      const response = await fetchImpl(url);
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.size === 0) continue;
      const type = len(blob.type) > 0 ? blob.type : fallbackMime;
      return new File([blob], fileName, { type });
    } catch {
      // Try the next candidate URL.
    }
  }
  return null;
}

/** @deprecated Prefer `fetchDemoSeedAssetFile` - kept for existing tests. */
export async function fetchDemoSeedVoiceFile(
  fetchImpl: typeof fetch = fetch,
  baseUrl?: string,
): Promise<File | null> {
  return fetchDemoSeedAssetFile(
    DEMO_SEED_VOICE_FILE_NAME,
    DEMO_SEED_VOICE_PUBLIC_PATH,
    "audio/mpeg",
    fetchImpl,
    baseUrl,
  );
}

/** Copies the public sample MP3 into OPFS when attachment storage is available. */
async function seedDemoVoiceAttachment(): Promise<DemoSeedVoiceAttrs | null> {
  if (!isAttachmentStorageSupported()) return null;

  try {
    const file = await fetchDemoSeedAssetFile(
      DEMO_SEED_VOICE_FILE_NAME,
      DEMO_SEED_VOICE_PUBLIC_PATH,
      "audio/mpeg",
    );
    if (!file) return null;

    const ref: AttachmentRef = await saveUploadedAudioAttachment(file);
    return {
      attachmentPath: ref.path,
      duration: ref.duration ?? 0,
      size: ref.size ?? file.size,
      title: DEMO_SEED_VOICE_TITLE,
      createdAt: ref.createdAt ?? new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[MyMemos] Demo seed voice note skipped:", err);
    return null;
  }
}

/** Copies the public sample PNG into OPFS when attachment storage is available. */
async function seedDemoImageAttachment(): Promise<DemoSeedImageAttrs | null> {
  if (!isAttachmentStorageSupported()) return null;

  try {
    const file = await fetchDemoSeedAssetFile(
      DEMO_SEED_IMAGE_FILE_NAME,
      DEMO_SEED_IMAGE_PUBLIC_PATH,
      "image/png",
    );
    if (!file) return null;

    const path = await saveImageAttachment(file);
    return {
      attachmentPath: path,
      attachmentSize: file.size,
      alt: DEMO_SEED_IMAGE_ALT,
      caption: DEMO_SEED_IMAGE_CAPTION,
    };
  } catch (err) {
    console.warn("[MyMemos] Demo seed image skipped:", err);
    return null;
  }
}

/** Reads the persisted demo seed version (legacy boolean counts as v1). */
async function readDemoSeedVersion(): Promise<number> {
  const version = await db.getSetting<number>(SETTINGS_KEYS.demoWorkspaceSeedVersion);
  if (typeof version === "number" && Number.isFinite(version)) {
    return version;
  }

  const legacySeeded = await db.getSetting<boolean>(SETTINGS_KEYS.demoWorkspaceSeeded);
  return legacySeeded ? 1 : 0;
}

async function markDemoSeedComplete(): Promise<void> {
  await db.setSetting(SETTINGS_KEYS.demoWorkspaceSeeded, true);
  await db.setSetting(SETTINGS_KEYS.demoWorkspaceSeedVersion, DEMO_WORKSPACE_SEED_VERSION);
}

export interface SeedDemoResult {
  pages: Page[];
  view: View;
}

/**
 * Seeds one sample page when the web-demo workspace is empty and the seed
 * version is outdated. Marks the version even when other pages already exist
 * so later empties (user deleted everything) do not reseed.
 *
 * If the only page is still the stock welcome page from an older seed, its
 * document is upgraded in place (adds sample media when possible).
 */
export async function maybeSeedDemoWorkspace(pages: Page[]): Promise<SeedDemoResult | null> {
  const seedVersion = await readDemoSeedVersion();
  if (seedVersion >= DEMO_WORKSPACE_SEED_VERSION) return null;

  const onlyWelcomePage =
    pages.length === 1 && pages[0]?.title === DEMO_SEED_PAGE_TITLE ? pages[0] : null;

  if (pages.length > 0 && !onlyWelcomePage) {
    await markDemoSeedComplete();
    return null;
  }

  const [voice, image] = await Promise.all([
    seedDemoVoiceAttachment(),
    seedDemoImageAttachment(),
  ]);
  const now = Date.now();
  const doc = buildDemoSeedBlockDoc({ voice, image });

  if (onlyWelcomePage) {
    const updated: Page = {
      ...onlyWelcomePage,
      updated_at: now,
      doc,
    };
    await db.putPage(updated);
    await markDemoSeedComplete();
    return {
      pages: [updated],
      view: { kind: "page", id: updated.id },
    };
  }

  const page: Page = {
    id: nanoid(),
    title: DEMO_SEED_PAGE_TITLE,
    kind: "page",
    parent_id: null,
    section: WORKSPACE_SECTION,
    favorite: false,
    archived: false,
    tags: [],
    created_at: now,
    updated_at: now,
    doc,
  };

  await db.putPage(page);
  await markDemoSeedComplete();

  return {
    pages: [page],
    view: { kind: "page", id: page.id },
  };
}
