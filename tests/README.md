# Tests

Vitest unit tests live here (not co-located under `src/`). Paths **mirror** the source tree so agents and humans know which file to run or update.

## Mapping contract

| When you change… | Look for / create… |
| ---------------- | ------------------ |
| `extension/src/<path>/<file>.ts` | `tests/extension/<path>/<file>.test.ts` |
| `src/<path>/<file>.ts` (landing) | `tests/landing/<path>/<file>.test.ts` |

Same basename. If a test is missing, add it at the mirrored path. Import production code via `@/` (and `@shared/` when needed) — never relative paths back into `src/`.

```
extension/src/lib/text.ts          →  tests/extension/lib/text.test.ts
extension/src/storage/db.ts        →  tests/extension/storage/db.test.ts
extension/src/lib/attachments/X.ts →  tests/extension/lib/attachments/X.test.ts
src/lib/seo.ts                     →  tests/landing/lib/seo.test.ts
```

## Current inventory

| Test | Covers |
| ---- | ------ |
| `tests/extension/storage/db.test.ts` | `extension/src/storage/db.ts` |
| `tests/extension/storage/codec.test.ts` | `extension/src/storage/codec.ts` |
| `tests/extension/lib/text.test.ts` | `extension/src/lib/text.ts` |
| `tests/extension/lib/themes.test.ts` | `extension/src/lib/themes.ts` |
| `tests/extension/lib/workspace-tree.test.ts` | `extension/src/lib/workspace-tree.ts` |
| `tests/extension/lib/attachments/sanitizeBlockDoc.test.ts` | `extension/src/lib/attachments/sanitizeBlockDoc.ts` |
| `tests/extension/lib/attachments/fileName.test.ts` | `extension/src/lib/attachments/fileName.ts` |
| `tests/extension/lib/attachments/imageClipboard.test.ts` | `extension/src/lib/attachments/imageClipboard.ts` |
| `tests/extension/store/useStore.test.ts` | `extension/src/store/useStore.ts` |
| `tests/extension/store/moveWorkspaceItem.test.ts` | `moveWorkspaceItem` in `useStore` |
| `tests/extension/editor/markdownPaste.test.ts` | `extension/src/editor/markdownPaste.ts` |
| `tests/landing/lib/seo.test.ts` | `src/lib/seo.ts` |

## Commands

```bash
npm run test                                          # all
npm run test:watch                                    # watch
npm run test -- tests/extension/lib/attachments/      # scoped folder
npm run test -- tests/landing/lib/seo.test.ts         # one file
npm run test -- tests/extension/store/                # store tests
```

Config: [`vitest.config.ts`](../vitest.config.ts). On load it ensures `tests/extension/node_modules` → `extension/node_modules` (gitignored symlink) so TipTap/ProseMirror resolve to a single copy.

IDE/`tsc` path aliases: [`tests/extension/tsconfig.json`](extension/tsconfig.json) (`@/` → `extension/src`) and [`tests/landing/tsconfig.json`](landing/tsconfig.json) (`@/` → `src`). Without these, the root tsconfig would own files under `tests/` and map `@/` to the landing package.

Agent rules: [`.cursor/rules/testing-ci.mdc`](../.cursor/rules/testing-ci.mdc), [`AGENTS.md`](../AGENTS.md) §4.3.
