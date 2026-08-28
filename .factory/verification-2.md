# Independent product verification — round 2

**Verdict: FAIL**

**Candidate:** `820bb5e5712adde08f5bd3b967d7918f9e98c596`

**Live URL:** <https://maintenance-proof-book.sociobot.in>

**Verified:** 2026-08-28 UTC

**Work order:** `maintenance-proof-book-verify-2`

The repaired candidate is deployed byte-for-byte, the core local-first proof-book workflow works, and the previous checkout, touch-target, cache, MIME, and response-policy defects are fixed. Release acceptance still fails on fresh evidence: the required unlock-API rate limit is absent, the primary mobile heading is visibly clipped, mobile text violates the supplied minimum size, and required text/attachment recovery accepts or retains invalid state.

No product code was modified during verification.

## Defects

### S2 / High — QA2-001: the product-unlock verification API does not rate-limit a rapid burst

The work order explicitly requires a server endpoint, including a product-unlock endpoint, to begin returning HTTP 429 with `Retry-After` under a rapid burst.

- A fresh probe sent 300 requests to `GET https://api.sociobot.in/api/v1/products/maintenance-proof-book/verify?license=qa-rate-limit-probe` in 12 immediate batches of 25.
- Result: **300 × HTTP 200**, **0 × HTTP 429**.
- No threshold was observed through 300 requests, no `Retry-After` was returned, and an additional response exposed no rate-limit headers.
- The endpoint otherwise correctly returned `cache-control: no-store`, origin-specific CORS, and `{ "valid": false, "reason": "invalid" }`.

Required resolution: enforce a finite abuse limit on product verification and return 429 plus a valid `Retry-After` value after the threshold.

### S3 / Medium — QA2-002: the primary message is clipped at 390 px and mobile text is undersized

- At the required 390 × 844 viewport, `.hero h1 em` measured from x=16 to x=485.53 while its clipping `.hero` container ended at x=390: **95.53 CSS px of “PROOF ATTACHED.” is hidden**.
- The full-page screenshot visibly ends the primary promise at “PROOF ATTACH…”. `scrollWidth <= clientWidth` still passes only because the hero uses `overflow: hidden`.
- A computed-style scan found **24 visible leaf text elements below 16 px**, including the Data & backup button (13.76 px), privacy statement (13.12 px), checkout/legal copy (12.48 px), footer links (13.12 px), and multiple labels as small as 10.4 px.
- This violates the supplied clarity/mobile typography contract even though Lighthouse and axe do not flag CSS text size.

Required resolution: allow the emphasized heading to wrap or scale within 390 px, remove clipping, and bring readable control/body/supporting copy to the contract minimum.

### S3 / Medium — QA2-003: required fields accept whitespace-only values and attachment recovery leaves a false error

- A new repair with a title of three spaces and next action of three spaces passed native `required` validation. Save completed, the dialog closed, and trimmed empty strings were persisted, producing a blank repair name and next-action field.
- After rejecting `invalid.txt` with “invalid.txt is not an image or PDF.”, selecting a valid `receipt.pdf` successfully added the evidence row but left the old rejection in the alert region unchanged.
- Empty required fields do produce the general actionable error, and valid input can otherwise be saved, so this is a validation/recovery defect rather than total form failure.

Required resolution: validate trimmed required values before saving, focus/describe the invalid field, and clear or replace stale attachment errors after a successful selection.

## Clean-checkout quality gates

The starting tree was clean and already at the requested candidate.

| Gate | Fresh result |
| --- | --- |
| `npm ci` | PASS; 83 packages installed, 84 audited, 0 vulnerabilities |
| `npm test` | PASS; 5/5 Vitest assertions in 2 files |
| `npm run lint` | PASS; `tsc --noEmit` |
| `npm run build` | PASS; exact production command produced `dist/` and injected SW build `mpb-2684789659aa` |
| `npm run test:e2e` | PASS; 8/8 Playwright cases across desktop Chromium and 390 × 844 mobile |
| `npm audit --audit-level=moderate` | PASS; 0 vulnerabilities |
| `npm run test:live` | PASS; catalog, HTTP 303 hosted checkout, and invalid-token contract |

Build output: initial `main-BW3HeTOy.js` is 40.53 KB raw / 12.91 KB gzip; `main-BK0QvlWM.css` is 20.93 KB raw / 5.33 KB gzip. PDF/image-rendering chunks are lazy from initial page execution and precached for offline export.

## Deployment identity and paid unlock

- SHA-256 compared every one of the **29 externally served files** in the exact `dist/` build (all app HTML, JS, CSS, source maps, images, icons, manifest, offline shell, and worker) with production: **29 matches, 0 differences**.
- Main bundle SHA-256: `3dbc8b88f75a98d850cc55c3e74e30eea0d5afbd17d8cb083ff3301c3ba40303`.
- The catalog lists `maintenance-proof-book` at 2400 minor units / USD.
- Checkout returned HTTP 303 to `checkout.dodopayments.com`; the hosted page contained “Maintenance Proof Book Unlimited”, `$24.00`, and `USD`.
- A returned `?license=qa-invalid-return-token` was saved under `sb_license:maintenance-proof-book`, stripped from the URL, then reconciled to the invalid state with a readable notice.
- No real-money purchase was submitted, so a valid paid token was not created. This is the only unexercised portion of the purchase path.

## Independent functional coverage

Fresh browser profiles exercised the smallest useful product, not only repository tests.

- Empty state, semantic title/lang/main/one-h1 structure, property timeline, and legal routes: PASS.
- Created a complete record with contractor, vendor, part, zero-dollar boundary cost, notes, next action/date, PDF receipt, and an XSS-shaped title. Content rendered as text and survived reload: PASS.
- Photo plus PDF attachment, image preview alt text, evidence count, and PDF image export: PASS.
- File limits: 10 MB + 1 byte rejected; exactly 10 MB accepted; five 10 MB files (exactly 50 MB) accepted; a further one byte rejected: PASS.
- Invalid file type rejected: PASS, with stale recovery defect QA2-003.
- Property name/address edit, search, no-result state, clear-filter recovery, due filter UI, packet details, original download, delete cancel, confirmed delete, and 10-second Undo: PASS.
- JSON export contained full attachment data URLs. Delete followed by destructive confirmed restore recovered the record, and it survived reload: PASS.
- Malformed JSON showed a recoverable product-specific error and preserved all five current records: PASS.
- Generated PDF began `%PDF-`, preserved evidence provenance, and states it is a homeowner record rather than legal certification: PASS.
- Five-record free boundary blocked opening a sixth new-record form while stored records and export remained available: PASS.
- Blank native-required validation: PASS; whitespace-only validation and attachment recovery: FAIL per QA2-003.

## PWA, persistence, and offline behavior

- Chromium `Page.getAppManifest` returned zero errors. The manifest supplies standalone display, versioned start URL, 192/512/maskable icons, and product theme/background colors.
- The worker registered and controlled the page; the shell cache includes the built application and lazy PDF assets.
- Offline reload worked, displayed “Offline · still working”, retained IndexedDB data, accepted a new repair, and exported a PDF without network access.
- A fresh waiting-worker exercise registered a new worker script URL on the live scope. The app displayed “A fresh version is ready”; “Update now” sent `SKIP_WAITING`, triggered `controllerchange`, reloaded, and left the new worker controlling the page.
- Record/property/attachment data lives in IndexedDB. Source and runtime request inspection found no analytics, trackers, remote fonts, or runtime CDNs. Normal product use made no cross-origin requests; only checkout navigation and license verification use the documented billing API.

## Accessibility, keyboard, responsive, and motion

- Axe 4.13 serious/critical findings: **0** on the empty app and open repair dialog at 390 px; repository coverage also passed both viewports.
- Lighthouse accessibility: **100**; contrast audits passed.
- Keyboard smoke: the skip link is first and has a 4 px visible outline; Enter opens the repair form; focus enters the repair title; background controls remain inert under the modal; Escape closes it and restores focus to the originating button.
- All visible links/buttons/inputs/selects/textareas measured at least 44 × 44 CSS px at 390 px. The previous touch-target defect is fixed.
- `prefers-reduced-motion: reduce` reduced the dialog animation to 0.001 ms; there is no looping or flashing motion.
- No console errors or page errors occurred on desktop/mobile functional routes. No horizontal scrollbar appeared, but the hidden heading overflow is QA2-002.

## Live response and cache policy

- HTTP redirects to HTTPS. Production uses HTTP/2 and HSTS.
- CSP restricts scripts/styles/assets to self, permits only the billing API for connections, and sets `frame-ancestors 'none'`.
- `Permissions-Policy`, `Referrer-Policy`, `nosniff`, and `X-Frame-Options: DENY` are present. The app origin does not emit permissive CORS.
- Hashed JS returned `public, max-age=31536000, immutable`.
- `sw.js` returned `no-cache, no-store, must-revalidate`.
- The manifest returned `application/manifest+json` and immediate revalidation.
- HTML returned `public, must-revalidate, max-age=30`.
- The previous cache/MIME/policy defects are fixed.

## Performance

Fresh Lighthouse 13 mobile run against production:

| Metric | Result |
| --- | ---: |
| Performance | 98 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1.6 s |
| LCP | 2.3 s |
| Total blocking time | 0 ms |
| CLS | 0 |
| Speed Index | 1.5 s |
| Total transfer | 76 KiB |

Initial JS, CSS, image, font (none), LCP, and CLS budgets pass. INP is unavailable from a single lab navigation; zero total blocking time is the available lab interaction proxy.

## Final decision

**FAIL.** Do not mark candidate `820bb5e5712adde08f5bd3b967d7918f9e98c596` released. Fix QA2-001, QA2-002, and QA2-003, redeploy, then repeat the burst limit, 390 px visual/text-size, and trimmed-input recovery checks.
