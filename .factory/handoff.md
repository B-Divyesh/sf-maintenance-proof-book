# Maintenance Proof Book — review handoff

**Work order:** `maintenance-proof-book-review-1`
**Verdict:** **FAIL**
**Finding count:** 5
**Untested public claim count:** 14
**Implementation reviewed:** `8fc87ae21a6b217857d4e697e6f973e3f38d36d0`
**Documentation baseline:** `f8488e80a36f7d0900808cf95cd54f9ef7b484c9`
**Live URL:** <https://maintenance-proof-book.sociobot.in>
**Reviewed:** 2026-09-05 UTC

## Result

The deployed core workflow and every earlier reported defect pass, but the strict review fails five current finding groups. The product lacks an isolated sample demo and claims registry; its property/backup invalid paths need repair; its 404 and discovery metadata are incomplete; and its first screen/site skeleton does not meet the attached plain-word structure.

The complete evidence and remediation detail is in [review-1.md](review-1.md). No product code was modified.

## Verification summary

- `npm ci`, `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`, `npm audit --audit-level=moderate`, and `npm run test:live` passed.
- Unit tests: 5/5. Playwright: 12/12. Audit: 0 vulnerabilities.
- Fresh live desktop and 390 px phone profiles passed normal repair, persistence, attachment, search, PDF/JSON export, free-limit, delete/undo, keyboard, axe, offline reload, and reduced-motion checks.
- Lighthouse 13: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.4 s, CLS 0.
- Billing checkout redirected to the correct hosted $24 product. A 100-request verification burst returned 30 × 200 and 70 × 429, every rejection with `Retry-After: 4`.
- All 29 built public files matched live bytes, proving the deployed implementation is `8fc87ae` despite later report-only commits.

## Current blockers

1. Add the one-click populated demo, persistent demo label, reset/exit actions, and a separate storage namespace; document it in `.factory/demo.md`.
2. Add `.factory/claims.json` and exactly one `@claim:<id>` test command for each of the 14 inventoried public claims.
3. Reject whitespace-only property names and replace raw JSON parser text with a plain, actionable error.
4. Add a designed HTTP 404 plus canonical/Open Graph/Twitter metadata, `robots.txt`, `sitemap.xml`, and the Demo route title.
5. Bring the first screen, section order, header/footer, and copy audit into the plain-words and site-structure contract.

## Re-run

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --audit-level=moderate
npm run test:live
/opt/fleet/lib/verify-url.sh https://maintenance-proof-book.sociobot.in/ /work/.evidence/verify-url
```

Then run every command in `.factory/claims.json` from a fresh demo profile, inspect `/demo`, `/privacy`, `/terms`, and a missing route on desktop and 390 px mobile, and repeat the rate-limit probe.
