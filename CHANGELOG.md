# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- MIT license and open-source contribution docs (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
- GitHub Actions CI (lint, typecheck, test, build)
- Vitest unit tests for storage codec, text helpers, theme utilities, attachments, and SEO builders
- `.editorconfig` for consistent formatting across editors
- Voice notes: inline recording, waveform playback, attach audio file, OPFS persistence
- Image attachments: picker, drag-drop, paste (including webpage images), OPFS storage, lightbox, captions
- Landing SEO / GEO: meta tags, JSON-LD, FAQ schema, `robots.txt`, `sitemap.xml`, `/llms.txt`
- Shared product constants module (`shared/constants.ts`) re-exported by landing and extension

### Changed

- Extracted document compression into `extension/src/storage/codec.ts`
- Hardened workspace import validation (storage helpers; no UI entry point yet)
- Replaced `alert()` on landing page download failures with inline error UI
- Agent/docs inventory updated so shipped capabilities match the product (no schema-only overclaims)
