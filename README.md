# MyMemos

[![CI](https://github.com/aryancodes-tech/my-memos/actions/workflows/ci.yml/badge.svg)](https://github.com/aryancodes-tech/my-memos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A Notion-style notes app that replaces your Chrome New Tab.** Local-first, offline, no account.

Same React UI in two places:

| Where | URL / install | Storage |
| ----- | ------------- | ------- |
| **Chrome extension** | Load `extension/dist/` in Chrome | IndexedDB + `chrome.storage` |
| **Live demo** | `/demo/` on the landing site | IndexedDB + `localStorage` |

Extension data and demo data are separate (different origins).

---

## Quick start (extension)

**Requires:** Node `>= 20.19.0` ([`.nvmrc`](.nvmrc) recommends `24.16.0`), npm, Chrome.

```bash
git clone https://github.com/aryancodes-tech/my-memos.git
cd my-memos
nvm use                    # optional
npm install
npm install --prefix extension
npm run dev                # extension HMR on :5173
```

Then in Chrome:

1. `chrome://extensions` → **Developer mode** on
2. **Load unpacked** → select `extension/dist/`
3. Name should be **MyMemos (Dev)** — open a **new tab**

Keep `npm run dev` running while you edit. If HMR stalls: `npm run dev:reset --prefix extension`, reload the extension, open a fresh tab.

---

## Landing site & live demo

```bash
npm run dev:web
```

| URL | What |
| --- | ---- |
| http://localhost:8080/ | Marketing page + download button |
| http://localhost:8080/demo/ | Full app in the browser |

For the download button to work locally, build the ZIP first:

```bash
npm run package:extension
```

---

## Commands

All commands run from the **repo root** unless noted.

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Extension dev server (port 5173) |
| `npm run dev:web` | Landing + `/demo/` (port 8080) |
| `npm run dev:app` | Demo only (port 5174) |
| `npm run build:extension` | Production extension → `extension/dist/` |
| `npm run package:extension` | Zip extension → `public/mymemos-extension.zip` |
| `npm run build:web` | Demo build + landing production build |
| `npm run preview` | Preview production landing build |
| `npm run ci` | Full local CI (lint, test, build) |

**Dev tip:** Don't run `build:extension` while actively developing — it replaces the dev bundle in `dist/`. Use `npm run dev` for day-to-day work.

Extension-only helpers: `npm run dev:reset --prefix extension`, `npm run dev:check --prefix extension`.

---

## Deploy to Vercel

Landing page + `/demo/` deploy together. The Chrome extension does **not** run on Vercel — only the ZIP download (if you build it).

**Vercel project settings:**

| Setting | Value |
| ------- | ----- |
| Install | `npm ci && npm ci --prefix extension` |
| Build | `npm run package:extension && npm run build:web` |
| Node | 20.x or 24.x (`>= 20.19.0`) |

Enable **Analytics** in the Vercel dashboard if you want traffic on the landing site. The `/demo/` SPA is a separate static bundle and is not tracked by that component.

---

## What's in the repo

```
my-memos/
├── extension/     # Core app — editor, sidebar, storage (Chrome + /demo/)
├── src/           # Landing site (TanStack Start)
├── public/demo/   # Built web demo (generated — do not edit)
└── package.json   # Root scripts
```

Architecture, storage design, and extension internals → [`extension/README.md`](extension/README.md).

---

## Features (short list)

- New Tab override, dashboard, nested pages & folders
- Tiptap editor with slash commands, toolbar, code blocks
- `⌘K` search (FlexSearch, in-memory)
- 7 themes + custom themes
- Auto-save to IndexedDB (compressed block JSON only)

---

## Privacy

- Notes stay in the browser — no backend, no account
- Extension works offline after install (dev mode uses `localhost` for HMR only)
- Uninstalling removes extension storage

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Edits don't show up | `npm run dev:reset --prefix extension` → reload extension → new tab |
| Extension named **MyMemos** not **(Dev)** | You loaded a prod build — run `npm run dev` again |
| Download button 404 on landing | Run `npm run package:extension` first |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run `npm run ci` before opening a PR.

[Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) — Copyright (c) 2026 MyMemos Contributors
