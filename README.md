# KnowledgeOS

[![CI](https://github.com/aryancodes-tech/knowledge-os/actions/workflows/ci.yml/badge.svg)](https://github.com/aryancodes-tech/knowledge-os/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Personal knowledge management as a Chrome extension, with an optional landing site for downloads.

**Local-first · Offline-only · No backend**

## Repository layout

| Path                               | Purpose                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `extension/`                       | **Core product** — Chrome MV3 extension (new tab, editor, storage, themes) |
| `src/`                             | Marketing / download landing page                                          |
| `public/knowledgeos-extension.zip` | Packaged extension (generated — not committed)                             |

## Quick start (extension development)

```bash
npm install
npm install --prefix extension

npm run dev          # extension dev server with HMR
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/dist/`
4. Confirm the name is **KnowledgeOS (Dev)**
5. Open a **new tab**

Keep `npm run dev` running. Do **not** run `npm run build:extension` during development — it replaces the dev bundle and disables live reload.

```bash
npm run dev:check --prefix extension   # verify dev setup
```

## Scripts

| Command                     | Description                                   |
| --------------------------- | --------------------------------------------- |
| `npm run dev`               | Extension dev server with HMR                 |
| `npm run dev:web`           | Landing site dev server                       |
| `npm run build:extension`   | Production extension build                    |
| `npm run package:extension` | Build + zip + copy to `public/` for downloads |
| `npm run build:web`         | Production landing site build                 |
| `npm run lint`              | ESLint (web + extension)                      |
| `npm run typecheck`         | TypeScript check (web + extension)            |
| `npm run test`              | Vitest unit tests                             |
| `npm run ci`                | Full CI pipeline locally                      |

## Release workflow

```bash
npm run package:extension
```

This builds the extension, creates `extension/knowledgeos-extension.zip`, and copies it to `public/knowledgeos-extension.zip` for the download button on the landing page.

## Architecture

- **Extension**: React + Zustand + Tiptap + IndexedDB — see [`extension/README.md`](extension/README.md)
- **Landing site**: TanStack Start + Tailwind v4 (single route at `/`)

The two apps are intentionally separate today — no shared packages yet. Toolchain versions differ (React 18 vs 19, Tailwind 3 vs 4) by design until a shared workspace is introduced.

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and the PR checklist.

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) — Copyright (c) 2026 KnowledgeOS Contributors
