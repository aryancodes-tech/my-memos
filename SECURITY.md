# Security Policy

## Supported versions

| Version       | Supported   |
| ------------- | ----------- |
| `main` branch | Yes         |
| Older tags    | Best effort |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report security issues privately by opening a
[GitHub Security Advisory](https://github.com/aryancodes-tech/my-memos/security/advisories/new)
or emailing the repository maintainers.

Include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

We aim to acknowledge reports within **72 hours** and provide a remediation
timeline when possible.

## Scope

In scope:

- The MyMemos Chrome extension (`extension/`)
- The landing site (`src/`)
- Data handling in IndexedDB and `chrome.storage.local`

Out of scope:

- Third-party dependencies (report upstream; we will update when patched)
- Social engineering attacks against individual contributors

## Data handling

MyMemos is **local-first**. Page documents stay in IndexedDB; image and audio
attachments stay in the Origin Private File System (OPFS). Settings use
`chrome.storage.local` (extension) or `localStorage` (web demo). The extension
does not send page content to a backend.

When reviewing changes, pay special attention to:

- Persistence and sanitize paths (`extension/src/storage/`, `extension/src/lib/attachments/`)
- Workspace import/export helpers in `db.ts` (implemented but **not** exposed in UI today)
- Any new network requests (including remote image fetch on paste)
- Permissions added to `extension/manifest.config.ts`

Note: the marketing landing page may load CDN assets (e.g. launch video). That
is separate from note/attachment storage and does not imply cloud sync of user data.
