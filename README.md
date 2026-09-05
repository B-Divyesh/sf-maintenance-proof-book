# Maintenance Proof Book

Maintenance Proof Book is a private, offline-first record for homeowners who need to connect a repair with the contractor, part, vendor, cost, receipt/photo evidence, and next service decision. It is deliberately smaller than a property-management system: one durable evidence packet per repair, arranged on a searchable property timeline.

Live product: <https://maintenance-proof-book.sociobot.in>

Try the isolated sample: <https://maintenance-proof-book.sociobot.in/demo>

## What v1 includes

- Local IndexedDB storage for property details, repair records, and attachment blobs
- Photo and PDF evidence, with name/type/size/capture provenance
- Search plus due-date filtering, overdue and upcoming status, edit/delete, and timed undo
- On-device evidence PDF export with image previews and an attachment index
- Full JSON backup/restore, including original attachment data
- Installable PWA shell with offline create/edit/export behavior
- A useful free book of five repairs; a $24 one-time Sociobot license unlocks unlimited records
- `/privacy` and `/terms` pages, with no analytics, trackers, remote fonts, or runtime CDNs

The demo opens three completed repairs with a roof photo and PDF receipts. It uses the separate `demo:maintenance-proof-book` IndexedDB database. **Reset demo** restores the sample. **Start for real** deletes the demo book and opens the normal `maintenance-proof-book` database.

Data never leaves the device during ordinary use. License purchase and verification are the only network API calls. Browser storage is not a backup: the interface reports its allowance and explains how to keep periodic JSON copies.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Vite prints the local development URL. IndexedDB and service workers are tied to the browser origin, so development data is separate from production.

## Test and build

```sh
npm test
npm run lint
npm run build
npm run test:e2e
npm run test:claims
npm run test:live
```

`npm run build` is the deployment build command. It type-checks, writes the static product to `./dist`, and injects the exact hashed asset set into the versioned service worker so lazy PDF code is also available offline. `dist/index.html`, `dist/privacy/index.html`, and `dist/terms/index.html` are direct static entry points.

Playwright is pinned to 1.58.2. The end-to-end suite covers Chromium desktop and a 390 px mobile viewport. It checks IndexedDB persistence, attachments, exports, legal pages, accessibility, offline reload, and 44 × 44 px targets. `test:claims` runs every public promise from the isolated demo. `.factory/claims.json` maps each promise to its exact command. `test:live` checks the live catalog, checkout redirect, and license-verification contract.

## Paid unlock

The interface uses only the Sociobot billing contract for `maintenance-proof-book`:

- checkout: `https://api.sociobot.in/api/v1/products/maintenance-proof-book/checkout`
- verify: `https://api.sociobot.in/api/v1/products/maintenance-proof-book/verify?license=…`
- local token key: `sb_license:maintenance-proof-book`

No payment provider or product ID is embedded. The product is registered in the Sociobot factory catalog at the displayed $24 one-time price. PDF/JSON export, accessibility, stored records, and safety behavior are never gated.

## Deploy

Deploy the contents of `dist/` as a static site. The deployment config defines the `/demo` entry, the designed 404 response, cache rules, security headers, and the manifest MIME type. DNS is managed by the factory deployer.

The product-specific design system and generated-asset provenance are in [`.factory/design.md`](.factory/design.md). The final verification record is in [`.factory/handoff.md`](.factory/handoff.md).

## License

MIT — see [LICENSE](LICENSE).
