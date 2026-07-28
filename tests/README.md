# Tests

Vitest unit tests live here (not co-located under `src/`). Paths **mirror** the source tree so agents and humans know which file to run or update.

## Mapping contract

| When you change…                 | Look for / create…                      |
| -------------------------------- | --------------------------------------- |
| `extension/src/<path>/<file>.ts` | `tests/extension/<path>/<file>.test.ts` |
| `src/<path>/<file>.ts` (landing) | `tests/landing/<path>/<file>.test.ts`   |

Same basename. If a test is missing, add it at the mirrored path. Import production code via `@/` (and `@shared/` when needed) - never relative paths back into `src/`.

```
extension/src/lib/text.ts          →  tests/extension/lib/text.test.ts
extension/src/storage/db.ts        →  tests/extension/storage/db.test.ts
extension/src/lib/attachments/X.ts →  tests/extension/lib/attachments/X.test.ts
src/lib/seo.ts                     →  tests/landing/lib/seo.test.ts
```

## Inventory

### Extension

| Test                                        | Covers                                           |
| ------------------------------------------- | ------------------------------------------------ |
| `storage/db.test.ts`                        | import validation, `importWorkspace` rejection   |
| `storage/codec.test.ts`                     | BlockDoc encode/decode + corrupt fallback        |
| `lib/text.test.ts`                          | `len`, `extractPlainText`                        |
| `lib/themes.test.ts`                        | hex/id helpers, tokens, swatches, DOM apply      |
| `lib/platform.test.ts`                      | extension vs web context detection               |
| `lib/workspaceTree.test.ts`                 | section normalize, move/drop validators          |
| `lib/workspaceDrag.test.ts`                 | drag start guards, MIME precedence, cleanup      |
| `lib/attachments/sanitizeBlockDoc.test.ts`  | persist sanitize, path collect, orphan GC        |
| `lib/attachments/fileName.test.ts`          | names, unique collision suffixes, format helpers |
| `lib/attachments/imageClipboard.test.ts`    | paste/drop files, HTML imgs, data:/http fetch    |
| `lib/attachments/fileSystemManager.test.ts` | OPFS support, subdirectory walk, access check    |
| `lib/attachments/permissionManager.test.ts` | mic unsupported / denied / success               |
| `lib/attachments/waveform.test.ts`          | synthetic peaks + decode fallback                |
| `lib/attachments/errors.test.ts`            | error class names / instanceof                   |
| `store/useStore.test.ts`                    | root/children selectors                          |
| `store/selectors.test.ts`                   | favorites, recent, searchable, sidebar filters   |
| `store/moveWorkspaceItem.test.ts`           | move to root / outdent folder                    |
| `store/pagesWorkspace.test.ts`              | create/update/delete/init/view chrome            |
| `store/themeUi.test.ts`                     | custom theme add/remove/activate                 |
| `store/dialogs.test.ts`                     | delete/link/attachment dialog state              |
| `editor/markdownPaste.test.ts`              | GFM paste + task-list typing                     |
| `editor/tabIndent.test.ts`                  | multi-block indent algorithm                     |
| `editor/listBackspace.test.ts`              | Backspace lifts list/task items to paragraphs    |

### Landing

| Test                               | Covers                                      |
| ---------------------------------- | ------------------------------------------- |
| `lib/seo.test.ts`                  | meta, links, JSON-LD, robots, sitemap, llms |
| `lib/landingFaqContent.test.ts`    | FAQ link resolve + schema flatten           |
| `lib/url.test.ts`                  | absolute URL joining edge cases             |
| `lib/clientErrorReporting.test.ts` | optional reporter wiring                    |
| `lib/errorCapture.test.ts`         | SSR error capture TTL / consume             |

## Not unit-tested here (needs browser / heavy mocks)

Full UI flows (slash menu chrome, lightbox, live mic UI), OPFS write/read via `attachmentManager`, `VoiceRecorder` MediaRecorder state machine, and React hooks under `editor/hooks/`. Prefer manual QA / future e2e for those.

## Commands

```bash
npm run test                                          # all
npm run test:watch                                    # watch
npm run test -- tests/extension/lib/attachments/      # scoped folder
npm run test -- tests/landing/lib/seo.test.ts         # one file
npm run test -- tests/extension/store/                # store tests
```

Config: [`vitest.config.ts`](../vitest.config.ts). On load it ensures `tests/extension/node_modules` → `extension/node_modules` (gitignored symlink) so TipTap/ProseMirror resolve to a single copy.

IDE/`tsc` path aliases: [`tests/extension/tsconfig.json`](extension/tsconfig.json) (`@/` → `extension/src`) and [`tests/landing/tsconfig.json`](landing/tsconfig.json) (`@/` → `src`).

Agent rules: [`.cursor/rules/testing-ci.mdc`](../.cursor/rules/testing-ci.mdc), [`AGENTS.md`](../AGENTS.md) §4.3.
