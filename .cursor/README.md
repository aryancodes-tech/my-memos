# `.cursor/` - AI Engineering Configuration

This directory defines how AI coding agents operate on **MyMemos**. It demonstrates structured, verification-driven AI-assisted development suitable for production codebases and technical review (e.g. Forward Deployed Engineer interviews).

## File map

| File | Role |
|------|------|
| [`../AGENTS.md`](../AGENTS.md) | Master operating manual - architecture, invariants, decision trees |
| [`SKILLS.md`](SKILLS.md) | Task → skill routing and verification contracts |
| [`rules/`](rules/) | Scoped Cursor rules (`.mdc`) injected by file pattern |

Notable skills: `landing-seo` (meta, JSON-LD, `llms.txt`, FAQ schema) - see `SKILLS.md` for verify commands.

## Rules index

| Rule | Scope | Always on |
|------|-------|-----------|
| `00-project-core.mdc` | Global invariants | ✅ |
| `ai-operating-model.mdc` | Agent behavior standards | ✅ |
| `extension-architecture.mdc` | `extension/**` | |
| `storage-invariants.mdc` | `extension/src/storage/**` | |
| `editor-markdown.mdc` | `extension/src/editor/**` | |
| `landing-site.mdc` | `src/**` | |
| `testing-ci.mdc` | Tests, CI, lint config | |

## For human contributors

1. Skim `AGENTS.md` §3 (invariants) before your first PR
2. Use `SKILLS.md` to find which docs apply to your task
3. Run `npm run ci` - same gates as GitHub Actions

## For reviewers

This setup shows:

- **Explicit architectural contracts** (storage, platform, surfaces)
- **Scoped context** instead of one giant prompt
- **Verification loops** tied to real scripts
- **Domain skills** with composition rules for multi-area tasks

## Maintenance

When architecture changes:

1. Update `AGENTS.md` first (source of truth)
2. Adjust affected `.mdc` rules
3. Add skill entries to `SKILLS.md` if new domain emerges

Do not duplicate long prose across files - link and specialize.
