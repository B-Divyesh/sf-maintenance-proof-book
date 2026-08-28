# Maintenance Proof Book — repair handoff

**Status:** repaired and deployed

**Repair commit:** `de105b3bd50d69240a764f11a3b2c513a2afe925`

**Live:** <https://maintenance-proof-book.sociobot.in>

**Work order:** `maintenance-proof-book-repair-1` (2026-08-28 UTC)

## Release-blocker repairs

- **QA-001 — paid unlock:** created the live Dodo one-time product `Maintenance Proof Book Unlimited` at **$24 USD** and registered/enabled it in the factory product registry as `maintenance-proof-book`. The public catalog now reports the expected product and checkout `HEAD` returns **303** to `checkout.dodopayments.com`. The hosted page renders the exact product name and $24 price. The registry return URL is `https://maintenance-proof-book.sociobot.in/`; the existing client stores an incoming `license` query token, removes it with `history.replaceState`, optimistically unlocks, and reconciles against the existing verification endpoint. `npm run test:live` guards catalog identity, hosted redirect, and invalid-token verification.
- **QA-002 — touch targets:** expanded the brand, legal/footer, attachment-download, and offline links to at least **44 × 44 CSS px**; made the Undo toast action 44 px high too. A Playwright regression measures every visible app link at desktop and 390 × 844.
- **QA-003 — asset cache policy:** added checked-in `public/staticwebapp.config.json`, copied to `dist/`, to serve `/assets/*` as `public, max-age=31536000, immutable` while keeping HTML and the manifest revalidatable and `sw.js` non-cacheable.
- **QA-004 — response policy:** the same deploy configuration provides strict CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, an explicit Permissions Policy, `nosniff`, and the correct `application/manifest+json` MIME type. The inline offline-fallback style was moved to `offline.css` so it remains compatible with the strict CSP.

## Verification evidence

Fresh clean install and local checks:

- `npm ci` — PASS; 84 packages, 0 audit vulnerabilities.
- `npm test` — PASS; 5/5 Vitest assertions, including static response-policy regression coverage.
- `npm run lint` — PASS (`tsc --noEmit`).
- `npm run build` — PASS; `dist/` produced. Initial app JS is 40.53 KB raw / 12.91 KB gzip; CSS is 20.93 KB raw / 5.33 KB gzip.
- `npm run test:e2e` — PASS; 8/8 across desktop Chromium and 390 × 844 mobile. Covers create/persist/PDF, legal routes, axe serious/critical, offline reload, and touch geometry.
- `npm audit --audit-level=moderate` — PASS; 0 vulnerabilities.
- `npm run test:live` — PASS: product catalog identity, checkout HTTP 303 to `checkout.dodopayments.com`, and invalid-token verification contract.

Static Web Apps runtime validation against `dist/` confirmed:

- hashed asset: `Cache-Control: public, max-age=31536000, immutable`;
- manifest: `Content-Type: application/manifest+json` and `Cache-Control: public, max-age=0, must-revalidate`;
- CSP, Permissions Policy, and `X-Frame-Options: DENY` present.

Post-deploy live validation confirmed the current `main-BW3HeTOy.js` is byte-identical to `dist` (SHA-256 `3dbc8b88f75a98d850cc55c3e74e30eea0d5afbd17d8cb083ff3301c3ba40303`). Live desktop and 390 px browser checks had one `<h1>`, a `<main>`, no horizontal overflow, no console/page errors, no sub-44 px visible links, service-worker control, and successful offline reload with the “Offline · still working” state.

## Run / deploy

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm run test:live
```

Deploy `dist/` with the factory static deployer; `staticwebapp.config.json` is already included in the artifact.

## Known gap

No real-money checkout was submitted in this automated repair because that would create a live customer transaction. The real catalog entry, hosted checkout redirect, product/price page, registry return URL, token-capture implementation, and verification endpoint were all exercised. Complete a controlled purchase before changing price/currency or payment-provider configuration.
