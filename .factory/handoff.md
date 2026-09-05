# Maintenance Proof Book — repair 3 handoff

**Work order:** `maintenance-proof-book-repair-3`

**Result:** PASS — all five strict-review finding groups are resolved

**Implementation deployed:** `c3611bb1f2a7ba90274c02f0f786f731f592f8de`

**Later verification-tool commit:** `020f1fbd91d85e5ae56356867bde34667b9c2129`

**Live URL:** <https://maintenance-proof-book.sociobot.in>

**Verified:** 2026-09-05 UTC

## What changed

- Added a one-click sample at `/demo` and `?demo=1`. It seeds three realistic repairs and four evidence files in IndexedDB database `demo:maintenance-proof-book`.
- Added a persistent “Demo — sample data, nothing is saved” banner with **Reset demo** and **Start for real**. Leaving the demo deletes only the demo database. Demo code does not read the real database or license storage.
- Added `.factory/claims.json` with 15 public claims. Each claim has exactly one tagged Playwright outcome test and one documented command.
- Rejects whitespace-only property names with announced recovery and focus. Malformed JSON now gives a plain error, preserves existing records, and lets the user choose another backup.
- Added a designed `404.html` that returns HTTP 404, plus route titles, canonical links, Open Graph and Twitter metadata, a 1200 × 630 social image, `robots.txt`, and `sitemap.xml`.
- Rebuilt the landing structure around the job: homeowner audience, sample and real first actions, three facts, live product, three steps, limits/privacy, exact paid offer, and the standard footer.
- Added the required copy audit, demo documentation, catalog description, generated sample-image provenance, and an outcome-based production browser verifier.
- Preserved the $24 one-time unlimited-record license. PDF and JSON export remain free.

## Strict-review finding disposition

| Finding | Evidence | Disposition |
| --- | --- | --- |
| R1 — missing isolated demo | `/demo` opens three populated repair cards; persistent label, reset, and exit work; real and demo records stay separate across reloads | Fixed |
| R2 — 14 unregistered claims | `.factory/claims.json` declares 15 claims, including demo isolation; every exact command passed individually from `npm ci` | Fixed |
| R3 — invalid property and JSON recovery | Whitespace property input remains open, announces the problem, and focuses the field; malformed JSON preserves records and shows plain recovery text | Fixed |
| R4 — 404 and metadata | Unknown live path returns designed HTTP 404; all four routes have titles/canonicals; robots, sitemap, social cards, and 1200 × 630 art are live | Fixed |
| R5 — landing structure | Job/audience/action are visible before scrolling on 1440 × 1000 and 390 × 844; required sections, plain facts, header, footer, and copy audit are present | Fixed |

The earlier QA-001 through QA-004 and QA2-001 through QA2-003 fixes remain intact. Checkout, 44 px targets, immutable caching, security headers, manifest MIME, API rate limiting, 390 px layout, repair whitespace handling, and exact attachment boundaries were rechecked.

## Clean setup and automated verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm run test:claims
npm audit --audit-level=moderate
npm run test:live
npm run test:production-browser
```

Results:

- `npm test`: 6/6 passed.
- `npm run lint`: passed.
- `npm run build`: passed and produced `dist/`.
- `npm run test:e2e`: 24/24 desktop and mobile tests passed.
- `npm run test:claims`: 15/15 passed.
- Every one of the 15 claim commands in `.factory/claims.json` was then run separately: 15/15 passed.
- `npm audit --audit-level=moderate`: 0 vulnerabilities.
- `npm run test:live`: product catalog, hosted checkout redirect, and invalid-license response passed.
- `npm run test:production-browser`: four live routes, desktop and phone, populated/reset demo, offline reload, designed HTTP 404, and axe all passed; zero serious or critical axe findings.

The claim tests assert observable results: database namespace isolation, offline repair/edit/PDF work, manifest behavior, IndexedDB contents, request origins, file boundaries, search/filter/edit/delete/undo, downloaded PDF and JSON content, record limits, license outcomes, and billing request privacy. They do not assert implementation source strings.

## Live and cold-browser evidence

- Fresh desktop (1440 × 1000) and phone (390 × 844) contexts stated the repair-proof job, homeowner audience, and first action before scrolling.
- The sample opened three realistic repairs with a photo, receipts, contractor/part details, costs, and next service dates. The demo label persisted, reset restored the sample, and exiting left real data unchanged.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200. `/not-a-real-route` returned the designed page with HTTP 404 and a home link.
- The supplied `verify-url.sh` passed for `/` and `/demo`: one H1, `lang=en`, main landmark, alt text, labeled buttons, and no console errors.
- The production browser verifier found zero serious/critical axe issues, no horizontal overflow, no console errors, and a working offline reload.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 0 ms, CLS 0.
- Initial app JavaScript is 49.26 KB raw / 15.86 KB gzip. CSS is 24.35 KB raw / 5.90 KB gzip. No runtime font or CDN asset is used.
- The live hashed JavaScript SHA-256 is `b46e8b454432184fdb24741ceec46e0e6bcd44c39fe58ebabb6b2497986d7fc2`, identical to the deployed build.
- A live billing burst returned 29 allowed responses and 51 HTTP 429 responses. All 51 rate-limit responses included `Retry-After`.

Evidence is under `/work/.evidence/`, including desktop/phone screenshots, verifier reports, Lighthouse JSON, billing metadata, the catalog description, and `repair-3-summary.json`.

## Deployment

The first deployment attempt stopped before upload because Azure Static Web Apps normalized `/demo` and `/demo/` as duplicate routes. The duplicate rule was removed and committed. The second deployment succeeded to the existing `sf-maintenance-proof-book` static app without changing DNS, infra, environment, billing, or another product.

Public implementation SHA is `c3611bb1f2a7ba90274c02f0f786f731f592f8de`. Commit `020f1fb` adds only the production verification script and its package command, so it did not require a new product image.

## Privacy and applicability

Ordinary app and demo flows made only same-origin requests. Repair data and evidence stay in separate local IndexedDB namespaces. Checkout and license verification are the only billing API paths. No analytics, tracking, remote fonts, secrets, card data, or invented provider credentials are present.

This is a static local-first PWA, so backend tenant isolation, SQLite restart persistence, server health, and process replica checks do not apply. Browser persistence, service-worker offline behavior, and the product-specific external billing contract were tested instead.

## Known gaps

- No real-money purchase was submitted. Checkout destination, public $24 offer metadata, invalid-token behavior, rate limiting, and the front-end valid-license path with a recorded response were verified without spending.
- Browser storage can be cleared by the browser or user. The UI states this and keeps full JSON backup/restore available for free.
