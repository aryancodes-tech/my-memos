import { nanoid } from "nanoid";
import * as db from "@/storage/db";
import type { BlockDoc, Page } from "@/storage/types";
import { DEMO_SEED_PAGE_TITLE, SETTINGS_KEYS, WORKSPACE_SECTION } from "@/lib/constants";
import type { View } from "@/store/types";

/**
 * Rich sample BlockDoc for the web-demo empty workspace.
 * Text-only invites - no fake OPFS binaries in v1.
 */
export function buildDemoSeedBlockDoc(): BlockDoc {
  return {
    type: "doc",
    content: [
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
    ],
  };
}

export interface SeedDemoResult {
  pages: Page[];
  view: View;
}

/**
 * Seeds one sample page when the web-demo workspace is empty and the seed
 * flag is unset. Marks the flag even when pages already exist so later
 * empties (user deleted everything) do not reseed.
 */
export async function maybeSeedDemoWorkspace(pages: Page[]): Promise<SeedDemoResult | null> {
  const seeded = await db.getSetting<boolean>(SETTINGS_KEYS.demoWorkspaceSeeded);
  if (seeded) return null;

  if (pages.length > 0) {
    await db.setSetting(SETTINGS_KEYS.demoWorkspaceSeeded, true);
    return null;
  }

  const now = Date.now();
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
    doc: buildDemoSeedBlockDoc(),
  };

  await db.putPage(page);
  await db.setSetting(SETTINGS_KEYS.demoWorkspaceSeeded, true);

  return {
    pages: [page],
    view: { kind: "page", id: page.id },
  };
}
