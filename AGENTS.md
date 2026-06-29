# AGENTS.md - MyMemos AI Operating Manual

> **Audience:** Cursor agents, Claude Code, Copilot Workspace, and human reviewers evaluating AI-assisted engineering depth (e.g. Forward Deployed Engineer workflows).
>
> **Product:** **MyMemos** - local-first personal knowledge OS that replaces Chrome's New Tab. Treat **MyMemos** / `mymemos` as canonical.

This document is the **source of truth** for how an AI agent should reason about, modify, and verify this codebase. It complements human docs (`README.md`, `CONTRIBUTING.md`) with machine-oriented invariants, decision trees, and verification contracts.

---

## 1. Repository topology (three surfaces, one product)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ SURFACE A - Landing site (`src/`, TanStack Start, React 19, Tailwind 4) │
│   Routes: `/` (marketing + download), SSR via Nitro                      │
│   Constants: `src/lib/constants.ts`                                    │
│   Do NOT import extension code directly                                │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ `/demo/` embeds built SPA
┌───────────────────────────────▼──────────────────────────────────────────┐
│ SURFACE B - Web demo (`extension/` → `public/demo/`, React 18)           │
│   Entry: `extension/index.html`, build: `vite.web.config.ts`             │
│   Settings: `localStorage` · Pages: IndexedDB (separate origin)        │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ same `extension/src/` source
┌───────────────────────────────▼──────────────────────────────────────────┐
│ SURFACE C - Chrome extension (`extension/` → `dist/`, MV3 + CRXJS)      │
│   Entry: `extension/newtab.html`, overrides New Tab                    │
│   Settings: `chrome.storage.local` · Pages: IndexedDB                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Path alias warning

`@/*` resolves to **different roots** depending on which `tsconfig` is active:

| Package | Alias `@/` → |
|---------|----------------|
| Root / landing | `src/*` |
| Extension | `extension/src/*` |

Before adding imports, confirm which package you are editing.

### Generated artifacts - never hand-edit

| Path | Produced by |
|------|-------------|
| `public/demo/**` | `npm run build:app` (extension web build) |
| `public/mymemos-extension.zip` | `npm run package:extension` |
| `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt` | `npm run generate:seo` (also `predev:web` / `prebuild:web`) |
| `src/routeTree.gen.ts` | TanStack Router codegen |
| `extension/dist/**` | `npm run dev` or `npm run build:extension` |
| `.output/**`, `dist/**` (root) | `npm run build:web` |

---

## 2. Mandatory pre-change protocol

Every non-trivial agent session **must** follow this sequence before writing code:

### Phase A - Classify the task

| Task class | Examples | Primary docs |
|------------|----------|--------------|
| **Extension product** | Sidebar, editor, storage, themes, search | `extension/README.md`, `.cursor/rules/extension-architecture.mdc` |
| **Landing / marketing** | Hero, scroll video, download flow | `src/routes/README.md`, `.cursor/rules/landing-site.mdc` |
| **Landing SEO / GEO** | Meta tags, FAQ schema, `llms.txt`, sitemap | `src/lib/seo.ts`, `.cursor/SKILLS.md` → `landing-seo` |
| **Build / CI / tooling** | Vite, workflows, scripts | `package.json`, `.cursor/rules/testing-ci.mdc` |
| **Cross-cutting** | Constants, naming, security | This file §3–§5 |

### Phase B - Trace data flow

Ask explicitly:

1. **Where does state live?** (Zustand vs IndexedDB vs chrome.storage/localStorage)
2. **What gets persisted?** (Block JSON only - see §3.1)
3. **Which surface(s) are affected?** (extension-only, web demo, landing, or build pipeline)
4. **Is there an existing pattern?** (grep siblings before inventing abstractions)

### Phase C - Scope the diff

- **Minimize blast radius.** One logical change per PR.
- **Match conventions** in the nearest sibling file.
- **Constants over literals.** Add to the correct `constants.ts` with JSDoc.
- **Empty strings:** use `len(value) === 0` in extension code (never `!value` for strings).

### Phase D - Verify

| Change type | Minimum verification |
|-------------|---------------------|
| Extension UI/logic | `npm run test` + manual new-tab check |
| Storage/schema | `extension/src/storage/*.test.ts` + migration review |
| Landing | `npm run dev:web` + visual check at `/` |
| Landing SEO | `npm run test -- src/lib/seo.test.ts` + `curl` `/robots.txt`, `/sitemap.xml`, `/llms.txt` |
| Build/scripts | `npm run ci` |

**CI contract:** `npm run ci` must pass before merge. It mirrors `.github/workflows/ci.yml` exactly.

---

## 3. Architectural invariants (non-negotiable)

### 3.1 Storage contract

```
┌─────────────────────────────────────────────────────────────┐
│ IndexedDB (`mymemos`)                                       │
│   pages  → LZ-compressed BlockDoc (`doc_c` field)           │
│   images → legacy blob store (unused by new attachment flow)│
├─────────────────────────────────────────────────────────────┤
│ OPFS (`mymemos-attachments/`) — per-origin, hidden          │
│   images/  → img_*.png                                      │
│   audio/   → voice_*.webm                                   │
│   (paths referenced from block attrs only)                  │
├─────────────────────────────────────────────────────────────┤
│ Settings tier (chrome.storage.local OR localStorage)        │
│   theme, lastView, customThemes, collapsedDirs              │
├─────────────────────────────────────────────────────────────┤
│ Ephemeral (never persisted)                                 │
│   FlexSearch index, UI-only state, drag refs                │
│   voiceNote blocks with status "recording"                  │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**

- Persist **ProseMirror/Tiptap block JSON** (`BlockDoc`) only. Never store rendered HTML or parallel markdown copies.
- On decode failure: fall back to `EMPTY_BLOCK_DOC`, `console.warn`, do not throw into UI.
- Schema changes require `DB_VERSION` bump and non-destructive upgrade path in `extension/src/storage/db.ts`.
- Search index rebuilds on demand - do not write FlexSearch to disk.
- **Attachments:** binary files in OPFS; block attrs hold `attachmentPath` + metadata. Run `sanitizeBlockDocForPersistence()` before save. Page delete must GC orphaned OPFS files (`collectOrphanedAttachmentPaths`).

### 3.2 Platform abstraction

`extension/src/lib/platform.ts`:

- `isExtensionContext()` → `typeof chrome?.runtime?.id === "string"`
- `isWebAppContext()` → negation

Branch settings I/O only - page data path is shared (IndexedDB). Web and extension data **do not sync** (different origins).

### 3.3 State management

Single Zustand store: `extension/src/store/useStore.ts`

| Concern | Owner |
|---------|-------|
| Pages, CRUD, workspace tree | Store actions |
| View routing (`dashboard` \| `page`) | `view` + `lastView` setting |
| Theme | Store + `data-theme` on `<html>` |
| Dialogs, sidebar UI | Store flags |
| Editor debounced saves | `PageView` + `EDITOR_SAVE_DEBOUNCE_MS` |

Prefer **selectors** (`selectSearchablePages`, etc.) for derived data. Do not duplicate tree logic in components.

### 3.4 Workspace model

- `Page.kind`: `"page"` | `"directory"`
- `Page.section`: workspace lives under `WORKSPACE_SECTION` (`"Pages"`)
- `parent_id`: `""` (root) - check with `len(parent_id) === 0`
- Drag-and-drop uses `WORKSPACE_DRAG_MIME`; validate moves via `workspace-tree.ts` helpers
- Favorites / Recent are **derived views**, not stored sections

### 3.5 Editor pipeline

```
Paste / typing → Tiptap input rules → ProseMirror doc
                ↓
         markdown paste layer (optional)
                ↓
         debounced save → encode → IndexedDB
```

Markdown paste: `extension/src/editor/markdownPaste.ts` + tests in `markdownPaste.test.ts`. Task lists (`- [x]`) must not be swallowed by bullet-list rules.

### 3.6 Landing SEO & AI discoverability

```
┌─────────────────────────────────────────────────────────────┐
│ Content source: src/lib/ai-content.json (FAQ, llms summary) │
├─────────────────────────────────────────────────────────────┤
│ Runtime helpers: src/lib/seo.ts, landing-faq-content.ts     │
├─────────────────────────────────────────────────────────────┤
│ Static output (gitignored): public/robots.txt, sitemap.xml, │
│   llms.txt ← scripts/generate-sitemap.mjs                   │
├─────────────────────────────────────────────────────────────┤
│ Dynamic route: src/routes/llms[.]txt.ts → GET /llms.txt     │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**

- Set `VITE_SITE_URL` at deploy time (no trailing slash). Drives canonical URLs, JSON-LD, FAQ demo links, and generated static SEO files.
- FAQ link segments in `ai-content.json` use `"path": "/demo/"` - never hardcode production domains in JSON.
- Keep `scripts/generate-sitemap.mjs` and `buildLlmsTxt()` in `seo.ts` structurally aligned.
- `/demo/` stays `Disallow` in `robots.txt` (`SEO_ROBOTS_DISALLOW_PATHS`).

**Verify:**

```bash
npm run generate:seo
npm run test -- src/lib/seo.test.ts
npm run dev:web
curl -s http://localhost:8080/llms.txt | head
```

---

## 4. Decision trees

### 4.1 "Where do I put this constant?"

```
Is it marketing copy, scroll animation, or landing paths?
  YES → src/lib/constants.ts
 NO ↓
Is it FAQ / llms.txt / AI crawler content?
  YES → src/lib/ai-content.json (+ resolve links in landing-faq-content.ts)
 NO ↓
Is it SEO meta, JSON-LD, robots, or sitemap builders?
  YES → src/lib/seo.ts (+ scripts/generate-sitemap.mjs for static files)
 NO ↓
Is it used by extension, editor, storage, or themes?
  YES → extension/src/lib/constants.ts
  NO ↓
Is it build-time only (Vite, manifest)?
  YES → colocate in config with a short comment
```

### 4.2 "Which dev server do I run?"

```
Editing extension UI (Sidebar, Editor, Store)?
  → npm run dev
  → Load unpacked from extension/dist/
  → NEVER npm run build:extension during active dev (kills HMR)

Editing landing page?
  → npm run dev:web  (http://localhost:8080)
  → Includes /demo/ via web-app-dev-plugin.ts

Editing web demo only (no landing)?
  → npm run dev:app
```

### 4.3 "Do I need a test?"

```
Touches storage encode/decode, workspace move rules, markdown paste,
text helpers, or store invariants?
  YES → add/update co-located *.test.ts
  NO ↓
Pure UI tweak with no logic change?
  → manual verification sufficient unless user requests tests
```

---

## 5. Code style contract

### 5.1 Documentation

- **JSDoc** on exported constants, functions, interfaces, and non-obvious fields.
- File-level comments only for non-obvious architecture - prefer self-explanatory code.

### 5.2 Naming

| Artifact | Convention |
|----------|------------|
| React components | PascalCase, default export |
| Hooks | `use` prefix |
| Store actions | camelCase verbs |
| DB fields | snake_case (`parent_id`, `created_at`, `doc_c`) |
| CSS | `ko-` prefix, `--ko-*` variables |
| Tests | `*.test.ts` beside source |

### 5.3 Error handling

| Layer | Pattern |
|-------|---------|
| Storage decode | Safe fallback + warn |
| User actions (download) | Inline error state, no `alert()` |
| SSR | `error-capture.ts` + `ErrorComponent` in `__root.tsx` |
| Missing entities | Inline empty states |

### 5.4 Formatting & lint

- ESLint 9 flat config + Prettier
- 2-space indent, LF, UTF-8 (`.editorconfig`)
- Unused vars: prefix `_`

---

## 6. AI operating model (FDE-relevant)

This repo is maintained with **high-context, verification-driven AI pair programming**. Expected agent behaviors:

### 6.1 Read before write

Agents must inspect adjacent implementations before proposing new abstractions. Prefer extending `useStore` actions, existing editor extensions, and `constants.ts` entries over new parallel systems.

### 6.2 Prove it works

- Run commands, don't suggest them passively.
- For UI changes: describe what to click AND verify in dev server when possible.
- For regressions: reproduce → hypothesize → fix → re-run failing check.

### 6.3 Respect dual React versions

| Surface | React |
|---------|-------|
| Extension + demo | 18 |
| Landing | 19 |

Do not share React components across packages without an explicit build boundary.

### 6.4 Security & privacy posture

- Local-first: no cloud sync, no telemetry beyond optional web analytics on the landing site (if enabled)
- Never commit secrets, `.env`, or API keys.
- Report security issues per `SECURITY.md` - do not open public issues for vulnerabilities.

### 6.5 Git discipline

- **Do not commit** unless the user explicitly asks.
- **Do not force-push** `main`.
- PRs via `gh` per user rules; include test plan.

---

## 7. Domain glossary

| Term | Meaning |
|------|---------|
| **BlockDoc** | ProseMirror-compatible JSON document tree |
| **Page** | Core entity: title, metadata, `doc`, tree position |
| **Directory** | Folder node (`kind: "directory"`) in workspace tree |
| **Workspace** | User-organized tree under Pages section |
| **Dashboard** | Home view: recent pages, quick create |
| **Search palette** | ⌘K fuzzy search over titles, body text, tags |
| **New Tab override** | `chrome_url_overrides.newtab` → extension UI |
| **Scroll runway** | Landing sticky-scroll section driving launch video |
| **Web demo** | Static SPA at `/demo/` for try-before-install |
| **llms.txt** | Machine-readable product summary for AI crawlers |
| **GEO** | Generative Engine Optimization - structured FAQ/schema for AI search |

---

## 8. Related files

| File | Purpose |
|------|---------|
| [`.cursor/SKILLS.md`](.cursor/SKILLS.md) | Task → skill/workflow routing |
| [`.cursor/rules/`](.cursor/rules/) | Scoped Cursor rules (`.mdc`) |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Human contributor guide |
| [`extension/README.md`](extension/README.md) | Extension architecture deep-dive |
| [`src/routes/README.md`](src/routes/README.md) | TanStack Router conventions |
| [`src/lib/seo.ts`](src/lib/seo.ts) | Meta tags, JSON-LD, robots/sitemap/llms builders |
| [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs) | Static SEO file generation |

---

## 9. Quick command reference

```bash
# Full local CI (run before PR)
npm run ci

# Extension development
npm run dev
npm run dev:check --prefix extension

# Landing + embedded demo
npm run dev:web

# Regenerate gitignored SEO files in public/
npm run generate:seo

# Landing SEO unit tests
npm run test -- src/lib/seo.test.ts

# Package extension for download button
npm run package:extension

# Watch tests
npm run test:watch
```

---

*Last structured for AI consumption. When human docs and this file diverge, trust generated artifacts and `package.json` scripts as runtime truth, then update this file.*
