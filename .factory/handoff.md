# Maintenance Proof Book — repair handoff

**Work order:** `maintenance-proof-book-repair-2` (2026-08-28 UTC)
**Base verified:** `820bb5e5712adde08f5bd3b967d7918f9e98c596`
**Repair commit:** `dfe4a8e`
**Live:** <https://maintenance-proof-book.sociobot.in>

## Result

The two application-owned release blockers from
[`verification-2.md`](verification-2.md) are repaired with browser regression
coverage:

1. **QA2-002 — mobile clipping and undersized readable text:** the emphasized
   hero line can now wrap instead of being hidden by the hero container. All
   readable control, support, legal, evidence, footer, and drafting-label text
   is at least 16 CSS px. The 390 px regression asserts the emphasized line is
   within the hero, there is no horizontal overflow, and every visible element
   with direct readable text is at least 16 px.
2. **QA2-003 — whitespace and stale attachment alert:** required repair title
   and next-action values are validated after trimming. A specific alert is
   associated with the invalid field, focus moves there, and native validation
   is updated. A new attachment selection first clears an old attachment
   error; a successful attachment leaves no false rejection announced.

### External blocker that cannot be repaired in this artifact

**QA2-001 remains a release blocker.** The failing resource is the
factory-owned, cross-origin service
`https://api.sociobot.in/api/v1/products/maintenance-proof-book/verify`, not a
route implemented, built, or deployed by this static PWA (this repository has
no `api/` directory and the static deployment contains only client assets).
Directly probing the live endpoint in four immediate batches of 25 requests on
2026-08-28 returned **100 × 200**, **0 × 429**, and no `Retry-After`. A
client-side change cannot make a direct request to that service rate-limit.

The owning billing API must enforce a finite per-client/token/IP threshold and
return `429` with a valid `Retry-After`; then rerun the same bounded burst and
record the first rejected response. The existing client already makes at most
one background verification per cached 24-hour verdict and does not block the
free local-first workflow on a verification failure.

## Exact verification evidence

Fresh dependency install and repository checks:

- `npm ci` — PASS; 83 packages installed, 84 audited, 0 vulnerabilities.
- `npm test` — PASS; 5/5 Vitest assertions.
- `npm run lint` — PASS (`tsc --noEmit`).
- `npm run build` — PASS; `dist/` produced. Initial application JS:
  `main-B_xGJvSq.js`, 41.26 KB raw / 13.14 KB gzip. CSS: 20.87 KB raw /
  5.27 KB gzip.
- `npm run test:e2e` — PASS; 12/12 Playwright checks (six scenarios each in
  desktop Chromium and the 390 × 844 mobile project). These include local
  persistence and PDF evidence, legal routes, axe serious/critical checks,
  offline controlled-shell reload, touch links, the new 390 px type/overflow
  assertion, and the new whitespace/attachment-recovery path.
- `npm audit --audit-level=moderate` — PASS; 0 vulnerabilities.
- `npm run test:live` — PASS; catalog identity, hosted checkout HTTP 303 to
  `checkout.dodopayments.com`, and the invalid-license contract.

Browser, accessibility, and performance:

- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/` — PASS: HTTP 200,
  title, `lang="en"`, exactly one `<h1>`, `<main>`, image alt text, labelled
  buttons, and no browser console/page errors.
- Lighthouse 13 local mobile run — performance **100**, accessibility **100**,
  best practices **100**, SEO **92**; LCP **1.7 s**, TBT **10 ms**, CLS **0**,
  transfer **88 KiB**. (The 92 local SEO score is the expected lack of an HTTPS
  transport audit on `127.0.0.1`; the deployed site uses HTTPS.)
- The Playwright suite uses the pinned Playwright 1.58.2 browser and validates
  both desktop and 390 px mobile. Its existing offline test explicitly calls
  `context.setOffline(true)` after service-worker control and confirms the
  shell reloads with the offline state.
- The existing axe integration reports no serious or critical findings. The
  repaired custom validation announces its text via the existing alert region,
  gives the invalid control `aria-describedby`, and focuses it.

Response/privacy/live identity:

- Build configuration still supplies immutable hashed assets
  (`public, max-age=31536000, immutable`), a non-cacheable worker
  (`no-cache, no-store, must-revalidate`), manifest MIME
  `application/manifest+json`, strict CSP with `frame-ancestors 'none'`, and
  `X-Frame-Options: DENY`.
- No product data leaves IndexedDB during ordinary use. There are no trackers,
  remote fonts, or runtime CDNs. Checkout and license verification remain the
  documented Sociobot billing interactions.
- Deployed with the factory static deployer as Azure deployment
  `85d607f6-20b5-4892-bfd9-0a04ec57d012`. Post-deploy
  `/opt/fleet/lib/verify-url.sh` passed with no console/page errors, and the
  live `main-B_xGJvSq.js` SHA-256 matches the exact `dist/` asset.
- A fresh live 390 × 844 browser check measured hero right = **390 px** and
  emphasized-line right = **296.28 px**, with **390 px** document width,
  **0** visible undersized readable elements, title focus after keyboard Enter,
  and dialog close on Escape.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --audit-level=moderate
npm run test:live
```

The work order keeps the artifact class as **static PWA**. Deploy `dist/` with
the factory static deployer; `dist/index.html` is the root entry point and
`staticwebapp.config.json` is included.

No real-money purchase was submitted. The real hosted checkout redirect,
catalog identity, return-token implementation, and invalid-token
reconciliation were exercised without creating a customer transaction.
