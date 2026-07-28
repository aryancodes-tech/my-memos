# MyMemos

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A Notion-style notes app that replaces your browser New Tab.** Local-first, offline, no account.

| Surface               | How to run                         | Where data lives             |
| --------------------- | ---------------------------------- | ---------------------------- |
| **Browser extension** | Load unpacked from `extension/dist/` | IndexedDB + `chrome.storage` |
| **Live demo**         | `/demo/` on the landing site       | IndexedDB + `localStorage`   |

Extension and demo data do not sync (different origins).

---

## Quick start

**Requires:** Node `>= 20.19.0` (see [`.nvmrc`](.nvmrc)), npm, and a Chromium-based browser.

```bash
git clone https://github.com/aryancodes-tech/my-memos.git
cd my-memos
npm install
npm install --prefix extension
npm run dev                # extension HMR on :5173
```

Then load the extension:

1. Extensions page → **Developer mode** on
2. **Load unpacked** → `extension/dist/`
3. Confirm the name is **MyMemos (Dev)** → open a **new tab**

Keep `npm run dev` running while you edit. Do **not** run `build:extension` during day-to-day work — it replaces the HMR bundle.

**Landing + demo** (no extension install):

```bash
npm run dev:web            # http://localhost:8080/  and  /demo/
```

For the landing download button locally: `npm run package:extension`.

---

## Common commands

| Command                     | What it does                                      |
| --------------------------- | ------------------------------------------------- |
| `npm run dev`               | Extension dev server (`:5173`)                    |
| `npm run dev:web`           | Landing + `/demo/` (`:8080`)                      |
| `npm run check`             | Lint, format, typecheck, tests (also on pre-push) |
| `npm run ci`                | `check` + production builds (what GitHub runs)    |
| `npm run package:extension` | Zip → `public/mymemos-extension.zip`              |

More commands and workflow details: [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Repo layout

```
my-memos/
├── extension/   # Product UI — editor, sidebar, storage (extension + /demo)
├── shared/      # Shared product constants
├── src/         # Landing site (TanStack Start)
└── public/demo/ # Built web demo (generated — do not edit)
```

Architecture deep-dive: [`extension/README.md`](extension/README.md).

---

## Features

- New Tab workspace with nested pages & folders, drag-and-drop, favorites, recent
- Block editor: slash commands, toolbar, markdown paste, tables, code blocks
- Images and voice notes stored locally (OPFS)
- ⌘K search over titles and page text
- Themes (built-in + custom)
- Fully local — no account, no sync server

---

## Privacy

Notes and attachments stay in your browser. Uninstalling the extension removes its storage. Full policy: [mymemos.in/privacy](https://www.mymemos.in/privacy).

---

## Troubleshooting

| Problem                        | Fix                                                                 |
| ------------------------------ | ------------------------------------------------------------------- |
| Edits don't show up            | `npm run dev:reset --prefix extension` → reload extension → new tab |
| Extension named **MyMemos**    | Prod build loaded — run `npm run dev` again                         |
| Download button 404 on landing | Run `npm run package:extension`                                     |

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Run `npm run ci` before opening a PR.

[Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) — Copyright (c) 2026 MyMemos Contributors
