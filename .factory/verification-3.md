# Independent product verification — 3

**Verdict: PASS**

**Candidate:** 8fc87ae21a6b217857d4e697e6f973e3f38d36d0  
**Live URL:** <https://maintenance-proof-book.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Work order:** maintenance-proof-book-verify-3

## Decision

Maintenance Proof Book passes. The live deployment is byte-identical to the candidate public build and fulfills the homeowner job: repair, contractor, vendor/part, evidence, next action/date, local persistence, and homeowner PDF export.

The previously reported deployment blocker is resolved. Fresh evidence shows a catalogued $24 product, checkout 303 redirect to checkout.dodopayments.com, correct invalid-token verification, and enforced API rate limiting.

## Clean-checkout gates

| Gate | Fresh result |
| --- | --- |
| npm ci | PASS — 83 packages installed; 0 vulnerabilities |
| npm test | PASS — 5/5 assertions |
| npm run lint | PASS — TypeScript no-emit check |
| npm run build | PASS — dist generated and worker assets injected |
| npm run test:e2e | PASS — 12/12 desktop and 390 x 844 Chromium tests |
| npm audit --audit-level=moderate | PASS — 0 vulnerabilities |
| npm run test:live | PASS — catalog, checkout redirect, invalid-token contract |

Initial application JS is 41.26 KB raw / 13.14 KB gzip; CSS is 20.87 KB raw / 5.27 KB gzip; hero WebP is 55.7 KB; no webfonts ship. Static PWA transfer budgets pass.

## Functional, PWA, and accessibility evidence

- A normal zero-cost repair with contractor, vendor, part, PDF evidence and next action/date saved, persisted after reload, and exported a PDF. An XSS-shaped title was escaped.
- Whitespace-only required values gave actionable alert and focus recovery. Invalid file type rejected and valid replacement cleared the stale alert. Exact 10 MiB accepted; 10 MiB + 1 byte rejected. Five free records saved; sixth was blocked clearly.
- Fresh-profile ordinary use made only same-origin requests, used IndexedDB, and had no localStorage value, tracker, remote font, or runtime CDN.
- Live worker control and offline reload were observed. A two-version worker exercise installed a waiting update, offered the update toast, applied Update now, and moved caches to the new version.
- Local and live Axe scans found 0 serious/critical issues. URL verification found title, language, one h1, main, alt text and labelled buttons. No console/page errors occurred.
- At 390 x 844 there was no overflow and no visible interactive target below 44 px. Keyboard skip link, modal focus, Escape restoration, and reduced motion passed.

## Live identity, policies, and rate limit

All 29 publicly served files in fresh dist matched live bytes. staticwebapp.config.json is deployment-only and correctly is not web-served. Production has HTTPS/HSTS, strict self CSP with documented Sociobot billing connection, anti-framing, nosniff, strict referrer policy, Permissions-Policy, correct manifest MIME, immutable hashed assets and non-cacheable service worker.

A 100-request invalid-license burst at 20-way parallel returned 31 x 200 and 69 x 429; every rejection had Retry-After from 0 to 4 seconds. After recovery a sequential run first rejected request 4 because three quota slots remained. Clean-burst observed threshold: about 31 accepted calls per client/window.

## Defects by severity

None observed.

## Verification limitation

Lighthouse 13 standalone Chromium crashed before writing a report in this container. This is not an observed product failure; direct browser checks and bundle budgets passed.
