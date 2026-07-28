# MyMemos

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A Notion-style notes app that replaces your browser New Tab.** Local-first, offline, no account.

Same React UI in two places:

| Where                 | URL / install                          | Storage                      |
| --------------------- | -------------------------------------- | ---------------------------- |
| **Browser extension** | Load `extension/dist/` in your browser | IndexedDB + `chrome.storage` |
| **Live demo**         | `/demo/` on the landing site           | IndexedDB + `localStorage`   |

Extension data and demo data are separate (different origins).

**Contributing / AI agents:** See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md) for architecture invariants, scoped Cursor rules (`.cursor/rules/`), and skill routing (`.cursor/SKILLS.md`).

---

## Quick start (extension)

**Requires:** Node `>= 20.19.0` ([`.nvmrc`](.nvmrc) recommends `24.16.0`), npm, and a Chromium-based browser with extension support.

```bash
git clone https://github.com/aryancodes-tech/my-memos.git
cd my-memos
nvm use                    # optional
npm install
npm install --prefix extension
npm run dev                # extension HMR on :5173
```

Then in your browser:

1. Open the extensions page → **Developer mode** on
2. **Load unpacked** → select `extension/dist/`
3. Name should be **MyMemos (Dev)** - open a **new tab**

Keep `npm run dev` running while you edit. If HMR stalls: `npm run dev:reset --prefix extension`, reload the extension, open a fresh tab.

---

## Landing site & live demo

```bash
npm run dev:web
```

| URL                               | What                                                      |
| --------------------------------- | --------------------------------------------------------- |
| http://localhost:8080/            | Marketing page + download button                          |
| http://localhost:8080/demo/       | Full app in the browser                                   |
| http://localhost:8080/robots.txt  | Crawler directives (generated)                            |
| http://localhost:8080/sitemap.xml | Indexable URLs (generated)                                |
| http://localhost:8080/llms.txt    | AI crawler summary (server route + generated static copy) |

For the download button to work locally, build the ZIP first:

```bash
npm run package:extension
```

---

## SEO & AI discoverability

The landing site ships crawler-facing files for search engines and AI systems. **Do not commit or hand-edit** the generated copies in `public/` - they are gitignored and rebuilt automatically.

| URL            | Purpose                                                                     | Source                                                                  |
| -------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/robots.txt`  | Crawler allow/disallow + sitemap pointer                                    | `scripts/generate-sitemap.mjs`                                          |
| `/sitemap.xml` | Indexable marketing URLs                                                    | `scripts/generate-sitemap.mjs`                                          |
| `/llms.txt`    | Product summary + FAQ for AI crawlers ([llmstxt.org](https://llmstxt.org/)) | `src/routes/llms[.]txt.ts` (dynamic) + static copy from generate script |

**Content sources**

- FAQ copy & llms summary: `src/lib/ai-content.json`
- Meta tags, JSON-LD, helpers: `src/lib/seo.ts`
- FAQ UI + link resolution: `src/lib/landingFaqContent.ts`, `src/components/landing/LandingFaq.tsx`

**Generate SEO files locally**

```bash
npm run generate:seo
# writes public/robots.txt, public/sitemap.xml, public/llms.txt
```

This also runs automatically before `npm run dev:web` and `npm run build:web` (`predev:web` / `prebuild:web` hooks).

**Production origin (`VITE_SITE_URL`)**

Set on your **hosting provider** (and locally when testing absolute URLs):

```bash
VITE_SITE_URL=https://www.mymemos.in
```

Without it, generated files fall back to `http://localhost:8080`. The `/llms.txt` server route resolves the request origin at runtime when `VITE_SITE_URL` is unset.

**Verify SEO changes**

```bash
npm run test -- tests/landing/lib/seo.test.ts   # meta, JSON-LD, llms.txt builders
npm run generate:seo
npm run dev:web
# curl http://localhost:8080/robots.txt
# curl http://localhost:8080/sitemap.xml
# curl http://localhost:8080/llms.txt
```

After deploy, confirm live URLs (replace with your domain): `https://www.mymemos.in/robots.txt`, `/sitemap.xml`, `/llms.txt`.

### Google Search Console: "Page with redirect"

Apex / HTTP URLs (`https://mymemos.in/`, `http://mymemos.in/`) **should not** be indexed when the canonical host is `https://www.mymemos.in/`. Google lists them under **Page with redirect** - that is expected.

What to do:

1. Set `VITE_SITE_URL=https://www.mymemos.in` (include `www`, HTTPS, no trailing slash).
2. Prefer **one** Search Console property for the canonical host (`https://www.mymemos.in`), or a Domain property covering all variants.
3. Submit / inspect **`https://www.mymemos.in/`** (not the apex) and request indexing there.
4. Submit the sitemap: `https://www.mymemos.in/sitemap.xml`.
5. On your host, configure a **permanent** redirect (301/308) from apex → www. This repo includes `vercel.json` for that; other hosts need an equivalent rule. After deploy, `curl -sI https://mymemos.in/` should show `301` or `308` to `https://www.mymemos.in/`.

Do **not** try to get apex URLs indexed separately - that splits ranking signals.

---

## Commands

All commands run from the **repo root** unless noted.

| Command                     | What it does                                                      |
| --------------------------- | ----------------------------------------------------------------- |
| `npm run dev`               | Extension dev server (port 5173)                                  |
| `npm run dev:web`           | Landing + `/demo/` (port 8080)                                    |
| `npm run generate:seo`      | Regenerate `public/robots.txt`, `sitemap.xml`, `llms.txt`         |
| `npm run dev:app`           | Demo only (port 5174)                                             |
| `npm run build:extension`   | Production extension → `extension/dist/`                          |
| `npm run package:extension` | Zip extension → `public/mymemos-extension.zip` (landing download) |
| `npm run build:web`         | Demo build + landing production build                             |
| `npm run preview`           | Preview production landing build                                  |
| `npm run check`             | Lint, format, typecheck, tests (also runs on pre-push)            |
| `npm run ci`                | `check` + extension and web builds (GitHub Actions)               |

**Dev tip:** Don't run `build:extension` while actively developing - it replaces the dev bundle in `dist/`. Use `npm run dev` for day-to-day work.

Extension-only helpers: `npm run dev:reset --prefix extension`, `npm run dev:check --prefix extension`.

---

## Deploy the landing site

Landing page + `/demo/` deploy together as a Node/SSR app (TanStack Start + Nitro). The browser extension does **not** run on your host - only the ZIP download (if you build it).

Works on any hosting provider (Netlify, AWS, Fly.io, a VPS, etc.). Example build settings:

| Setting | Value                                                                                                       |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| Install | `npm ci && npm ci --prefix extension`                                                                       |
| Build   | `npm run package:extension && npm run build:web`                                                            |
| Node    | 20.x or 24.x (`>= 20.19.0`)                                                                                 |
| Env     | `VITE_SITE_URL=https://www.example.com` (canonical origin - use your preferred host, usually `www` + HTTPS) |

Point apex and HTTP variants at that canonical origin with a **permanent** (301/308) redirect. See `vercel.json` for a www example, or configure the same rule on Netlify / nginx / your CDN.

The landing site optionally includes web analytics via `@vercel/analytics` in `src/routes/__root.tsx` - remove or swap it if your host uses a different analytics tool. The `/demo/` SPA is a separate static bundle and is not tracked by that component.

---

## What's in the repo

```
my-memos/
├── extension/     # Core app - editor, sidebar, storage (browser extension + /demo/)
├── shared/        # Shared product constants (`shared/constants.ts`)
├── src/           # Landing site (TanStack Start)
├── public/demo/   # Built web demo (generated - do not edit)
└── package.json   # Root scripts
```

Architecture, storage design, and extension internals → [`extension/README.md`](extension/README.md).

---

## Features (shipped)

- **New Tab workspace** - dashboard, nested pages & folders, drag-and-drop tree, favorites, recent
- **Block editor** - slash commands, toolbar, headings, lists/tasks, tables, code blocks, colors, markdown paste
- **Attachments** - images (picker / drop / paste) and voice notes (inline record or attach audio) stored in OPFS
- **`⌘K` search** - FlexSearch over titles and page body text (in-memory index)
- **Themes** - 7 built-ins + custom themes
- **Local-first persistence** - page BlockDoc JSON in IndexedDB (compressed); settings in `chrome.storage.local` (extension) or `localStorage` (web demo)

Not shipped as user features today: tag editing UI, archive UI, workspace export/import UI, cloud sync. See [`AGENTS.md`](AGENTS.md) §2.5 for the agent-facing inventory.

---

## Privacy

- Notes and attachments stay in the browser (IndexedDB + OPFS) - no backend, no account
- Extension works offline after install (dev mode uses `localhost` for HMR only; the landing marketing video is CDN-hosted and unrelated to note storage)
- Uninstalling removes extension storage

---

## Troubleshooting

| Problem                                   | Fix                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Edits don't show up                       | `npm run dev:reset --prefix extension` → reload extension → new tab    |
| Extension named **MyMemos** not **(Dev)** | You loaded a prod build - run `npm run dev` again                      |
| Download button 404 on landing            | Run `npm run package:extension` first                                  |
| Can't find `public/llms.txt` in git       | Expected - gitignored; run `npm run generate:seo` or `npm run dev:web` |
| SEO files show `localhost` URLs           | Set `VITE_SITE_URL` and rebuild/redeploy                               |
| GSC "Page with redirect" for apex / HTTP  | Expected - index `https://www…/` only; use permanent apex→www redirect |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run `npm run ci` before opening a PR.

[Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) - Copyright (c) 2026 MyMemos Contributors
