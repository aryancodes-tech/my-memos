# Contributing to MyMemos

Thank you for your interest in contributing. This guide covers setup, workflow, and what we expect in pull requests.

## Prerequisites

- **Node.js** - use the version in [`.nvmrc`](.nvmrc) (`nvm use` recommended)
- **npm** - canonical package manager for this repo
- **Chromium-based browser** - for loading the unpacked extension during development (Edge, Brave, Arc, Chromium, etc.)

## Getting started

```bash
git clone https://github.com/aryancodes-tech/my-memos.git
cd my-memos

npm install
npm install --prefix extension

npm run dev          # extension dev server (from repo root)
```

Load the extension in your browser:

1. Open your browser's extensions page
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/dist/`
4. Confirm the name is **MyMemos (Dev)**
5. Open a **new tab**

Keep `npm run dev` running. Do **not** run `npm run build:extension` during active development - it replaces the dev bundle and disables HMR.

```bash
npm run dev:check --prefix extension   # verify dev setup
```

### Web app (same UI, no extension install)

The extension React app also builds as a standalone browser app at `/demo/`.

```bash
npm run dev:web    # landing site + web app at http://localhost:8080/demo/
```

Settings use `localStorage` instead of `chrome.storage`; pages still use IndexedDB. Data is **not shared** with the browser extension (different origins).

After changing extension UI code, `npm run dev:web` picks up changes via HMR at `/demo/`.

## Project layout

| Path                     | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `extension/`             | Core product - MV3 browser extension + web demo       |
| `shared/`                | Shared product constants (`constants.ts`)             |
| `src/`                   | Landing / download site (TanStack Start)              |
| `extension/src/storage/` | IndexedDB layer and document codec                    |
| `extension/src/lib/`     | Shared utilities; `constants.ts` re-exports `shared/` |
| `extension/src/editor/`  | Tiptap editor, slash menu, toolbar                    |

See [`extension/README.md`](extension/README.md) for architecture details.

## Development workflow

1. **Branch** from `main` using a descriptive name (`feat/slash-menu-icons`, `fix/theme-regression`)
2. **Make focused changes** - one logical change per PR when possible
3. **Run checks** before opening a PR:

```bash
npm run ci
```

This runs lint, typecheck, tests, and production builds for both apps.

Individual commands:

| Command                   | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `npm run lint`            | ESLint across the repo                                    |
| `npm run format`          | Prettier write                                            |
| `npm run format:check`    | Prettier check (CI)                                       |
| `npm run typecheck`       | TypeScript - web + extension                              |
| `npm run test`            | Vitest unit tests                                         |
| `npm run generate:seo`    | Regenerate `public/robots.txt`, `sitemap.xml`, `llms.txt` |
| `npm run build:extension` | Production extension build                                |
| `npm run build:web`       | Production landing site build                             |

## AI-assisted development

This repo includes structured agent documentation for Cursor and other AI coding tools:

| Doc                                      | Purpose                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)                 | Architecture invariants, shipped capabilities (§2.5), verification contracts |
| [`.cursor/SKILLS.md`](.cursor/SKILLS.md) | Task → skill routing (extension, storage, editor, landing, CI)               |
| [`.cursor/rules/`](.cursor/rules/)       | Scoped rules injected by file type (`.mdc`)                                  |
| [`.cursor/README.md`](.cursor/README.md) | Index of the above                                                           |

Human contributors benefit from the same docs - especially `AGENTS.md` §3 (storage invariants) before your first storage or editor PR.

## Code conventions

- **Constants** - single source: `shared/constants.ts`. Landing/extension `*/lib/constants.ts` only re-export. Import via `@/lib/constants`; do not hardcode strings in components. See `.cursor/rules/constants-policy.mdc` and `AGENTS.md` §3.8. FAQ/AI crawler prose stays in `src/lib/ai-content.json`.
- **Empty strings** - use `len(value) === 0` / `len(value) > 0` from `extension/src/lib/text.ts` (never `!value` for strings)
- **Storage** - persist block JSON only; attachment binaries go in OPFS (paths in block attrs)
- **Capabilities** - do not document schema-only / unwired APIs as user features (`AGENTS.md` §2.5)
- **Types** - keep domain models in `extension/src/storage/types.ts`
- **Unused variables** - prefix with `_` if intentionally unused (ESLint enforces this)

## Testing

Tests live under `tests/` and **mirror** source paths (see [`tests/README.md`](tests/README.md)):

| Source                           | Test                                    |
| -------------------------------- | --------------------------------------- |
| `extension/src/storage/codec.ts` | `tests/extension/storage/codec.test.ts` |
| `extension/src/lib/text.ts`      | `tests/extension/lib/text.test.ts`      |
| `extension/src/lib/themes.ts`    | `tests/extension/lib/themes.test.ts`    |
| `src/lib/seo.ts`                 | `tests/landing/lib/seo.test.ts`         |

Add tests for new logic at the mirrored path, especially storage, state management, and parsing.

### Landing SEO

FAQ / llms copy: `src/lib/ai-content.json`. Builders: `src/lib/seo.ts`. Generated files in `public/` (`robots.txt`, `sitemap.xml`, `llms.txt`) are **gitignored** — regenerate with:

```bash
npm run generate:seo
npm run test -- tests/landing/lib/seo.test.ts
```

`npm run generate:seo` also runs via `predev:web` / `prebuild:web`. Set `VITE_SITE_URL` (e.g. `https://www.mymemos.in`, no trailing slash) on the host so canonical URLs are correct; without it, generated files fall back to `http://localhost:8080`.

Apex / HTTP hosts should **301/308** to that canonical origin (`vercel.json` is an example). Google Search Console “Page with redirect” on apex is expected — only index the canonical `www` host.

## Deploy the landing site

Landing + `/demo/` deploy as a Node/SSR app (TanStack Start + Nitro). The extension itself does not run on the host — only the download ZIP if you build it.

| Setting | Value                                                            |
| ------- | ---------------------------------------------------------------- |
| Install | `npm ci && npm ci --prefix extension`                            |
| Build   | `npm run package:extension && npm run build:web`                 |
| Node    | `>= 20.19.0`                                                     |
| Env     | `VITE_SITE_URL=https://www.example.com` (canonical HTTPS origin) |

## Pull request checklist

- [ ] `npm run ci` passes locally
- [ ] Changes are scoped to the stated problem
- [ ] New behavior has tests where practical
- [ ] Public APIs and constants are documented
- [ ] README or `extension/README.md` updated if workflow or architecture changed

## Reporting issues

- **Bugs** - use the bug report template; include browser version and reproduction steps
- **Features** - describe the problem you're solving, not just the solution
- **Security** - see [SECURITY.md](SECURITY.md); do not open public issues for vulnerabilities

## Release artifacts

Extension ZIPs for Chrome Web Store uploads (and optional sideloading) are produced at `public/mymemos-extension.zip`.

```bash
npm run package:extension
```

End users install from the [Chrome Web Store](https://chromewebstore.google.com/detail/mymemos/hdcanofeenpjkbbfpgcalbobeolbffbi); landing CTAs use `/install` as an analytics hop to that listing.

A **pre-push hook** auto-fixes Prettier/ESLint formatting when possible, then runs `npm run check` (lint, format, typecheck, tests). If files were rewritten, commit them and push again. Full builds remain on `npm run ci` and GitHub Actions. Skip with `SKIP_PRE_PUSH_CI=1` only when necessary.
