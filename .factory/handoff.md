# Maintenance Proof Book — verification 4 handoff

**Result:** PASS — zero findings and zero untested public claims

**Implementation verified:** `c3611bb1f2a7ba90274c02f0f786f731f592f8de`

**Documentation baseline:** `32b58547e314796429b73c7137872aafa942355c`

**Live URL:** <https://maintenance-proof-book.sociobot.in>

**Verified:** 2026-09-05 UTC

## What was done

Independent QA was repeated from a clean checkout without changing product code. Fresh desktop and phone contexts checked the first screen, full sample workflow, namespace isolation, reset/exit behavior, realistic evidence, responsive layout, keyboard/focus, reduced motion, routes, legal pages, offline reload, worker update, privacy requests, billing, and the designed 404.

All earlier QA, verification, and strict-review findings were rechecked. Their current dispositions and evidence are in [`.factory/verification-4.md`](verification-4.md).

## Verification results

- Unit: 6/6 passed.
- E2E: 24/24 passed across desktop and 390 × 844 Chromium.
- Claims: 15/15 passed together and every declared claim command passed individually.
- Lint, build to `dist/`, and moderate audit passed; audit found 0 vulnerabilities.
- Live product, checkout/invalid-license contract, and production-browser verification passed.
- The clean build matched all 38 live public files.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; FCP 1.01 s, LCP 1.31 s, TBT 77 ms, CLS 0.
- Billing burst: 30 allowed and 50 rate-limited responses; every 429 included `Retry-After`.

Run the local checks with:

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

Evidence is under `/work/.evidence/verification-4/`. The release-facing QA report is `/work/.evidence/qa-report.md`, and the machine result is `/work/.evidence/qa-result.json`.

## Applicability and known gap

This product is a static local-first PWA, so backend tenant/SQLite/health/restart checks and installed CLI/library/desktop checks do not apply. Browser persistence, service-worker offline/update behavior, and the external product-specific billing API were tested.

No real-money purchase was submitted. The hosted checkout redirect, price, invalid-token result, recorded valid-license path, revocation behavior, and rate limiting passed without spending.
