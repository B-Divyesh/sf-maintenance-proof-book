# Maintenance Proof Book — build handoff

Build date: 2026-08-28  
Work order: `maintenance-proof-book-build-1`  
Artifact: static offline PWA (`dist/`)

## What shipped

- A complete local-first property timeline with property name/address, repair cards, contractor/vendor/part/cost fields, work notes, next action, due date, search, due filters, and status summaries.
- Photo and PDF attachments stored as IndexedDB blobs. The interface records filename, MIME type, bytes, and added timestamp, enforces 10 MB per file / 50 MB per repair, and reports the browser storage allowance.
- Create, read, edit, delete, specific confirmation, and 10-second undo flows. Required repair/date/next-action validation and actionable empty/error/filter states are included.
- A readable single PDF export generated on-device. It embeds photo evidence and lists provenance for every image/PDF attachment. The export explicitly avoids legal-certification claims.
- Full JSON backup and destructive-confirm restore, including original attachment bytes. Both ownership exports are free.
- An installable manifest, 192/512/maskable icons, versioned service worker, offline fallback, build-injected hashed precache, runtime cache, update toast, `skipWaiting`, and `clientsClaim`.
- A five-record free allowance and $24 one-time unlimited unlock using only the Sociobot checkout/verify contract. Return tokens are stored under `sb_license:maintenance-proof-book`, stripped from the URL, optimistically unlocked, checked at most daily, reconciled in the background, and paste-restorable.
- Direct `/privacy` and `/terms` static entry points. No analytics, third-party scripts/fonts, accounts, or cloud record storage.
- The blueprint drafting-sheet visual system and the original generated evidence illustration with prompt/model/date provenance in `.factory/design.md` and `assets/src/`.

## How to run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Build command: `npm run build`  
Deploy directory: `dist` (`dist/index.html` exists)

Verification completed locally:

- `npm test`: 4/4 unit tests passed.
- `npm run test:e2e`: 6/6 Playwright tests passed across desktop Chromium and a 390×844 mobile viewport.
- Offline: app shell reloaded with `context.setOffline(true)` on both viewports; records remain powered by IndexedDB. The offline worker was additionally stress-run three times on mobile after its cache fix.
- Axe via Playwright: 0 serious or critical violations on the main empty state, desktop and mobile.
- Factory `verify-url.sh`: HTTP 200, no console/page errors, `lang=en`, exactly one `h1`, `<main>` present, zero images missing alt, zero unlabeled buttons. Recorded load: 612 ms on the local preview.
- Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices 100; FCP 1.0 s, LCP 1.7 s, Total Blocking Time 0 ms, CLS 0, Speed Index 1.0 s.
- Production asset budgets: initial app JS 40.53 KB raw / 12.91 KB gzip; CSS 20.78 KB raw / 5.30 KB gzip; hero WebP 55 KB. The larger PDF engine is a lazy chunk and is precached after install for offline export.
- `npm audit`: 0 vulnerabilities (production and development).
- Visual screenshots, Lighthouse JSON, and factory verification JSON are in `.factory/evidence/`.

## Known limits and release steps

- The app intentionally has no cloud sync or multi-property workflow. Records exist per browser profile until exported/restored; private/incognito modes may discard them.
- PDF receipt files are preserved in full in JSON backups and indexed with provenance in the PDF export; their pages are not merged into the rendered PDF. Image attachments are embedded as previews.
- Currency is USD in v1. Date display follows the browser locale while stored values remain ISO dates.
- Register the Sociobot product slug at the displayed $24 one-time price and confirm its production return URL before release. No product ID or direct payment-provider integration is present.
- Deployment should give hashed `/assets/*` immutable caching and revalidate `sw.js`/HTML. The factory owns deployment, DNS, and billing setup.
