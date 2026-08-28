# Maintenance Proof Book — verification handoff

**Status: FAIL — candidate is deployed but does not satisfy the acceptance contract**

**Tested candidate:** `820bb5e5712adde08f5bd3b967d7918f9e98c596`

**Live:** <https://maintenance-proof-book.sociobot.in>

**Work order:** `maintenance-proof-book-verify-2` (2026-08-28 UTC)

The full independent record is [`.factory/verification-2.md`](verification-2.md). No product code was changed.

## Release blockers

1. **S2 / QA2-001 — unlock API lacks required rate limiting.** A 300-request rapid burst against the license verification endpoint returned 300 HTTP 200 responses. No 429, `Retry-After`, or observable threshold appeared.
2. **S3 / QA2-002 — required mobile presentation fails.** At 390 px, 95.53 px of the emphasized primary `<h1>` is clipped. A computed scan also found 24 visible text elements below 16 px, including controls, legal copy, and footer links.
3. **S3 / QA2-003 — invalid input/recovery is unsafe.** Whitespace-only required title and next-action values save as empty strings. A rejected attachment error remains announced after a valid PDF is successfully added.

## What passed

- Clean `npm ci`; 5/5 unit tests; TypeScript/lint; exact production build; 8/8 repository Playwright cases; 0 dependency vulnerabilities.
- All 29 externally served build files match production byte-for-byte. Main JS SHA-256 is `3dbc8b88f75a98d850cc55c3e74e30eea0d5afbd17d8cb083ff3301c3ba40303`.
- Core create/read/edit/search/filter/delete/undo, photo/PDF evidence, exact attachment limits, JSON export/restore, PDF export, five-record free boundary, and malformed-import recovery.
- IndexedDB persistence, offline reload/write/PDF export, manifest installability, and waiting-worker update activation.
- Checkout is a real HTTP 303 hosted redirect; hosted page shows Maintenance Proof Book Unlimited at $24 USD; invalid-license reconciliation and URL scrubbing work.
- Axe serious/critical: 0. Lighthouse mobile: performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.3 s, TBT 0 ms, CLS 0, 76 KiB transfer.
- Security headers, manifest MIME, immutable hashed-asset caching, non-cacheable worker, privacy/local-only operation, 44 px targets, focus, keyboard dialog handling, and reduced motion.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --audit-level=moderate
npm run test:live
```

After fixes, additionally verify:

- the verification endpoint returns 429 plus `Retry-After` during a bounded rapid burst and record the first rejected request;
- “PROOF ATTACHED.” is fully visible at 390 px and readable text meets the supplied minimum size;
- trimmed-empty title/next-action values remain in the form with an announced error, and successful attachment recovery clears the previous rejection.

No real-money checkout was submitted; the hosted checkout route, product/price, return-token handling, and invalid-token verification were exercised without creating a transaction.
