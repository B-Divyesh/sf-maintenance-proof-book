# Maintenance Proof Book — strict product review 1

**Verdict: FAIL**

**Finding count:** 5
**Untested public claim count:** 14
**Implementation reviewed:** `8fc87ae21a6b217857d4e697e6f973e3f38d36d0`
**Documentation baseline reviewed:** `f8488e80a36f7d0900808cf95cd54f9ef7b484c9`
**Live URL:** <https://maintenance-proof-book.sociobot.in>
**Reviewed:** 2026-09-05 UTC
**Work order:** `maintenance-proof-book-review-1`

## Decision

The existing repair workflow remains technically sound, and the prior defects are fixed. This review nevertheless fails the current acceptance contract. The product has no one-click sample or isolated demo mode, no claims registry, no real 404, incomplete required site structure and metadata, and two invalid-input recovery problems. A PASS requires zero findings and zero untested public claims.

No product code was changed during this review.

## First screen, before scrolling

- **Job shown:** keep a repair, contractor, part, receipt or photo, and next action together on a property timeline.
- **Audience shown:** not stated. The screen refers to a property and house, but does not say that the product is for homeowners.
- **First primary action:** **Record a repair**. There is no **Try it with sample data** action.

Desktop Chromium at 1440 × 1000 and a fresh Pixel 5 profile at 390 × 844 showed the same content. Both had no horizontal overflow, no console/page error, 16 px body text, and no visible interactive target below 44 × 44 CSS px.

## Findings

### S2 / High — R1: the required sample demo does not exist and `/demo` uses real storage

- The first screen has no **Try it with sample data** action.
- Fresh visits to `/demo` and `/?demo=1` show the normal empty app: record count `0`, no realistic sample, no persistent “Demo — sample data, nothing is saved” label, no **Reset demo**, and no **Start for real**.
- `/demo` has the ordinary home title and UI rather than a demo route.
- In a fresh browser profile, a record created at `/demo` was present at `/` and in the same IndexedDB database, `maintenance-proof-book`. The route therefore writes the real namespace instead of an isolated `demo:` namespace.
- `.factory/demo.md` is absent and the README provides no demo entry point or reset/storage documentation.

This prevents the required safe one-click evaluation and creates the exact risk the demo contract forbids: a visitor can believe they are trying a sample while changing their real local book.

### S2 / High — R2: all 14 public claims are outside the required claims system

`.factory/claims.json` is absent, and `rg "@claim:"` finds no tagged claim test. There are therefore no declared claim commands to run. The ordinary unit/E2E suites pass and several behaviors were independently observed, but they do not satisfy the required one-entry/one-tag/one-command claim contract.

The following distinct public promises are unregistered and count as untested claims under that contract:

| # | Public promise in the live product or README |
| ---: | --- |
| 1 | Works offline after the first visit, including create/edit/export behavior |
| 2 | Is installable as a PWA |
| 3 | Stores property, repair, and attachment data locally in IndexedDB |
| 4 | Requires no account |
| 5 | Uses no analytics or tracking |
| 6 | Uses no remote fonts or runtime CDN |
| 7 | Supports photo/PDF evidence with 10 MB per-file and 50 MB per-repair limits |
| 8 | Supports search, due filtering, edit, delete, and timed undo |
| 9 | Creates an on-device evidence PDF with image previews and an attachment index |
| 10 | Creates/restores a full JSON backup including original attachment data |
| 11 | The free book holds five repairs while PDF/JSON export remains free |
| 12 | A $24 one-time license enables unlimited records |
| 13 | A license can be restored on another device and existing records remain readable after invalidation |
| 14 | Ordinary use sends no product data away; only checkout/license verification use the billing API, and the app receives no card data |

### S3 / Medium — R3: two invalid-input paths do not give safe, plain recovery

- The required **Property name** field accepts three spaces. The dialog closes, the visible property label becomes blank, and the app announces “Property details saved locally.” Required repair-name and next-action fields correctly reject whitespace, so the property form is inconsistent.
- Importing malformed JSON preserves existing records, but the user sees the raw engine message `Expected property name or '}' in JSON at position 1 (line 1 column 2)`. It does not say that the file is invalid or what to do next.

Both are fresh live results in disposable browser profiles. Valid JSON/PDF export, invalid attachment recovery, and delete/undo otherwise work.

### S3 / Medium — R4: missing-route and discovery metadata contracts are incomplete

- `/404`, `/404.html`, and `/not-a-real-route` all render the home app with HTTP 200 and the home title. There is no designed 404 page or route back. A deliberate HTTP 404 would be expected; silently returning the home page is the defect.
- `/demo` does not set `Demo — Maintenance Proof Book`.
- The home and legal documents have no canonical URL, Open Graph metadata, or Twitter card metadata.
- `robots.txt` and `sitemap.xml` are absent and return the host's generic 404 response.
- The shipped 1200 × 800 illustration is not exposed as the required 1200 × 630 social image.

The real `/privacy` and `/terms` routes do return 200 with their correct route titles.

### S3 / Medium — R5: the landing page misses required plain-word and standard-skeleton content

- The headline “Every repair. Proof attached.” does not name the job as directly as the required job title, and the supporting sentence does not name homeowners.
- The supporting sentence is 25 words, exceeding the 22-word hard limit.
- The first screen lacks the required adjacent explanation of what the sample action does and lacks three separate privacy/offline/price facts.
- The landing page has no three-step **How it works** section and no plain **What it does not do** section.
- The header has no navigation landmark or links to Demo and Privacy.
- The footer lacks the product one-line description, “Built by Param Factory,” and a version/build identifier.
- Labels such as “Property record / Local & private,” “Sheet 02 / History,” and “Keep it for the life of the house” use the drafting theme where the contract requires literal section names.
- `.factory/copy-audit.md` is absent, so the required sentence counts and terminology check were not performed.

The blueprint visual system itself is distinct, coherent, and documented; this finding concerns information order and copy, not visual originality.

## Earlier finding disposition

| Earlier finding | Current proof | Disposition |
| --- | --- | --- |
| QA-001 checkout unavailable | App buy link returned 303 to `checkout.dodopayments.com`; the hosted page showed Maintenance Proof Book Unlimited and $24.00 USD | Fixed |
| QA-002 touch targets | Fresh 1440 px and 390 px geometry scans found zero visible controls below 44 × 44 px | Fixed |
| QA-003 immutable asset caching | Live hashed JS returns `public, max-age=31536000, immutable` | Fixed |
| QA-004 headers and manifest MIME | CSP, `frame-ancestors`, Permissions-Policy, nosniff, strict referrer policy, DENY framing, and `application/manifest+json` are live | Fixed |
| QA2-001 no API rate limit | Fresh 100-request burst returned 30 × 200 and 70 × 429; all 429 responses included `Retry-After: 4` | Fixed |
| QA2-002 mobile clipping/type | Fresh 390 × 844 review had no horizontal overflow, no undersized visible text, and no clipped primary message | Fixed |
| QA2-003 repair whitespace and stale attachment error | Repair whitespace is rejected with focus recovery; 10 MiB + 1 is rejected; exactly 10 MiB is accepted and clears the old alert | Fixed |

The new blank-property defect in R3 is a separate form path and does not reopen QA2-003.

## Functional and recovery evidence

- A fresh live profile saved a zero-cost roof repair with property/address, contractor, vendor, part, notes, due date, PDF receipt, and an XSS-shaped title. It rendered as text and survived reload.
- Search no-result and clear-filter recovery worked. Packet view retained contractor, part, evidence filename, and original download.
- JSON export contained one record and the attachment's full `data:application/pdf;base64,...` data. PDF export began `%PDF-`.
- Malformed JSON preserved existing records, subject to R3's raw error text.
- Delete cancel preserved the record; confirmed delete followed by **Undo** restored it.
- Five free repairs saved; attempting a sixth left the dialog closed and explained the five-record limit.
- Whitespace-only repair fields were rejected and focused. A 10 MiB + 1 PDF was rejected; an exact 10 MiB PDF was accepted and cleared the previous error.
- The invalid returned-license query was stored, stripped from the URL, checked, and changed to the inactive-license notice. No real-money purchase was submitted.

## PWA, accessibility, privacy, and performance

- The live service worker controlled a fresh page. Offline reload succeeded and showed “Offline · still working.”
- A fresh two-version local worker exercise showed the update notice, applied **Update now**, reloaded under the new worker, and removed the old cache.
- Chromium parsed the standalone manifest with zero errors and found the 192, 512, and maskable icons.
- Keyboard checks passed: skip link first with a 4 px visible focus ring, Enter opened the repair dialog, focus entered the title, Tab stayed in the modal, Escape closed it, and focus returned to **Record a repair**.
- Axe 4.13 found zero violations on the live home/dialog, privacy, and terms pages at 390 px. Desktop and phone runs had no console errors.
- Ordinary create/reload use made only same-origin requests, created IndexedDB `maintenance-proof-book`, and left localStorage empty. Billing was the only cross-origin path exercised.
- All visible product/legal links were live; the checkout link redirected as expected and the privacy mail link was well formed.
- Fresh Lighthouse 13 completed successfully: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.4 s, TBT 50 ms, CLS 0, Speed Index 1.0 s.
- Initial app JS is 41,260 bytes raw / 13,175 bytes gzip; CSS is 20,874 bytes raw / 5,274 bytes gzip; hero WebP is 55,686 bytes; no webfonts ship.

This is a static local-first PWA, so server tenant isolation, SQLite restart persistence, and a product health endpoint are not applicable. Browser persistence and the external product-specific billing routes were checked instead.

## Commands and deployment identity

Started from a clean `main` checkout at documentation SHA `f8488e8`.

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS — 83 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 5/5 Vitest assertions |
| `npm run lint` | PASS — TypeScript no-emit check |
| `npm run build` | PASS — `dist/` generated; SW build `63645aab4b81` |
| `npm run test:e2e` | PASS — 12/12 Chromium tests |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm run test:live` | PASS — catalog, checkout redirect, invalid-token contract |
| `verify-url.sh` | PASS — 200, title/lang/main/h1/alt/buttons, no console errors |
| Declared claim commands | FAIL — `.factory/claims.json` is missing; zero commands exist |

All 29 publicly served files from the fresh `dist/` build matched the live response bytes. The live main JS SHA-256 is `dd5d1d34c61b5aac7dfb6c19d6daf440b12c6d0ea2c593e911e1712ae04b4bd6`, matching the build. The live CSS also matches. Commits after implementation SHA `8fc87ae` only changed verification/handoff documentation.

## Required next work

Implement the isolated one-click demo and its documentation; add the complete claims manifest and exact tagged tests; repair property validation and backup errors; add the real 404, metadata, robots/sitemap, and required route titles; then revise the first screen and standard site sections. Rebuild, deploy, and repeat this review from a clean profile.
