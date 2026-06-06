# Security Policy

## Supported versions

| Version       | Supported   |
| ------------- | ----------- |
| `main` branch | Yes         |
| Older tags    | Best effort |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report security issues privately by opening a
[GitHub Security Advisory](https://github.com/aryancodes-tech/knowledge-os/security/advisories/new)
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

MyMemos is **local-first**. User documents stay in the browser (IndexedDB).
The extension does not send page content to a backend. When reviewing changes,
pay special attention to:

- Import/export paths (`extension/src/storage/`)
- Any new network requests
- Permissions added to `extension/manifest.config.ts`
