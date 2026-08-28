# Independent product verification

**Verdict: FAIL**

**Candidate:** `a2a1734df10fa5f4da5fe9de6894f418a25e6284`

**Live URL:** <https://maintenance-proof-book.sociobot.in>

**Verified:** 2026-08-28 UTC

**Work order:** `maintenance-proof-book-verify-1`

The core local-first proof book is useful and works end to end, and every deployed artifact matches the candidate build. Release acceptance nevertheless fails because the production purchase route is not configured: the visible $24 buy action ends at an API 404. Two additional explicit contract requirements—44 px touch targets and immutable caching for hashed assets—are also unmet.

## Defects

### S2 / High — QA-001: the production unlock cannot be purchased

- The rendered buy link correctly targets `https://api.sociobot.in/api/v1/products/maintenance-proof-book/checkout`.
- Fresh `HEAD` and `GET` requests on 2026-08-28 both returned HTTP 404.
- The GET body was exactly `{"error":"enabled factory product","status":404}`.
- The live UI therefore advertises a $24 one-time unlock that no user can buy. This blocks the complete paid-unlock journey, although the five-record free experience remains usable.
- The verification endpoint itself is alive: an invalid test token returned HTTP 200 with `{"expires_at":null,"reason":"invalid","valid":false}` and the expected origin-specific CORS header.
- The live app bytes match the candidate, so this is a fresh production billing-registration/configuration failure, not a stale app deployment.

Required resolution: enable/register the production factory product and verify a real hosted checkout redirect, return URL, token capture, URL scrubbing, and valid-license unlock.

### S3 / Medium — QA-002: several mobile targets are smaller than the required 44×44 CSS px

A geometry scan at 390×844 found these visible interactive boxes:

- brand/home link: 167×40 px;
- unlock-card Terms link: 37×15 px;
- footer Privacy link: 47×15 px;
- footer Terms link: 39×15 px.

The same elements are undersized on desktop. Focus styling and keyboard operation are good, but the attached accessibility/design contract requires all touch/click targets to be at least 44×44 px.

### S3 / Medium — QA-003: hashed production assets are not served with immutable caching

`/assets/main-BnxnEvnT.js`, `/assets/main-D0CDMiI0.css`, HTML, `sw.js`, and the manifest all returned:

```text
cache-control: public, must-revalidate, max-age=30
```

The hashed JS/CSS files should have a long-lived immutable policy. HTML and `sw.js` may revalidate. This is a deployment-policy defect; it does not currently break offline use because the service worker precaches the shell.

### S4 / Low — QA-004: response-policy hardening is incomplete

- Positive: HTTPS, HTTP/2, Brotli, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and no permissive app-origin CORS.
- Missing: Content Security Policy (including `frame-ancestors`), `Permissions-Policy`, and an equivalent explicit anti-framing policy.
- `/manifest.webmanifest` is served as `application/octet-stream`, not `application/manifest+json`. Chromium still parsed it with zero manifest errors, so this is a compatibility/hardening issue rather than an observed functional break.

## Clean-checkout gates

The starting tree was clean and `HEAD` was the requested candidate.

| Gate | Fresh result |
| --- | --- |
| `npm ci` | PASS; 81 packages installed, 0 audit vulnerabilities |
| `npm test` | PASS; 4/4 Vitest tests |
| `npx tsc --noEmit` | PASS |
| Repository lint script | N/A; no lint script/config is present |
| `npm run build` | PASS; exact command completed and produced `dist/` |
| `npm run test:e2e` | PASS; 6/6 Playwright tests across desktop Chromium and 390×844 mobile |
| `npm audit --audit-level=moderate` | PASS; 0 vulnerabilities |

Build identity: Vite 7.3.6 produced `main-BnxnEvnT.js`, `main-D0CDMiI0.css`, and service-worker version `mpb-36010487a6d7`. SHA-256 comparison of all 28 files in `dist/` against their live URLs produced 28 matches and 0 differences, including HTML, legal routes, lazy PDF chunks, icons, manifest, and `sw.js`.

## Independent functional coverage

Fresh browser profiles were used on desktop Chromium and a 390×844 mobile viewport.

- Empty state, one `<h1>`, `<main>`, `lang=en`, title, alt text, no horizontal overflow, and 16 px body text: PASS.
- Created a complete repair with contractor, vendor, part, zero-dollar boundary cost, notes, due date, PDF receipt, and an XSS-shaped title. Saved content rendered as text and survived reload: PASS.
- Required name/date/next-action validation, actionable error, focus on the invalid field, invalid `.txt` rejection, and recovery: PASS.
- Attachment boundaries: exactly 10 MB per file and exactly 50 MB total were accepted; 10 MB + 1 byte per-file and 50 MB + 1 byte aggregate were rejected with specific messages: PASS.
- Open/read packet, attachment provenance and original download, edit property/address, search, due filters, no-result recovery: PASS.
- Delete confirmation names the repair and attachment count; cancel preserved it; confirm plus 10-second Undo restored it: PASS.
- JSON export contained format/version, property/address, record fields, attachment metadata, and full `data:application/pdf;base64,...` bytes. A destructive confirmed restore replaced data and survived reload: PASS.
- PDF export downloaded a valid `%PDF-1.3` file on desktop/mobile and while offline; the source and rendered packet disclose that it is a homeowner record, not a legal certification: PASS.
- Free boundary: five records saved; the sixth create action was blocked with the stated limit while reads/exports remained available: PASS.
- Invalid backup and invalid license produced recoverable, plain-language errors. License query encoding was correct: PASS.
- Privacy: normal use generated no cross-origin requests, analytics, trackers, remote fonts, or CDN calls. IndexedDB held records/blobs; localStorage held only license state. The only designed external requests are checkout and license verification: PASS, subject to QA-001.
- `/privacy` and `/terms` returned 200 and accurately describe local storage, exports, merchant of record, refund/revocation, and limitations: PASS.

## PWA and offline evidence

- Chromium parsed the manifest with zero errors; standalone display, versioned start URL, 192/512/maskable icons, theme/background colors, and shortcut are present.
- Service worker registered and controlled the live page. The candidate shell cache was `mpb-36010487a6d7-shell`.
- After going offline, the app reloaded, displayed its offline state, retained existing IndexedDB data, created another repair, and exported PDF on both viewports.
- Update behavior was exercised against the exact built worker through a controlled two-version local server: v2 installed in `waiting`, the app displayed “A fresh version is ready,” “Update now” triggered `skipWaiting`, the page reloaded on `controllerchange`, the v1 caches were removed, and only v2 shell/runtime caches remained.

## Accessibility, keyboard, motion, and visual review

- Axe 4.13: 0 serious/critical findings on the empty app and repair dialog on desktop and 390 px mobile.
- Lighthouse mobile accessibility: 100; contrast audit passed.
- Keyboard: skip link was first, its focus ring was visible, Enter opened the repair dialog, focus moved to the title, Tab stayed inside the native modal, Escape closed it, and focus returned to the originating button.
- Global focus style is a 4 px high-contrast ring. Dialog controls have programmatic labels and errors use alert/live regions.
- `prefers-reduced-motion: reduce` reduced the dialog animation to 0.01 ms; no looping/flashing motion exists.
- Fresh full-page visual review found no clipping or horizontal overflow at 1440 px or 390 px. The product-specific blueprint/paper hierarchy remains clear and original. The undersized links are recorded in QA-002.

## Performance and bundle budgets

Fresh Lighthouse 13 mobile results against the live origin:

| Metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1.2 s |
| LCP | 1.4 s |
| Total blocking time | 0 ms |
| CLS | 0 |
| Speed Index | 1.2 s |
| Initial transfer | 87 KiB |

Production budget detail: initial app JS 40.53 KB raw / 12.91 KB gzip, CSS 20.78 KB raw / 5.30 KB gzip, hero WebP 55.69 KB, and no webfonts. The PDF engine remains lazy from the page but is precached in the background for offline export. INP is not available from a single lab navigation; 0 ms total blocking time is the lab interaction proxy.

## Final decision

**FAIL.** Do not mark the product released until QA-001 is resolved and the production checkout is proven end to end. QA-002 and QA-003 are also direct acceptance-contract misses and should be corrected before re-verification. No product source was changed during this verification.
