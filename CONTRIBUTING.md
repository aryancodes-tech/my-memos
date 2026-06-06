# Contributing to MyMemos

Thank you for your interest in contributing. This guide covers setup, workflow, and what we expect in pull requests.

## Prerequisites

- **Node.js** - use the version in [`.nvmrc`](.nvmrc) (`nvm use` recommended)
- **npm** - canonical package manager for this repo
- **Google Chrome** - for loading the unpacked extension during development

## Getting started

```bash
git clone https://github.com/aryancodes-tech/my-memos.git
cd my-memos

npm install
npm install --prefix extension

npm run dev          # extension dev server (from repo root)
```

Load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/dist/`
4. Confirm the name is **MyMemos (Dev)**
5. Open a **new tab**

Keep `npm run dev` running. Do **not** run `npm run build:extension` during active development - it replaces the dev bundle and disables HMR.

```bash
npm run dev:check --prefix extension   # verify dev setup
```

### Web app (same UI, no Chrome install)

The extension React app also builds as a standalone browser app at `/demo/`.

```bash
npm run dev:web    # landing site + web app at http://localhost:8080/demo/
```

Settings use `localStorage` instead of `chrome.storage`; pages still use IndexedDB. Data is **not shared** with the Chrome extension (different origins).

After changing extension UI code, `npm run dev:web` picks up changes via HMR at `/demo/`.

## Project layout

| Path                     | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `extension/`             | Core product - Chrome MV3 extension      |
| `src/`                   | Landing / download site (TanStack Start) |
| `extension/src/storage/` | IndexedDB layer and document codec       |
| `extension/src/lib/`     | Shared utilities and constants           |
| `extension/src/editor/`  | Tiptap editor, slash menu, toolbar       |

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

| Command                   | Description                   |
| ------------------------- | ----------------------------- |
| `npm run lint`            | ESLint across the repo        |
| `npm run format`          | Prettier write                |
| `npm run format:check`    | Prettier check (CI)           |
| `npm run typecheck`       | TypeScript - web + extension  |
| `npm run test`            | Vitest unit tests             |
| `npm run build:extension` | Production extension build    |
| `npm run build:web`       | Production landing site build |

## Code conventions

- **Constants** - put magic values in `extension/src/lib/constants.ts`
- **Empty strings** - use `len(value) > 0` from `extension/src/lib/text.ts`
- **Storage** - persist block JSON only; never store rendered HTML or markdown
- **Types** - keep domain models in `extension/src/storage/types.ts`
- **Unused variables** - prefix with `_` if intentionally unused (ESLint enforces this)

## Testing

Tests live next to the code they cover (`*.test.ts`). Start with pure functions in:

- `extension/src/storage/codec.ts` - document compression round-trip
- `extension/src/lib/text.ts` - plain-text extraction
- `extension/src/lib/themes.ts` - hex normalization and theme helpers

Add tests for new logic, especially storage, state management, and parsing.

## Pull request checklist

- [ ] `npm run ci` passes locally
- [ ] Changes are scoped to the stated problem
- [ ] New behavior has tests where practical
- [ ] Public APIs and constants are documented
- [ ] README or `extension/README.md` updated if workflow or architecture changed

## Reporting issues

- **Bugs** - use the bug report template; include Chrome version and reproduction steps
- **Features** - describe the problem you're solving, not just the solution
- **Security** - see [SECURITY.md](SECURITY.md); do not open public issues for vulnerabilities

## Release artifacts

Extension ZIPs for the landing page are built via:

```bash
npm run package:extension
```

Do not commit `public/mymemos-extension.zip` - CI and release workflows build it on demand.
