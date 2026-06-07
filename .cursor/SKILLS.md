# SKILLS.md — Agent Skill Router for MyMemos

> Maps **task intent** → **required reading** → **verification steps**.
> Use this file to choose depth before touching code. Designed for reproducible AI-assisted engineering.

---

## How to use this file

1. Identify the **skill ID** closest to the user's request.
2. Load the linked `.cursor/rules/*.mdc` files and architecture docs.
3. Execute the **Verification contract** before declaring done.
4. If the task spans multiple skills, apply them in the order listed under **Composition**.

---

## Skill catalog

### `core-onboard`

**When:** Any new session, unfamiliar task, or cross-package change.

**Read:**

- `AGENTS.md` §1–§3
- `.cursor/rules/00-project-core.mdc`

**Verify:** You can answer: which surface(s), which storage tier(s), which `constants.ts`.

---

### `extension-feature`

**When:** Sidebar, dashboard, page view, dialogs, themes, search palette, keyboard shortcuts.

**Read:**

- `extension/README.md`
- `.cursor/rules/extension-architecture.mdc`
- `extension/src/store/useStore.ts` (relevant actions)

**Patterns:**

- UI state → Zustand
- Persistent preferences → settings tier
- Page content → store action → `db.ts`

**Verify:**

```bash
npm run dev          # manual new-tab exercise
npm run test         # if store/tree logic touched
```

---

### `storage-migration`

**When:** IndexedDB schema, codec, compression, page CRUD, image blobs.

**Read:**

- `.cursor/rules/storage-invariants.mdc`
- `extension/src/storage/db.ts`
- `extension/src/storage/codec.ts`

**Invariants:**

- Block JSON only in `doc_c`
- `DB_VERSION` bump + upgrade handler for schema changes
- Corrupt decode → `EMPTY_BLOCK_DOC`

**Verify:**

```bash
npm run test -- extension/src/storage/
```

---

### `editor-markdown`

**When:** Tiptap extensions, slash menu, toolbar, paste handling, task lists, tables.

**Read:**

- `.cursor/rules/editor-markdown.mdc`
- `extension/src/editor/markdownPaste.ts`
- `extension/src/editor/markdownPaste.test.ts`

**Patterns:**

- Input rules order matters (task list before bullet list)
- Use `tiptap-markdown` patterns already in repo
- Debounce saves via `EDITOR_SAVE_DEBOUNCE_MS`

**Verify:**

```bash
npm run test -- extension/src/editor/markdownPaste.test.ts
# Manual: paste GFM samples, task lists, tables
```

---

### `workspace-dnd`

**When:** Folder tree, drag-and-drop, root drop pad, move validation.

**Read:**

- `extension/src/lib/workspace-tree.ts`
- `extension/src/store/moveWorkspaceItem.test.ts`
- `extension/src/components/Sidebar.tsx`

**Patterns:**

- Use `dragPageIdRef` for synchronous DnD state
- `canDropOntoFolder`, `canDropOnRoot` validators
- Constants: `WORKSPACE_DRAG_MIME`, `WORKSPACE_ROOT_PAD_HEIGHT_PX`

**Verify:**

```bash
npm run test -- extension/src/lib/workspace-tree.test.ts extension/src/store/moveWorkspaceItem.test.ts
```

---

### `landing-marketing`

**When:** Hero, nav, bento grid, scroll video, download CTA, meta/SEO.

**Read:**

- `.cursor/rules/landing-site.mdc`
- `src/lib/constants.ts`
- `src/routes/README.md`

**Patterns:**

- Marketing copy lives in `src/lib/constants.ts`
- Scroll video tunables: `LANDING_VIDEO_*`, `LANDING_MAIN_OVERLAP_VH`
- Download uses `EXTENSION_ZIP_FILENAME` — ZIP must exist (`npm run package:extension`)

**Verify:**

```bash
npm run dev:web
# Check /, /demo/, download button, resize viewports
```

---

### `dual-build-web`

**When:** Web demo build, `/demo/` proxy, `vite.web.config.ts`, platform banners.

**Read:**

- `extension/vite.web.config.ts`
- `web-app-dev-plugin.ts`
- `extension/src/lib/platform.ts`

**Patterns:**

- `isWebAppContext()` gates Chrome-only UI
- Web build output → `public/demo/` (generated)
- HMR path must not double-prefix `/demo`

**Verify:**

```bash
npm run dev:web
npm run build:web
```

---

### `ci-release`

**When:** GitHub Actions, lint, typecheck, packaging, extension ZIP, deploy.

**Read:**

- `.cursor/rules/testing-ci.mdc`
- `.github/workflows/ci.yml`
- `package.json` scripts

**Verify:**

```bash
npm run ci
npm run package:extension   # if download artifact needed
```

---

### `ai-review`

**When:** Reviewing PRs, refactors, or preparing demo of AI workflow depth.

**Read:**

- `AGENTS.md` §6
- `.cursor/rules/ai-operating-model.mdc`

**Output expectations:**

- Architecture summary before code
- Explicit invariants checked
- Commands run with results
- Risks and test gaps stated

---

## Skill composition (multi-domain tasks)

| Combined task | Apply skills in order |
|---------------|----------------------|
| Editor feature + persistence | `editor-markdown` → `storage-migration` → `extension-feature` |
| Landing download + extension build | `ci-release` → `landing-marketing` |
| Web demo parity with extension UI | `dual-build-web` → `extension-feature` |
| Workspace UX + store refactor | `workspace-dnd` → `extension-feature` → `ci-release` |

---

## Escalation triggers

Stop and ask the user when:

- Request requires **cloud sync**, accounts, or backend — out of product scope
- Schema migration would **delete user data** without explicit approval
- Change touches **both** React 18 and 19 component sharing
- Landing scroll architecture rewrite — confirm UX goal first
- `npm run ci` fails after 2 distinct fix attempts — report blocker with logs

---

## Skill → rules map

| Skill | Primary rules |
|-------|---------------|
| `core-onboard` | `00-project-core.mdc`, `ai-operating-model.mdc` |
| `extension-feature` | `extension-architecture.mdc` |
| `storage-migration` | `storage-invariants.mdc` |
| `editor-markdown` | `editor-markdown.mdc` |
| `landing-marketing` | `landing-site.mdc` |
| `ci-release` | `testing-ci.mdc` |
