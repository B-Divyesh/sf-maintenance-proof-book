# Keep proof of every home repair — independent verification 4

**Verdict: PASS**

**Finding count:** 0

**Untested public claim count:** 0

**Implementation reviewed:** `c3611bb1f2a7ba90274c02f0f786f731f592f8de`

**Documentation baseline reviewed:** `32b58547e314796429b73c7137872aafa942355c`

**Live URL:** <https://maintenance-proof-book.sociobot.in>

**Verified:** 2026-09-05 UTC

**Work order:** `maintenance-proof-book-verify-4`

## Decision

Maintenance Proof Book passes with zero findings and zero untested claims. Fresh desktop and phone sessions, a clean candidate checkout, all 15 claim commands, and the live deployment agree. The product completes the homeowner job: keep each repair, contractor, part, evidence file, cost, next action, and next date in one local record; retrieve it; and export it.

No product code was changed during this verification.

## First screen before scrolling

Fresh Chromium contexts started at scroll position zero with 1440 × 1000 and 390 × 844 viewports.

- **Job:** “Keep proof of every home repair.”
- **Audience:** “For homeowners who need each repair, contractor, part, receipt, photo, and next service date in one record.”
- **First action:** “Try it with sample data.”

All three were visible before scrolling on both viewports. The adjacent sentence says the action opens three repairs in a separate demo book. The page uses plain section names and direct instructions; the copy audit has no sentence over 22 words and no banned term.

## Live sample and real-data isolation

The one-click sample opened `/demo` with these three realistic records:

1. Repaired roof vent flashing.
2. Serviced heat pump.
3. Replaced kitchen tap cartridge.

The first packet showed Clearline Roofing, part and next-action details, a generated roof photo, a fictional PDF receipt, and an evidence index. “Demo — sample data, nothing is saved” remained visible after scrolling. Editing the first sample and selecting **Reset demo** restored the original three records. Selecting **Start for real** cleared the demo records and settings while preserving a record created in the disposable real namespace. Ordinary demo use contacted only the product origin and produced no console or page errors.

The sample roof image was visually inspected. It has no person, brand, text, watermark, unsafe activity, or identifying detail. Its factory model, date, prompt, and review are recorded in `.factory/design.md` and `assets/src/sample-roof-repair.png.json`.

## Declared claims

`.factory/claims.json` contains 15 claims. Each has exactly one matching `@claim:<id>` test, no extra claim tag exists, and every declared command passed separately from the clean checkout.

| Claim | Result | Observable proof |
| --- | --- | --- |
| `demo-isolation` | PASS | Three samples, edit/reset, cleared demo contents, unchanged real book |
| `offline-reload` | PASS | Offline reload, create, edit, and PDF download |
| `pwa-install` | PASS | Standalone manifest, required icons, active worker |
| `local-indexeddb` | PASS | Isolated demo database and persisted edit |
| `no-account` | PASS | Fourth repair created without credentials |
| `no-tracking` | PASS | Complete ordinary flow stayed same-origin |
| `no-remote-assets` | PASS | Scripts/styles stayed same-origin; no webfont loaded |
| `attachment-limits` | PASS | Exact 10 MiB/file and 50 MiB/repair accepted; both overages rejected |
| `record-tools` | PASS | Search, due filter, edit, delete, undo, and undo expiry |
| `pdf-export` | PASS | Valid PDF bytes, image object, and evidence index |
| `json-backup` | PASS | Full restore retained original attachment bytes |
| `free-five` | PASS | Fifth record allowed, sixth rejected, both exports available |
| `paid-unlimited` | PASS | Recorded valid verdict allowed a sixth record |
| `license-restore` | PASS | Restore worked; invalidation kept record and export readable |
| `billing-privacy` | PASS | Exact Sociobot URLs, token-only GET, no request body or card fields |

The combined claim suite also passed 15/15. Landing, legal, dialog, and README promises are covered by these claims; no missing, false, incomplete, or untested public claim was found. Per-command logs are in `/work/.evidence/verification-4/claim-*.txt`.

## Normal, invalid, boundary, and recovery paths

- A complete repair with contractor, vendor, part, cost, notes, next action/date, image/PDF evidence, and escaped text saved and survived reload.
- Search, date filtering, no-results recovery, packet view, original download, edit, delete confirmation, 10-second undo, and expired undo worked.
- Empty states explain what appears and provide the next action.
- Required blank and whitespace-only repair/property values stayed in their dialogs, announced a useful error, and focused the field.
- An invalid attachment was rejected; a valid replacement cleared the stale error.
- Malformed JSON preserved all records and gave a plain recovery instruction. A valid destructive restore required confirmation.
- Exact file and repair attachment limits passed; one-byte overages failed with the correct limit.
- Five free repairs were readable and exportable; a sixth was blocked clearly. The recorded valid-license path allowed more than five.
- Invalid and revoked licenses failed softly while existing records and free exports remained available.

These paths passed in the 24-test desktop/390 px E2E matrix and the outcome-focused claim suite.

## Accessibility and responsive use

- `verify-url.sh` passed live `/` and `/demo`: correct title, `lang=en`, one H1, main landmark, image alt text, named buttons, and no console errors.
- Playwright Axe found zero serious or critical issues on home, demo, privacy, terms, and dialog states. Lighthouse accessibility scored 100.
- Keyboard checks covered the skip link, visible 4 px focus, Enter activation, dialog initial focus, Escape close, focus return, and native modal trapping.
- Desktop and phone geometry checks found no undersized visible target; phone content had no ordinary horizontal overflow or clipped primary message.
- A 200% text-resize smoke retained the repair dialog content and controls without functional loss.
- Reduced motion made the dialog transition effectively instant. No looping or flashing motion exists.
- The documented single-mode blueprint treatment has passing contrast and preserves its visual identity on both viewports.

## PWA, privacy, routes, and policies

- A fresh live worker controlled the app. Offline reload retained all three demo records and displayed “Offline · still working.” The claim test also created, edited, and exported while offline.
- A two-version exercise displayed “A fresh version is ready,” applied **Update now**, reloaded under the new worker, and removed the old caches.
- The standalone manifest has versioned start behavior and 192, 512, and maskable icons. It is served as `application/manifest+json`.
- Repair and attachment data live in IndexedDB. Demo and real use have separate namespaces. Ordinary use made only same-origin requests; there are no analytics, trackers, remote fonts, or CDN scripts.
- `/`, `/demo`, `/privacy`, and `/terms` return 200 with route-specific titles and canonicals. The crawled product links returned 200, the checkout link returned its expected 303, and the privacy mail link is explicit.
- `/not-a-real-route` deliberately returns HTTP 404 with the designed “This repair page does not exist” page and a return link. This expected 404 is not a defect.
- `robots.txt`, `sitemap.xml`, Open Graph/Twitter metadata, the 1200 × 630 preview, security headers, and CSP are live.
- Hashed assets are immutable for one year; `sw.js` is not cached; HTML revalidates; the manifest revalidates immediately.

This is a static local-first PWA. Backend tenant isolation, SQLite restart persistence, a server health route, and a product process restart are not applicable. Browser persistence, offline behavior, update handling, and the product-specific billing API were tested instead. CLI/library/desktop consumer-environment checks are also not applicable.

## Billing and request allowance

The public catalog lists `maintenance-proof-book` at $24 USD. The product checkout returned HTTP 303 to the hosted Dodo checkout, and an invalid token returned the documented invalid verdict. A fresh 80-request verification burst produced 30 HTTP 200 and 50 HTTP 429 responses; all 50 rejections included `Retry-After`.

No real-money purchase was submitted. This is a stated verification limitation, not an observed product defect: the hosted checkout destination, catalog price, invalid-token contract, client token handling, recorded valid-license result, revocation behavior, and request allowance were all exercised without spending.

## Performance and clean-checkout gates

| Check | Fresh result |
| --- | --- |
| `npm ci` | PASS — 83 packages; 0 vulnerabilities |
| `npm test` | PASS — 6/6 |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 24/24 |
| `npm run test:claims` | PASS — 15/15 |
| 15 individual claim commands | PASS — 15/15 |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm run test:live` | PASS |
| `npm run test:production-browser` | PASS |

Fresh Lighthouse mobile results: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.01 s, LCP 1.31 s, total blocking time 77 ms, CLS 0, and total transfer 93,578 bytes.

Initial app JavaScript is 49,263 bytes raw / 15,862 bytes gzip. CSS is 24,354 bytes raw / 5,904 bytes gzip. The hero WebP is 55,686 bytes. PDF libraries are lazy-loaded. No webfont ships.

## Live identity

All 38 publicly served files from the clean build matched the live response bytes. The live main JavaScript SHA-256 is `b46e8b454432184fdb24741ceec46e0e6bcd44c39fe58ebabb6b2497986d7fc2`.

The deployed implementation remains `c3611bb1f2a7ba90274c02f0f786f731f592f8de`. Commits `020f1fb` and `32b5854` add verification tooling and documentation only; they do not change the built product. The live runtime therefore matches the last implementation candidate.

## Earlier finding disposition

| Earlier finding | Fresh proof | Disposition |
| --- | --- | --- |
| QA-001 — checkout unavailable | Catalog price and hosted 303 checkout passed | Fixed |
| QA-002 — targets below 44 px | Desktop/phone target scan passed | Fixed |
| QA-003 — hashed assets not immutable | Live main JS has one-year immutable caching | Fixed |
| QA-004 — missing policies/manifest MIME | CSP, anti-framing, Permissions-Policy, referrer, nosniff, and manifest MIME passed | Fixed |
| QA2-001 — no billing rate limit | 50/80 requests returned 429; all had `Retry-After` | Fixed |
| QA2-002 — clipped mobile message/small type | Fresh 390 × 844 page has readable type, no ordinary overflow, and visible job/action | Fixed |
| QA2-003 — whitespace/stale file error | Whitespace recovery and invalid-to-valid attachment recovery passed on both E2E projects | Fixed |
| R1 — no isolated demo | Live one-click demo, reset, persistent label, exit clear, and real-data isolation passed | Fixed |
| R2 — claims absent | 15 registered claims, exactly one tag each, 15/15 individual commands passed | Fixed |
| R3 — property/JSON recovery | Trimmed property validation and plain malformed-JSON recovery passed | Fixed |
| R4 — 404/metadata incomplete | Deliberate 404, route titles, canonicals, discovery files, and social image passed | Fixed |
| R5 — landing structure/copy | Required order, literal headings, job/audience/action, facts, steps, limits, price, and footer passed | Fixed |

## Final result

**PASS — zero findings of every severity and zero untested claims.**
