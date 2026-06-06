# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- MIT license and open-source contribution docs (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
- GitHub Actions CI (lint, typecheck, test, build)
- Vitest unit tests for storage codec, text helpers, and theme utilities
- `.editorconfig` for consistent formatting across editors

### Changed

- Extracted document compression into `extension/src/storage/codec.ts`
- Hardened workspace import validation
- Replaced `alert()` on landing page download failures with inline error UI
