# Keep proof of every home repair — strict review 2

**Verdict: PASS**

**Finding count:** 0

**Untested public claim count:** 0

**Implementation reviewed:** `c3611bb1f2a7ba90274c02f0f786f731f592f8de`

**Documentation baseline reviewed:** `81d84e301465c9c3f93652ef619da2e7f892dfdf`

**Live URL:** <https://maintenance-proof-book.sociobot.in>

**Reviewed:** 2026-09-05 UTC

**Work order:** `maintenance-proof-book-review-2`

## Decision

**PASS — zero findings of every severity and zero untested public claims.**

Maintenance Proof Book completes the homeowner job: it keeps a repair, contractor, part, cost, receipt or photo, and next service action/date together in a local repair record. No product code changed during this review.

## First screen before scrolling

Fresh Chromium sessions opened the live page at 1440 × 1000 and 390 × 844.

- **Job:** “Keep proof of every home repair.”
- **Audience:** “For homeowners who need each repair, contractor, part, receipt, photo, and next service date in one record.”
- **First action:** **Try it with sample data**. Its adjacent text says that it opens three repairs in a separate demo book.

The desktop and phone screens show the job, audience, and first action before scrolling. There was no console/page error or horizontal overflow. The visual review found the documented blueprint/paper system, a readable first action, and original repair-evidence art rather than a generic template.

## Sample, normal work, boundaries, and recovery

- The one-click `/demo` starts with three realistic fictional repairs: roof-vent flashing, heat-pump service, and a kitchen-tap cartridge. The roof packet includes Clearline Roofing, a sample roof photo, a fictional PDF receipt, part/vendor/cost details, and a next action/date.
- The persistent banner says “Demo — sample data, nothing is saved.” Editing a sample then **Reset demo** restored the original three records. **Start for real** cleared the demo namespace and returned to an unchanged real repair book.
- The demo database is `demo:maintenance-proof-book`; real use is `maintenance-proof-book`. The isolation claim test created a real repair, changed/reset the demo, exited it, and proved the real repair remained while the demo record store was cleared.
- The normal repair flow saved a complete record, persisted it, displayed evidence provenance, and supports search, due filtering, edit, delete confirmation, timed undo, JSON backup/restore, and on-device PDF export.
- Blank/whitespace repair and property fields keep their dialogs open, state what to enter, and focus the relevant field. Invalid evidence and malformed JSON give a plain recovery action without replacing existing records. Exact 10 MiB/file and 50 MiB/repair limits pass; one-byte overages are rejected.
- Five free records remain readable/exportable; a sixth is clearly blocked. Recorded fixtures exercise valid-license capacity, license restore, and invalidation while keeping stored records/export readable. No real-money purchase was submitted.

## Claims

`.factory/claims.json` lists 15 public claims. A tag scan found exactly one matching `@claim:<id>` test for each and no extra tag. The combined suite passed 15/15, and every declared command was rerun separately from the clean checkout.

| Claim IDs | Result |
| --- | --- |
| `demo-isolation`, `offline-reload`, `pwa-install`, `local-indexeddb`, `no-account` | PASS |
| `no-tracking`, `no-remote-assets`, `attachment-limits`, `record-tools`, `pdf-export` | PASS |
| `json-backup`, `free-five`, `paid-unlimited`, `license-restore`, `billing-privacy` | PASS |

Landing copy, the demo, legal pages, pricing, and README were cross-checked against the registry and copy audit. No missing, false, incomplete, or untested public claim was found.

## Accessibility, privacy, PWA, routes, and links

- `verify-url.sh` passed the live home: HTTP 200, title, `lang=en`, one H1, main landmark, image alt text, labelled buttons, and no console errors.
- Playwright Axe checks found zero serious/critical violations on home, demo, privacy, terms, and dialog states. Keyboard checks passed the skip link, designed focus ring, Enter activation, dialog initial focus/trap, Escape close/focus return, and reduced-motion path. The 390 px scan found no undersized visible text or target and 200% text resizing retained usable dialog controls.
- Ordinary sample use made only same-origin requests. There are no analytics, trackers, remote fonts, or runtime CDN assets. IndexedDB holds repair data; the documented billing API is only used for checkout/verification, and the app receives no card data.
- Fresh live offline reload retained the demo and displayed “Offline · still working.” It also created, edited, and exported a PDF offline. The service worker update path was covered by the browser suite.
- `/`, `/demo`, `/privacy`, and `/terms` return 200 with route-specific titles/canonicals. The designed `/not-a-real-route` response deliberately returns HTTP 404 with a recovery link; that expected 404 is not a defect. Product links passed; checkout returned its expected hosted HTTP 303 redirect.
- Live headers include the self-only CSP with the documented billing `connect-src`, anti-framing, nosniff, strict referrer policy, and Permissions-Policy. The manifest is correctly typed; hashed assets are immutable and the worker revalidates.

This is a static local-first PWA. Tenant isolation, SQLite restart persistence, server health, and installed CLI/library/desktop checks do not apply. The only product-specific external request allowance was nevertheless tested below.

## Earlier finding disposition

| Earlier finding | Fresh review proof | Disposition |
| --- | --- | --- |
| QA-001 checkout unavailable | Catalog/`test:live` returned the $24 product and HTTP 303 hosted checkout redirect | Fixed |
| QA-002 undersized targets | Desktop/390 px geometry and Lighthouse touch-target checks passed | Fixed |
| QA-003 immutable asset caching | Fresh 38-file live/build comparison and headers show one-year immutable hashed assets | Fixed |
| QA-004 policy/manifest MIME | CSP, anti-framing, Permissions-Policy, referrer/nosniff, and manifest MIME are live | Fixed |
| QA2-001 no billing rate limit | Fresh 80-request invalid-token burst: 30 × 200, 50 × 429, all 50 with `Retry-After` | Fixed |
| QA2-002 mobile clipping/small text | Fresh 390 px visual and computed-style checks passed | Fixed |
| QA2-003 whitespace/stale attachment error | E2E and claim tests passed validation/focus and invalid-to-valid evidence recovery | Fixed |
| R1 no isolated demo | Fresh demo, persistent label, reset, exit-clearing, and separate IndexedDB proof passed | Fixed |
| R2 claims absent | 15 registered claims; 15 individual commands and combined suite passed | Fixed |
| R3 property/JSON recovery | Fresh property whitespace and malformed-JSON recovery paths passed | Fixed |
| R4 404/metadata incomplete | Deliberate 404, route titles, canonicals, discovery files, and social preview passed | Fixed |
| R5 landing structure/copy | First-screen job/audience/action, literal sections, facts, price, footer, and copy audit passed | Fixed |

## Clean checkout, live identity, and performance

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 83 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 6/6 |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/` produced; worker shell injected |
| `npm run test:e2e` | PASS — 24/24 |
| `npm run test:claims` | PASS — 15/15 |
| 15 individual declared claim commands | PASS — 15/15 |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm run test:live` | PASS — catalog, hosted checkout redirect, invalid-token contract |
| `npm run test:production-browser` | PASS — live desktop/phone, demo/reset, offline, routes, Axe |
| Live/build bytes | PASS — 38/38 publicly served files match; `staticwebapp.config.json` is deployment-only and correctly 404s |

Fresh mobile Lighthouse scored **100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO**. FCP was 0.9 s, LCP 1.4 s, total blocking time 20 ms, CLS 0, and transfer 80 KiB. The built initial application JS is 49,263 bytes raw / 15,862 bytes gzip, CSS is 24,354 bytes raw / 5,904 bytes gzip, and no webfont loads.

The live build matches implementation commit `c3611bb1f2a7ba90274c02f0f786f731f592f8de`. Documentation/test-only commits through `81d84e301465c9c3f93652ef619da2e7f892dfdf` do not alter the built product.

## Evidence

- Browser/URL evidence and Lighthouse JSON: `/work/.evidence/review-2/`
- This report: `.factory/review-2.md`
- Machine result: `/work/.evidence/qa-result.json`

