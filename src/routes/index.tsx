import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DEMO_PATH, EXTENSION_ZIP_FILENAME } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KnowledgeOS - Chrome Extension" },
      {
        name: "description",
        content:
          "Notion-inspired personal knowledge management, study tracker and learning dashboard that replaces your New Tab page.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const res = await fetch(`/${EXTENSION_ZIP_FILENAME}`);
      if (!res.ok)
        throw new Error(`Download failed (${res.status}). Run npm run package:extension first.`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = EXTENSION_ZIP_FILENAME;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Chrome Extension · Manifest V3
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight">KnowledgeOS</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A Notion-inspired personal knowledge management and learning dashboard that replaces your
          New Tab page. Local-first, offline-only, zero backend.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={download}
            disabled={isDownloading}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isDownloading ? "Downloading…" : "Download extension"}
          </button>
          <a
            href={DEMO_PATH}
            className="rounded-md border border-input px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Try live demo ✨
          </a>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Install the extension to replace your New Tab, or explore the live demo in your browser.
          Data is stored separately in each mode.
        </p>
        {downloadError && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {downloadError}
          </p>
        )}

        <section className="mt-12 rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Install instructions</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Download and unzip the file.</li>
            <li>
              Open <code className="rounded bg-muted px-1 py-0.5">chrome://extensions</code>.
            </li>
            <li>
              Enable <strong>Developer mode</strong> (top-right toggle).
            </li>
            <li>
              Click <strong>Load unpacked</strong> and pick the unzipped folder.
            </li>
            <li>Open a new tab - KnowledgeOS takes over.</li>
          </ol>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Feature title="Block-based storage">
            Pages are stored as compact Tiptap/ProseMirror JSON in IndexedDB, LZString-compressed.
            No rendered HTML or duplicate markdown is ever persisted.
          </Feature>
          <Feature title="Workspace + sidebar">
            Favorites, recent, and category sections (System Design, Backend, DSA, Databases, …)
            with nested pages and ⌘K search.
          </Feature>
          <Feature title="Notion-style editor">
            Slash commands, headings, lists, checklists, quotes, code blocks, dividers - auto-saved,
            keyboard-first.
          </Feature>
          <Feature title="Themes">
            7 built-in themes - Light/Dark, Midnight, Dracula, Solarized, Forest, Ocean - switched
            via CSS variables.
          </Feature>
        </section>
      </div>
    </div>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
