import { nanoid } from "nanoid";
import * as db from "@/storage/db";
import type { AttachmentRef, BlockDoc, BlockNode, Page } from "@/storage/types";
import { saveImageAttachment, saveUploadedAudioAttachment } from "@/lib/attachments/attachmentManager";
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

/** Optional attrs when a sample image file was copied into OPFS. */
export type DemoSeedImageAttrs = {
  attachmentPath: string;
  size: number;
  alt: string;
  caption: string;
};

/**
 * Rich sample BlockDoc for the welcome page in a fresh empty workspace.
 * Includes seeded media when attachments are available in OPFS.
 */
export function buildDemoSeedBlockDoc(
  voice?: DemoSeedVoiceAttrs | null,
  image?: DemoSeedImageAttrs | null,
): BlockDoc {
  const content: BlockNode[] = [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Capture first, organize later" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "MyMemos turns every new tab into a workspace for ideas, plans, links, screenshots, and voice notes. Everything here stays on this device.",
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Capture an idea before it disappears" }] }],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Group pages by project or area" }] }],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Open the sidebar and explore the seeded workspace" }] }],
        },
      ],
    },
  ];

  if (image && len(image.attachmentPath) > 0) {
    content.push(
      {
        type: "image",
        attrs: {
          attachmentPath: image.attachmentPath,
          attachmentSize: image.size,
          alt: image.alt,
          caption: image.caption,
          src: null,
          align: "center",
        },
      },
    );
  }

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
            text: "Use voice notes when typing is too slow. The same toolbar control lets you record or attach your own audio.",
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
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Why this workspace converts" }],
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
                { type: "text", text: " in a blank line for quick structure" },
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
                  text: "Add screenshots and voice notes without leaving the page",
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
              content: [{ type: "text", text: "Press ⌘K to search titles and note content instantly" }],
            },
          ],
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "markdown" },
      content: [
        {
          type: "text",
          text: "# New tab notes\n- ideas on every Cmd+T\n- no account required\n- local-first by default",
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
              text: "Tip: the best product screenshots show one strong benefit per frame: instant capture, clean organization, rich notes, or fast retrieval.",
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
          text: "Install the extension and this same workspace appears on every new tab - fast, private, and always one shortcut away.",
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

/** Candidate URLs for the demo voice sample. */
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

/** Fetches the sample MP3 and returns a File, or null when unavailable. */
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

/** Fetches the sample demo image and returns a File, or null when unavailable. */
export async function fetchDemoSeedImageFile(
  fetchImpl: typeof fetch = fetch,
  baseUrl?: string,
): Promise<File | null> {
  return fetchDemoSeedAssetFile(
    DEMO_SEED_IMAGE_FILE_NAME,
    DEMO_SEED_IMAGE_PUBLIC_PATH,
    "image/png",
    fetchImpl,
    baseUrl,
  );
}

/** Copies the public sample MP3 into OPFS when attachment storage is available. */
async function seedDemoVoiceAttachment(): Promise<DemoSeedVoiceAttrs | null> {
  if (!isAttachmentStorageSupported()) return null;

  try {
    const file = await fetchDemoSeedVoiceFile();
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

/** Copies the public sample image into OPFS when attachment storage is available. */
async function seedDemoImageAttachment(): Promise<DemoSeedImageAttrs | null> {
  if (!isAttachmentStorageSupported()) return null;

  try {
    const file = await fetchDemoSeedImageFile();
    if (!file) return null;

    const attachmentPath = await saveImageAttachment(file);
    return {
      attachmentPath,
      size: file.size,
      alt: DEMO_SEED_IMAGE_ALT,
      caption: DEMO_SEED_IMAGE_CAPTION,
    };
  } catch (err) {
    console.warn("[MyMemos] Demo seed image skipped:", err);
    return null;
  }
}

function paragraph(text: string): BlockNode {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

function heading(level: number, text: string): BlockNode {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function buildLaunchPlanDoc(
  voice?: DemoSeedVoiceAttrs | null,
  image?: DemoSeedImageAttrs | null,
): BlockDoc {
  const content: BlockNode[] = [
    heading(1, "Launch plan"),
    paragraph("Everything for a launch lives in one place: priorities, assets, talking points, and quick voice reminders."),
    {
      type: "taskList",
      content: [
        { type: "taskItem", attrs: { checked: true }, content: [paragraph("Tighten landing headline and first screenshot")] },
        { type: "taskItem", attrs: { checked: true }, content: [paragraph("Prepare demo workspace that feels real, not staged")] },
        { type: "taskItem", attrs: { checked: false }, content: [paragraph("Share launch page with 5 early users for feedback")] },
      ],
    },
  ];

  if (image && len(image.attachmentPath) > 0) {
    content.push({
      type: "image",
      attrs: {
        attachmentPath: image.attachmentPath,
        attachmentSize: image.size,
        alt: image.alt,
        caption: image.caption,
        src: null,
        align: "center",
      },
    });
  }

  if (voice && len(voice.attachmentPath) > 0) {
    content.push(
      heading(2, "Voice memo"),
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
    heading(2, "Core message"),
    paragraph("The value is speed: open a new tab, capture the thought, and keep moving without context-switching into another app."),
  );

  return { type: "doc", content };
}

function buildNetworkingDoc(): BlockDoc {
  return {
    type: "doc",
    content: [
      heading(1, "Networking"),
      paragraph("A lightweight page for follow-ups after calls, events, and warm intros."),
      {
        type: "taskList",
        content: [
          { type: "taskItem", attrs: { checked: false }, content: [paragraph("Send TLS handshake article to Priya")] },
          { type: "taskItem", attrs: { checked: false }, content: [paragraph("Book 15-min intro with Arjun next week")] },
          { type: "taskItem", attrs: { checked: true }, content: [paragraph("Summarize customer call learnings")] },
        ],
      },
    ],
  };
}

function buildReadingListDoc(): BlockDoc {
  return {
    type: "doc",
    content: [
      heading(1, "Reading notes"),
      paragraph("Notes worth keeping, not just tabs worth reopening."),
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [paragraph("How products reduce friction in the first 30 seconds")] },
          { type: "listItem", content: [paragraph("Why local-first tools feel faster and more trustworthy")] },
          { type: "listItem", content: [paragraph("Examples of landing pages with strong visual storytelling")] },
        ],
      },
    ],
  };
}

function makePage(overrides: Partial<Page> & Pick<Page, "title" | "kind" | "parent_id" | "doc">, timestamp: number): Page {
  return {
    id: overrides.id ?? nanoid(),
    title: overrides.title,
    kind: overrides.kind,
    parent_id: overrides.parent_id,
    section: WORKSPACE_SECTION,
    favorite: overrides.favorite ?? false,
    archived: false,
    tags: [],
    created_at: timestamp,
    updated_at: timestamp,
    doc: overrides.doc,
  };
}

function buildDemoSeedPages(
  now: number,
  voice?: DemoSeedVoiceAttrs | null,
  image?: DemoSeedImageAttrs | null,
  existingWelcomeId?: string,
): { pages: Page[]; primaryPageId: string } {
  const workDir = makePage(
    { title: "Work", kind: "directory", parent_id: null, doc: { type: "doc", content: [paragraph("Work directory")] } },
    now - 1_000,
  );
  const personalDir = makePage(
    { title: "Personal", kind: "directory", parent_id: null, doc: { type: "doc", content: [paragraph("Personal directory")] } },
    now - 2_000,
  );
  const launchPlan = makePage(
    {
      title: "Launch plan",
      kind: "page",
      parent_id: workDir.id,
      favorite: true,
      doc: buildLaunchPlanDoc(voice, image),
    },
    now,
  );
  const networking = makePage(
    {
      title: "Networking",
      kind: "page",
      parent_id: workDir.id,
      doc: buildNetworkingDoc(),
    },
    now - 3_000,
  );
  const readingNotes = makePage(
    {
      title: "Reading notes",
      kind: "page",
      parent_id: personalDir.id,
      doc: buildReadingListDoc(),
    },
    now - 4_000,
  );
  const welcomePage = makePage(
    {
      id: existingWelcomeId,
      title: DEMO_SEED_PAGE_TITLE,
      kind: "page",
      parent_id: null,
      doc: buildDemoSeedBlockDoc(voice, image),
    },
    now - 5_000,
  );

  return {
    pages: [launchPlan, workDir, networking, personalDir, readingNotes, welcomePage],
    primaryPageId: launchPlan.id,
  };
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
 * Seeds one sample page when the workspace is empty and the seed version is
 * outdated. Marks the version even when other pages already exist so later
 * empties (user deleted everything) do not reseed.
 *
 * If the only page is still the stock welcome page from an older seed, its
 * document is upgraded in place (adds the sample voice note when possible).
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

  const voice = await seedDemoVoiceAttachment();
  const image = await seedDemoImageAttachment();
  const now = Date.now();
  const seeded = buildDemoSeedPages(now, voice, image, onlyWelcomePage?.id);
  await Promise.all(seeded.pages.map((page) => db.putPage(page)));
  await markDemoSeedComplete();

  return {
    pages: seeded.pages,
    view: { kind: "page", id: seeded.primaryPageId },
  };
}
