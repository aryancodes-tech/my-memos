# KnowledgeOS - Chrome Extension

Notion-inspired personal knowledge management and learning dashboard. Ships as a **Chrome extension** (New Tab override) and as a **standalone web app** at `/demo/` using the same `src/` React code.

## Architecture highlights

- **Manifest V3** - service worker (`background.js`), `chrome_url_overrides.newtab` → `newtab.html`.
- **Block-based storage** - every page is a Tiptap/ProseMirror JSON `doc`. We **never** persist rendered HTML or markdown. Plain text is extracted on the fly for the search index.
- **Compact, compressed JSON** - documents are LZString-compressed before being written to IndexedDB. Schema is versioned via the IDB upgrade hook so future fields (AI metadata, backlinks, version history) can be added without migrations.
- **Two-tier storage** - IndexedDB for documents; `chrome.storage.local` for lightweight settings (theme, last opened view, custom themes).
- **In-memory FlexSearch index** - rebuilt on demand, never persisted (no duplicate data on disk).
- **Themes via CSS variables** - 7 built-in themes, switched by toggling `data-theme` on `<html>`.

## Project layout

```
extension/
├── public/
│   ├── background.js     ← service worker
│   └── icons/            ← 16/48/128 px PNGs
├── manifest.config.ts    ← MV3 manifest (CRXJS source of truth)
├── newtab.html           ← Chrome extension entry (new-tab page)
├── index.html            ← Web app entry (standalone SPA)
├── src/
│   ├── App.tsx           ← root, keyboard shortcuts, view router
│   ├── components/       ← Sidebar, SearchPalette
│   ├── editor/           ← Tiptap editor + slash menu
│   ├── views/            ← Dashboard, PageView
│   ├── store/            ← Zustand store
│   ├── storage/          ← IndexedDB + LZString + chrome.storage
│   └── lib/              ← helpers
├── vite.config.ts        ← Chrome extension build (CRXJS)
├── vite.web.config.ts    ← Web app build → public/demo/
└── package.json
```

## Web app (browser, no install)

```bash
npm run dev:web          # from extension/, or npm run dev:app from repo root
```

Open `http://localhost:8080/demo/` when the landing site is running (`npm run dev:web` from root), or `http://localhost:5174/demo/` when using `npm run dev:web` from `extension/` alone.

Production build:

```bash
npm run build:web        # outputs to public/demo/ for the landing site deploy
```

Settings persist via `localStorage`; pages use the same IndexedDB layer. Web and extension data are separate (different browser origins).

## Develop extension (hot reload)

```bash
cd extension
npm install
npm run dev
```

Then in Chrome (one-time setup):

1. Visit `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder
5. Confirm the extension name is **KnowledgeOS (Dev)** - not plain "KnowledgeOS"
6. Open a **new tab** - KnowledgeOS takes over

Keep `npm run dev` running. UI changes should hot-reload in open tabs. If they do not, open a fresh tab.

### Important: dev vs production `dist/`

| Command         | What lands in `dist/`                        | Chrome extension name |
| --------------- | -------------------------------------------- | --------------------- |
| `npm run dev`   | Dev build (loads from `localhost:5173`, HMR) | **KnowledgeOS (Dev)** |
| `npm run build` | Production bundle (static files, no HMR)     | **KnowledgeOS**       |

**Do not run `npm run build` while developing.** It replaces the dev `dist/` output. After a production build, extension reload only shows old bundled code until you rebuild again - that is the issue most people hit.

`npm run dev` now runs `predev`, which clears `dist/` and `.vite/` first so CRXJS always generates a fresh dev build.

### If changes still do not appear

```bash
# Stop the running dev server (Ctrl+C), then:
npm run dev:reset
```

Then in Chrome:

1. Go to `chrome://extensions`
2. Click **Reload** on KnowledgeOS **(Dev)** - or Remove and Load unpacked again on `extension/dist/`
3. Open a **new tab** (existing new tabs may keep old code)

Verify setup:

```bash
npm run dev:check
```

This fails if `dist/manifest.json` is a production build.

**Fallback (no HMR):** `npm run dev:watch` rebuilds `dist/` on every save; click **Reload** on the extension card after each change.

## Production build

```bash
cd extension
npm run build
```

Stop `npm run dev` first. Reload the unpacked extension after a production build. The name will show as **KnowledgeOS** (no Dev suffix).

## Package as a ZIP

```bash
npm run package   # produces extension/knowledgeos-extension.zip
```

## Contributing

See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for setup, conventions, and the PR checklist. Run `npm run ci` from the repo root before opening a pull request.

## Roadmap-ready

The storage schema and module boundaries are designed so the following can be added without data migrations:

- AI search / summaries / flashcards (reads the same block JSON)
- Backlinks & page mentions (graph built dynamically from blocks)
- Cloud sync (Google Drive / GitHub / custom) - same block JSON on the wire
- Version history (append-only snapshots in a sibling object store)
