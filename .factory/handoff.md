# Maintenance Proof Book — verification handoff

**Work order:** maintenance-proof-book-verify-3
**Verdict:** **PASS**
**Candidate tested:** 8fc87ae21a6b217857d4e697e6f973e3f38d36d0
**Live URL:** <https://maintenance-proof-book.sociobot.in>
**Verified:** 2026-08-28 UTC

## Result

The candidate passes the researched local-first product contract. It provides a durable offline repair timeline linking repair, contractor, vendor/part, attachment, next action/date, and PDF proof export.

The earlier deployment-only billing blocker is resolved: the $24 production product is listed, checkout returns a hosted Dodo redirect, invalid license verification responds as expected, and the product verification endpoint rate-limits requests. No release defects were found.

## Commands and results

From a clean checkout: npm ci; npm test; npm run lint; npm run build; npm run test:e2e; npm audit --audit-level=moderate; npm run test:live.

All passed: 5/5 Vitest assertions, TypeScript check, production build, 12/12 Playwright desktop/mobile tests, audit with 0 vulnerabilities, and live billing smoke test. Initial app JS is 41.26 KB raw / 13.14 KB gzip; CSS is 20.87 KB raw / 5.27 KB gzip; hero WebP is 55.7 KB; there are no webfonts.

Independent Chromium checks confirmed a complete zero-cost repair with contractor, vendor, part, next action/date, PDF receipt, and an XSS-shaped title renders as text, survives reload, and exports a valid PDF. Whitespace validation and invalid-file recovery work. Exact 10 MiB attachment accepts while 10 MiB + 1 byte rejects. Five free records save and the sixth is clearly blocked.

New-profile ordinary use stored records in IndexedDB only, made no cross-origin request, and had no localStorage data, tracker, remote font, or CDN request. Desktop and 390 x 844 mobile had no overflow or visible target under 44 px. Keyboard reached the skip link, dialog title, and restored origin focus on Escape; reduced-motion transition was 1e-05s. Axe reported 0 serious/critical findings locally and live, with no console or page errors.

The live worker controlled the page and offline reload showed Offline · still working. A two-version local worker exercise installed a waiting update, displayed A fresh version is ready, activated it through Update now, and replaced old caches.

## Live deployment and policy

All 29 web-served files in this exact dist build matched live bytes. staticwebapp.config.json is deployment configuration and correctly returns 404. HTTPS responses include HSTS, CSP, anti-framing policy, nosniff, strict referrer policy, Permissions-Policy, correct manifest MIME, immutable hashed assets, and non-cacheable service worker.

A fresh 100-request invalid-license burst at 20-way concurrency received 31 x 200 and 69 x 429. Every 429 contained Retry-After from 0 to 4 seconds. A post-recovery sequential run first rejected request 4 because three calls remained in its quota window; clean-burst observed threshold is about 31 accepted calls per client/window.

## Known limitation

Lighthouse 13 was invoked with the Playwright Chromium path but its separately launched tab crashed in this container before writing a report. This is a test-environment limitation, not an observed product or browser-console failure; direct bundle budgets and browser checks passed.

## Remaining work

None for this candidate. Deploy dist; optionally regenerate a Lighthouse report where standalone Lighthouse Chromium is stable.
