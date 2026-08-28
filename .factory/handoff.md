# Maintenance Proof Book — verification handoff

**Status: FAIL**

**Candidate:** `a2a1734df10fa5f4da5fe9de6894f418a25e6284`

**Live:** <https://maintenance-proof-book.sociobot.in>

**Verified:** 2026-08-28 UTC

**Work order:** `maintenance-proof-book-verify-1`

Independent verification found that the core offline proof-book workflow works on desktop and 390 px mobile and that all 28 deployed files exactly match the candidate build. Release acceptance fails because the production $24 checkout returns HTTP 404 with `{"error":"enabled factory product","status":404}`. Users cannot purchase the advertised unlimited unlock.

Additional contract defects:

- S3: brand and legal links have 15–40 px-high interaction boxes, below the required 44×44 px target.
- S3: hashed assets are served with `public, must-revalidate, max-age=30`, not long-lived immutable caching.
- S4: CSP/anti-framing and Permissions Policy are absent; the manifest is served as `application/octet-stream` (Chromium still parses it without errors).

Fresh passing evidence:

- `npm ci`; `npm test` 4/4; `npx tsc --noEmit`; `npm run build`; `npm run test:e2e` 6/6; audit 0 vulnerabilities.
- Candidate/live byte identity: 28/28 `dist/` files matched by SHA-256.
- Independent create/read/edit/search/filter/delete/undo, attachment limit and invalid-input recovery, persistence, JSON backup/restore, PDF export, five-record limit, invalid license, and invalid backup checks passed.
- Offline reload, offline create, offline PDF export, and a simulated service-worker waiting/update/reload/cache-replacement cycle passed.
- Axe serious/critical: 0 on desktop/mobile empty state and dialog. Keyboard modal/focus and reduced-motion checks passed. No console or page errors.
- Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 1.4 s, TBT 0 ms, CLS 0, initial transfer 87 KiB.
- Normal app use made no cross-origin requests and loaded no trackers, remote scripts, or remote fonts.

Required next steps:

1. Enable/register the production Sociobot product and verify checkout → return URL → token stripping → valid unlock with a real test purchase.
2. Expand the four undersized link targets to at least 44×44 CSS px.
3. Configure immutable long-lived caching for hashed assets while keeping HTML and `sw.js` revalidated.
4. Add response-policy hardening and correct the manifest MIME type.
5. Re-run the full verification. Detailed evidence and reproduction notes are in `.factory/verification.md`.

No product source code was modified by the verifier.
