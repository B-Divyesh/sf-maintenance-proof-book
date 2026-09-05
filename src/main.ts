import './styles.css';
import { clearBook, configureDatabase, createBackup, getAllRecords, getSetting, removeRecord, restoreBackup, saveRecord, setSetting } from './db';
import type { Attachment, PropertyProfile, RepairRecord } from './types';
import { dueState, escapeHtml, formatBytes, formatDate, FREE_RECORD_LIMIT, makeCheckoutUrl, MAX_FILE_BYTES, MAX_RECORD_BYTES, PRODUCT_SLUG, sortRecords } from './utils';

const app = document.querySelector<HTMLDivElement>('#app')!;
if (!app) throw new Error('App mount is missing.');

const normalizedRoute = location.pathname.replace(/\/$/, '') || '/';
const demoMode = normalizedRoute === '/demo' || new URL(location.href).searchParams.get('demo') === '1';
configureDatabase(demoMode);

const defaultProperty: PropertyProfile = { name: 'My home', address: '' };
let records: RepairRecord[] = [];
let property: PropertyProfile = defaultProperty;
let unlocked = false;
let storageFailed = false;
let searchTerm = '';
let dueFilter = 'all';
let stagedAttachments: Attachment[] = [];
let deletedRecord: RepairRecord | null = null;
let undoTimer = 0;
const previewUrls = new Set<string>();

type LicenseVerdict = { valid: boolean; checkedAt: number; reason?: string };
const licenseKey = `sb_license:${PRODUCT_SLUG}`;
const verdictKey = `${licenseKey}:verdict`;
const BUILD_LABEL = 'v1.1.0';

function icon(name: 'plus' | 'paperclip' | 'calendar' | 'download' | 'edit' | 'trash' | 'check' | 'home' | 'search' | 'lock'): string {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    paperclip: '<path d="m20 11.5-8.5 8.5a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.9-2.9l8.4-8.4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7M10 11v6m4-6v6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    home: '<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
  };
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function headerMarkup(showData = false): string {
  return `<header class="site-header">
    <a class="brand" href="/" aria-label="Maintenance Proof Book home"><img src="/icons/icon.svg" alt="" width="40" height="40"><span>Maintenance<br>Proof Book</span></a>
    <nav class="site-nav" aria-label="Main navigation"><a href="/demo">Demo</a><a href="/#timeline">Repair log</a><a href="/privacy">Privacy</a></nav>
    ${showData ? `<div class="header-actions"><span id="network-status" class="network-badge" role="status"><span class="status-dot"></span><span>${navigator.onLine ? 'Saved locally' : 'Offline · still working'}</span></span><button class="button button-small button-ghost" type="button" data-action="open-data">Data & backup</button></div>` : ''}
  </header>`;
}

function footerMarkup(): string {
  return `<footer class="site-footer"><p>Keep home repair proof and next service dates together.</p><nav aria-label="Footer navigation"><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav><p>Built by Param Factory · ${BUILD_LABEL}</p><p>Original generated imagery is disclosed in the design notes.</p></footer>`;
}

function setRouteMetadata(title: string, description: string, canonicalPath: string): void {
  document.title = title;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = `https://maintenance-proof-book.sociobot.in${canonicalPath}`;
  document.querySelectorAll<HTMLMetaElement>('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach((meta) => { meta.content = description; });
  document.querySelectorAll<HTMLMetaElement>('meta[property="og:title"], meta[name="twitter:title"]').forEach((meta) => { meta.content = title; });
  const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = `https://maintenance-proof-book.sociobot.in${canonicalPath}`;
}

function renderLegal(kind: 'privacy' | 'terms'): void {
  const privacy = kind === 'privacy';
  setRouteMetadata(`${privacy ? 'Privacy' : 'Terms'} — Maintenance Proof Book`, privacy ? 'Learn what Maintenance Proof Book stores on your device and when it contacts the billing service.' : 'Read the terms for Maintenance Proof Book records, backups, exports, and the one-time license.', `/${kind}`);
  app.innerHTML = `
    ${headerMarkup()}
    <main id="main-content" class="legal-shell paper-sheet">
      <p class="kicker">${privacy ? 'Privacy' : 'Terms'}</p>
      <h1>${privacy ? 'Privacy for your repair records' : 'Terms for using this proof book'}</h1>
      ${privacy ? `
        <p class="lede">Maintenance Proof Book stores property details, repairs, photos, and receipts in IndexedDB on this device.</p>
        <h2>What leaves your device</h2><p>Ordinary repair work sends no product data away. Buying or checking a license sends only the token to Sociobot’s billing API.</p><p>Sociobot/Dodo hosts checkout as the merchant of record. This app never receives card details.</p>
        <h2>Backups and exports</h2><p>PDF and JSON exports are created on your device. You choose where to store or share them.</p><p>JSON backups include attachments. They may contain a private address or vendor details.</p>
        <h2>Removal and retention</h2><p>Delete individual repairs inside the app. Clear this site’s browser storage to erase everything.</p><p>Uninstalling the PWA may not clear browser storage. License tokens remain until you clear this site’s data.</p>
        <h2>Contact</h2><p>For product privacy questions, contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>` : `
        <p class="lede">Use Maintenance Proof Book to keep your own home maintenance records.</p><p>It is not a warranty, legal certification, inspection, safety service, or proof of authenticity.</p>
        <h2>Your responsibility</h2><p>You are responsible for accurate entries, safe exports, and following qualified guidance. Do not use the app for urgent safety reminders.</p>
        <h2>One-time license</h2><p>The $24 one-time license enables unlimited repair records for this product version.</p><p>Sociobot/Dodo handles payment and refunds as the merchant of record. A refund or revocation can end paid capacity.</p><p>Your existing records and exports remain accessible.</p>
        <h2>Availability and liability</h2><p>The software is provided “as is” without warranties. Browser storage can be cleared or damaged, so keep JSON backups.</p><p>Where law allows, the authors are not liable for lost data, missed maintenance, or decisions based on a record.</p>
        <h2>Changes</h2><p>Material changes will be dated here. These terms are effective 28 August 2026.</p>`}
      <p><a class="text-link" href="/">← Return to your proof book</a></p>
    </main>
    ${footerMarkup()}`;
}

function appMarkup(): string {
  return `
    ${headerMarkup(true)}
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo status"><strong>Demo — sample data, nothing is saved</strong><span>Changes stay in a separate demo book.</span><button type="button" data-action="reset-demo">Reset demo</button><a href="/" data-action="start-real">Start for real</a></aside>` : ''}
    <main id="main-content">
      ${demoMode ? `<section class="demo-intro" aria-labelledby="page-title"><p class="kicker kicker-light">Sample repair book</p><h1 id="page-title">Review completed home repair records</h1><p>Open a packet, edit a repair, export it, or reset the sample.</p></section>` : `<section class="hero blueprint-section" aria-labelledby="page-title">
        <div class="hero-copy">
          <p class="kicker kicker-light">Home repair records</p>
          <h1 id="page-title">Keep proof of every home repair</h1>
          <p class="hero-lede">For homeowners who need each repair, contractor, part, receipt, photo, and next service date in one record.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="/demo">Try it with sample data</a>
            <button class="button button-quiet" type="button" data-action="new-record">${icon('plus')} Record a repair</button>
          </div>
          <p class="action-note">The sample opens three repairs in a separate demo book.</p>
          <ul class="hero-facts"><li>Works offline after your first visit.</li><li>No account or tracking.</li><li>Five repairs free. Unlimited records cost $24 once.</li></ul>
        </div>
        <figure class="hero-art">
          <picture><source srcset="/assets/evidence-exploded.webp" type="image/webp"><img src="/assets/evidence-exploded.jpg" width="1200" height="800" alt="Exploded blueprint illustration connecting a roof repair to its receipt, photo, fastener and service calendar" fetchpriority="high" decoding="async"></picture>
          <figcaption><span>Repair packet</span> Work, evidence, and the next date stay together.</figcaption>
        </figure>
      </section>`}

      <section id="timeline" class="workspace" aria-labelledby="timeline-title">
        <div class="property-strip">
          <div>${icon('home')}<div><span class="micro-label">Property</span><strong id="property-label">${escapeHtml(property.name)}</strong><span id="address-label">${escapeHtml(property.address || 'Address stays private until you add it')}</span></div></div>
          <button class="button button-small button-paper" type="button" data-action="edit-property">Edit property</button>
        </div>
        <div class="summary-grid" aria-label="Proof book summary">
          <div><span class="summary-number" id="record-count">0</span><span>repair records</span></div>
          <div><span class="summary-number" id="evidence-count">0</span><span>evidence files</span></div>
          <div><span class="summary-number" id="due-count">0</span><span>due or upcoming</span></div>
        </div>
        <div class="timeline-heading">
          <div><p class="kicker kicker-light">Repair history</p><h2 id="timeline-title">Property timeline</h2></div>
          <button class="button button-primary" type="button" data-action="new-record">${icon('plus')} Record a repair</button>
        </div>
        <div class="toolbar" aria-label="Filter repair records">
          <label class="search-field">${icon('search')}<span class="sr-only">Search repairs</span><input id="search" type="search" placeholder="Search repairs, parts, or contractors" autocomplete="off"></label>
          <label class="filter-field"><span class="sr-only">Filter by next due date</span><select id="due-filter"><option value="all">All dates</option><option value="needs-action">Due or next 30 days</option><option value="scheduled">Scheduled later</option><option value="none">No due date</option></select></label>
        </div>
        <div id="timeline-content" aria-live="polite"></div>
      </section>

      <section class="how-section paper-section" aria-labelledby="how-title">
        <p class="kicker">How it works</p><h2 id="how-title">Build one record for each repair</h2>
        <ol class="how-list"><li><strong>Record the work</strong><span>Add the date, contractor, part, cost, and notes.</span></li><li><strong>Attach the evidence</strong><span>Add photos or PDF receipts while they are easy to find.</span></li><li><strong>Set the next action</strong><span>Choose what to check and when it is due.</span></li></ol>
      </section>

      <section class="limits-section" aria-labelledby="limits-title">
        <div><p class="kicker kicker-light">Privacy and limits</p><h2 id="limits-title">What this proof book does not do</h2></div>
        <ul><li>It does not upload repair records or attachments.</li><li>It does not replace an inspection, warranty, or safety reminder.</li><li>It does not certify that a receipt or photo is authentic.</li><li>Browser storage can be cleared, so keep JSON backups.</li></ul>
      </section>

      <section class="unlock-section" id="unlock" aria-labelledby="unlock-title">
        <div><p class="kicker kicker-light">Price</p><h2 id="unlock-title">Add unlimited repair records</h2><p>The free book holds five repairs. A $24 one-time license enables unlimited records. PDF and JSON exports remain free.</p></div>
        <div class="unlock-card">
          <p class="price"><span>$24</span> one time</p>
          <ul><li>${icon('check')} Unlimited repair records</li><li>${icon('check')} Restore the license on another device</li><li>${icon('check')} Existing records always remain readable</li></ul>
          <a class="button button-primary button-full" id="buy-link" href="${makeCheckoutUrl()}">Buy the one-time unlock</a>
          <button class="button button-quiet button-full" type="button" data-action="restore-license">Have a license? Restore it</button>
          <p class="fine-print">Checkout and refunds are handled by Sociobot/Dodo, merchant of record. <a href="/terms">Terms</a></p>
        </div>
      </section>
    </main>
    ${footerMarkup()}

    <dialog id="record-dialog" class="sheet-dialog" aria-labelledby="record-dialog-title">
      <form id="record-form" method="dialog" novalidate>
        <div class="dialog-head"><div><p class="kicker">Repair packet</p><h2 id="record-dialog-title">Record a repair</h2></div><button class="icon-button" type="button" data-action="close-record" aria-label="Close repair form">×</button></div>
        <input type="hidden" name="id">
        <div class="form-grid">
          <label class="field field-wide"><span>What was repaired? <b aria-hidden="true">*</b></span><input name="title" required maxlength="100" autocomplete="off" aria-describedby="form-error" placeholder="e.g. Replaced leaking kitchen tap"><small>Use a name you’ll recognize years from now.</small></label>
          <label class="field"><span>Area of the home</span><input name="area" maxlength="60" autocomplete="off" placeholder="Kitchen"></label>
          <label class="field"><span>Work completed <b aria-hidden="true">*</b></span><input name="completedDate" type="date" required></label>
          <label class="field"><span>Contractor</span><input name="contractor" maxlength="100" autocomplete="organization" placeholder="Name or company"></label>
          <label class="field"><span>Part vendor</span><input name="vendor" maxlength="100" autocomplete="off" placeholder="Where the part came from"></label>
          <label class="field"><span>Part / model</span><input name="part" maxlength="120" autocomplete="off" placeholder="Part number, model, or material"></label>
          <label class="field"><span>Cost (USD)</span><input name="cost" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></label>
          <label class="field field-wide"><span>Work notes</span><textarea name="notes" rows="4" maxlength="2000" placeholder="What failed, what changed, warranty details…"></textarea></label>
        </div>
        <fieldset class="next-step-box"><legend>What happens next? <b aria-hidden="true">*</b></legend><div class="form-grid"><label class="field"><span>Next action</span><input name="nextAction" required maxlength="160" aria-describedby="form-error" placeholder="Inspect seal or no follow-up needed"><small>Required so every repair ends with a decision.</small></label><label class="field"><span>Next due date</span><input name="nextDue" type="date"></label></div></fieldset>
        <fieldset class="evidence-box"><legend>Evidence attachments</legend><p>Photos and PDF receipts, up to 10 MB each and 50 MB per repair. Files stay on this device.</p><label class="file-drop">${icon('paperclip')}<span><strong>Add photos or receipts</strong><small>Choose images or PDFs</small></span><input id="attachment-input" type="file" accept="image/*,application/pdf,.pdf" multiple></label><div id="staged-evidence" class="evidence-list"></div></fieldset>
        <div id="form-error" class="form-error" role="alert"></div>
        <div class="dialog-actions"><button class="button button-quiet" type="button" data-action="close-record">Cancel</button><button class="button button-primary" type="submit">${icon('check')} Save repair packet</button></div>
      </form>
    </dialog>

    <dialog id="view-dialog" class="sheet-dialog view-dialog" aria-labelledby="view-dialog-title"><div id="view-content"></div></dialog>
    <dialog id="property-dialog" class="sheet-dialog small-dialog" aria-labelledby="property-dialog-title"><form id="property-form" method="dialog" novalidate><div class="dialog-head"><div><p class="kicker">Property details</p><h2 id="property-dialog-title">Name this property</h2></div><button class="icon-button" type="button" data-action="close-property" aria-label="Close property form">×</button></div><label class="field"><span>Property name</span><input name="name" required maxlength="80" autocomplete="off" aria-describedby="property-error"></label><label class="field"><span>Address</span><textarea name="address" rows="3" maxlength="240" autocomplete="street-address"></textarea><small>Optional. Stored only on this device and included in your exports.</small></label><p id="property-error" class="form-error" role="alert"></p><div class="dialog-actions"><button class="button button-quiet" type="button" data-action="close-property">Cancel</button><button class="button button-primary" type="submit">Save property</button></div></form></dialog>
    <dialog id="data-dialog" class="sheet-dialog small-dialog" aria-labelledby="data-dialog-title"><div class="dialog-head"><div><p class="kicker">Data ownership</p><h2 id="data-dialog-title">Back up your proof book</h2></div><button class="icon-button" type="button" data-action="close-data" aria-label="Close data and backup">×</button></div><p>Your browser can clear local storage. Keep a JSON backup somewhere safe; it includes every attachment and can be restored here.</p><div class="data-actions"><button class="button button-paper" type="button" data-action="export-pdf">${icon('download')} Export evidence PDF</button><button class="button button-paper" type="button" data-action="export-json">${icon('download')} Download JSON backup</button><label class="button button-quiet import-button">Restore JSON backup<input id="import-input" type="file" accept="application/json,.json"></label></div><p id="storage-meter" class="storage-note">Checking browser storage…</p><p class="fine-print">Import replaces the current local proof book after confirmation. A PDF is a readable homeowner record, not a legal certification.</p></dialog>
    <dialog id="license-dialog" class="sheet-dialog small-dialog" aria-labelledby="license-dialog-title"><form id="license-form" method="dialog"><div class="dialog-head"><div><p class="kicker">One-time unlock</p><h2 id="license-dialog-title">Restore a license</h2></div><button class="icon-button" type="button" data-action="close-license" aria-label="Close license form">×</button></div><label class="field"><span>License token</span><input name="license" required autocomplete="off" spellcheck="false" placeholder="Paste your token"></label><p class="fine-print">The token is saved on this device and sent only to Sociobot for verification.</p><div id="license-error" class="form-error" role="alert"></div><div class="dialog-actions"><button class="button button-quiet" type="button" data-action="close-license">Cancel</button><button class="button button-primary" type="submit">Verify and restore</button></div></form></dialog>
    <div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="true"></div>`;
}

function getDialog(id: string): HTMLDialogElement { return document.querySelector<HTMLDialogElement>(`#${id}`)!; }

function unlockMarkup(): string {
  if (unlocked) return `<div class="unlocked-note">${icon('check')}<div><p class="kicker kicker-light">License active</p><h2 id="unlock-title">Unlimited records are ready</h2><p>Your license is stored on this device. Your records and exports stay available.</p></div></div>`;
  return `<div><p class="kicker kicker-light">Price</p><h2 id="unlock-title">Add unlimited repair records</h2><p>The free book holds five repairs. A $24 one-time license enables unlimited records. PDF and JSON exports remain free.</p></div>
    <div class="unlock-card"><p class="price"><span>$24</span> one time</p><ul><li>${icon('check')} Unlimited repair records</li><li>${icon('check')} Restore the license on another device</li><li>${icon('check')} Existing records always remain readable</li></ul><a class="button button-primary button-full" id="buy-link" href="${makeCheckoutUrl()}">Buy the one-time unlock</a><button class="button button-quiet button-full" type="button" data-action="restore-license">Have a license? Restore it</button><p class="fine-print">Checkout and refunds are handled by Sociobot/Dodo, merchant of record. <a href="/terms">Terms</a></p></div>`;
}

function showToast(message: string, action?: { label: string; run: () => void }, persistent = false): void {
  const region = document.querySelector<HTMLDivElement>('#toast-region');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  const text = document.createElement('span');
  text.textContent = message;
  toast.append(text);
  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => { action.run(); toast.remove(); });
    toast.append(button);
  }
  region.replaceChildren(toast);
  if (!persistent) window.setTimeout(() => toast.remove(), action ? 10_000 : 4_000);
}

function dateFromToday(offset: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function samplePdf(title: string, lines: string[]): Blob {
  const escapePdf = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  const stream = ['BT', '/F1 11 Tf', '72 770 Td', '(Maintenance Proof Book sample) Tj', '0 -30 Td', '/F1 18 Tf', `(${escapePdf(title)}) Tj`, '/F1 11 Tf', ...lines.flatMap((line) => ['0 -26 Td', `(${escapePdf(line)}) Tj`]), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Blob([pdf], { type: 'application/pdf' });
}

async function seedDemo(): Promise<void> {
  const alreadySeeded = await getSetting('demoSeeded', false);
  if (alreadySeeded) return;
  await clearBook();
  const photoResponse = await fetch('/assets/sample-roof-repair.webp');
  const roofPhoto = photoResponse.ok ? await photoResponse.blob() : new Blob(['Sample roof repair image unavailable.'], { type: 'image/webp' });
  const createdAt = new Date().toISOString();
  const sampleRecords: RepairRecord[] = [
    {
      id: 'sample-roof-vent', title: 'Repaired roof vent flashing', area: 'North roof', completedDate: dateFromToday(-48), contractor: 'Clearline Roofing', vendor: 'Town Builders Supply', part: 'Galvanized vent flashing, 4 inch', cost: 1280, notes: 'Replaced cracked flashing and the surrounding shingles. Contractor included a five-year workmanship warranty.', nextDue: dateFromToday(60), nextAction: 'Check the patch after the first heavy storm',
      attachments: [
        { id: 'sample-roof-photo', name: 'roof-vent-after-repair.webp', type: 'image/webp', size: roofPhoto.size, addedAt: createdAt, blob: roofPhoto },
        { id: 'sample-roof-receipt', name: 'clearline-roofing-receipt.pdf', type: 'application/pdf', size: 0, addedAt: createdAt, blob: samplePdf('Roof vent repair receipt', ['Labor and materials: $1,280.00', 'Paid in full']) }
      ], createdAt, updatedAt: createdAt
    },
    {
      id: 'sample-heat-pump', title: 'Serviced heat pump', area: 'Utility room', completedDate: dateFromToday(-132), contractor: 'North County Heating', vendor: 'North County Heating', part: 'Air filter, 20 × 25 × 1', cost: 189, notes: 'Cleaned the outdoor coil, checked refrigerant pressure, and replaced the return filter.', nextDue: dateFromToday(30), nextAction: 'Replace the filter and book the annual service',
      attachments: [{ id: 'sample-hvac-report', name: 'heat-pump-service-report.pdf', type: 'application/pdf', size: 0, addedAt: createdAt, blob: samplePdf('Heat pump service report', ['Coil cleaned', 'Filter replaced', 'Refrigerant pressure checked']) }], createdAt, updatedAt: createdAt
    },
    {
      id: 'sample-kitchen-tap', title: 'Replaced kitchen tap cartridge', area: 'Kitchen', completedDate: dateFromToday(-286), contractor: 'Harbor Plumbing', vendor: 'Central Plumbing Counter', part: 'Ceramic cartridge C-22', cost: 214.5, notes: 'Replaced the hot-side cartridge and tested the shutoff valves. No leak was visible after testing.', nextDue: dateFromToday(180), nextAction: 'Inspect the cabinet for drips',
      attachments: [{ id: 'sample-tap-receipt', name: 'harbor-plumbing-invoice.pdf', type: 'application/pdf', size: 0, addedAt: createdAt, blob: samplePdf('Kitchen tap repair invoice', ['Labor: $160.00', 'Cartridge: $54.50', 'Total: $214.50']) }], createdAt, updatedAt: createdAt
    }
  ];
  sampleRecords.forEach((record) => record.attachments.forEach((attachment) => { attachment.size = attachment.blob.size; }));
  await Promise.all(sampleRecords.map(saveRecord));
  await setSetting('property', { name: '24 Willow Lane', address: 'Sample property' });
  await setSetting('demoSeeded', true);
}

async function resetDemo(): Promise<void> {
  await clearBook();
  await seedDemo();
  [records, property] = await Promise.all([getAllRecords(), getSetting('property', defaultProperty)]);
  searchTerm = '';
  dueFilter = 'all';
  const search = document.querySelector<HTMLInputElement>('#search');
  const filter = document.querySelector<HTMLSelectElement>('#due-filter');
  if (search) search.value = '';
  if (filter) filter.value = 'all';
  renderTimeline();
  showToast('Demo reset to the original three sample repairs.');
}

function visibleRecords(): RepairRecord[] {
  const query = searchTerm.toLowerCase();
  return sortRecords(records).filter((record) => {
    const matchesSearch = !query || [record.title, record.area, record.contractor, record.vendor, record.part, record.notes, record.nextAction].join(' ').toLowerCase().includes(query);
    const state = dueState(record.nextDue);
    const matchesDue = dueFilter === 'all' || (dueFilter === 'needs-action' && ['overdue', 'soon'].includes(state)) || (dueFilter === 'scheduled' && state === 'later') || (dueFilter === 'none' && state === 'none');
    return matchesSearch && matchesDue;
  });
}

function recordCard(record: RepairRecord): string {
  const state = dueState(record.nextDue);
  const status = state === 'overdue' ? `Overdue · ${formatDate(record.nextDue)}` : state === 'soon' ? `Due soon · ${formatDate(record.nextDue)}` : record.nextDue ? `Due ${formatDate(record.nextDue)}` : 'No due date';
  return `<article class="repair-card" data-record-id="${escapeHtml(record.id)}">
    <div class="card-date"><span>${new Date(`${record.completedDate}T12:00:00`).getFullYear()}</span><strong>${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${record.completedDate}T12:00:00`))}</strong></div>
    <div class="card-body"><div class="card-top"><div><p class="record-ref">Record ${escapeHtml(record.id.slice(0, 8))} · ${escapeHtml(record.area || 'Area not set')}</p><h3>${escapeHtml(record.title)}</h3></div><span class="due-badge due-${state}">${icon('calendar')} ${escapeHtml(status)}</span></div>
    <dl class="record-facts"><div><dt>Contractor</dt><dd>${escapeHtml(record.contractor || 'Not recorded')}</dd></div><div><dt>Part / source</dt><dd>${escapeHtml(record.part || record.vendor || 'Not recorded')}</dd></div><div><dt>Next action</dt><dd>${escapeHtml(record.nextAction)}</dd></div></dl>
    <div class="card-foot"><span class="evidence-count">${icon('paperclip')} ${record.attachments.length} evidence file${record.attachments.length === 1 ? '' : 's'}</span><div><button class="button button-small button-quiet" type="button" data-action="edit-record" data-id="${escapeHtml(record.id)}">${icon('edit')} Edit</button><button class="button button-small button-paper" type="button" data-action="view-record" data-id="${escapeHtml(record.id)}">Open packet →</button></div></div></div>
  </article>`;
}

function renderTimeline(): void {
  const count = document.querySelector('#record-count');
  const evidence = document.querySelector('#evidence-count');
  const due = document.querySelector('#due-count');
  if (count) count.textContent = String(records.length);
  if (evidence) evidence.textContent = String(records.reduce((sum, record) => sum + record.attachments.length, 0));
  if (due) due.textContent = String(records.filter((record) => ['overdue', 'soon'].includes(dueState(record.nextDue))).length);
  const content = document.querySelector<HTMLDivElement>('#timeline-content');
  if (!content) return;
  if (storageFailed) {
    content.innerHTML = `<div class="state-sheet error-state"><span class="state-mark">!</span><h3>Private storage is unavailable</h3><p>Your browser blocked IndexedDB, so records cannot be saved safely. Try a normal (non-private) window or allow site storage, then reload.</p><button class="button button-paper" type="button" onclick="location.reload()">Reload the proof book</button></div>`;
    return;
  }
  const filtered = visibleRecords();
  if (records.length === 0) {
    content.innerHTML = `<div class="empty-state"><div><p class="kicker">Your first evidence packet</p><h3>Start with the last repair you paid for.</h3><p>Add the receipt or photo while it’s still easy to find, then record what should happen next.</p><button class="button button-primary" type="button" data-action="new-record">${icon('plus')} Record the first repair</button></div><div class="empty-diagram" aria-hidden="true"><span>Repair</span><i></i><span>Evidence</span><i></i><span>Next date</span></div></div>`;
  } else if (filtered.length === 0) {
    content.innerHTML = `<div class="state-sheet"><span class="state-mark">0</span><h3>No repairs match these filters</h3><p>Try a different phrase or show all dates.</p><button class="button button-paper" type="button" data-action="clear-filters">Clear filters</button></div>`;
  } else {
    content.innerHTML = `<div class="timeline-list">${filtered.map(recordCard).join('')}</div>`;
  }
  document.querySelector('#property-label')!.textContent = property.name;
  document.querySelector('#address-label')!.textContent = property.address || 'Address stays private until you add it';
  const unlockSection = document.querySelector<HTMLElement>('#unlock');
  if (unlockSection) unlockSection.innerHTML = unlockMarkup();
}

function clearPreviewUrls(): void { previewUrls.forEach((url) => URL.revokeObjectURL(url)); previewUrls.clear(); }

function renderStagedEvidence(): void {
  const list = document.querySelector<HTMLDivElement>('#staged-evidence');
  if (!list) return;
  list.innerHTML = stagedAttachments.length ? stagedAttachments.map((attachment) => `<div class="evidence-row"><span class="file-kind">${attachment.type.startsWith('image/') ? 'IMG' : 'PDF'}</span><span><strong>${escapeHtml(attachment.name)}</strong><small>${formatBytes(attachment.size)} · ${escapeHtml(attachment.type || 'Unknown type')}</small></span><button class="icon-button" type="button" data-action="remove-staged" data-id="${attachment.id}" aria-label="Remove ${escapeHtml(attachment.name)}">×</button></div>`).join('') : '<p class="no-evidence">No evidence attached yet. You can still save this record.</p>';
}

function formElement<T extends HTMLInputElement | HTMLTextAreaElement>(form: HTMLFormElement, name: string): T { return form.elements.namedItem(name) as T; }

function openRecordForm(record?: RepairRecord): void {
  if (!record && !unlocked && records.length >= FREE_RECORD_LIMIT) {
    document.querySelector('#unlock')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(`The free book holds ${FREE_RECORD_LIMIT} repairs. Unlock unlimited records to add another.`, undefined, true);
    return;
  }
  const form = document.querySelector<HTMLFormElement>('#record-form')!;
  form.reset();
  formElement(form, 'id').value = record?.id ?? '';
  formElement(form, 'title').value = record?.title ?? '';
  formElement(form, 'area').value = record?.area ?? '';
  formElement(form, 'completedDate').value = record?.completedDate ?? new Date().toISOString().slice(0, 10);
  formElement(form, 'contractor').value = record?.contractor ?? '';
  formElement(form, 'vendor').value = record?.vendor ?? '';
  formElement(form, 'part').value = record?.part ?? '';
  formElement(form, 'cost').value = record?.cost == null ? '' : String(record.cost);
  formElement(form, 'notes').value = record?.notes ?? '';
  formElement(form, 'nextAction').value = record?.nextAction ?? '';
  formElement(form, 'nextDue').value = record?.nextDue ?? '';
  stagedAttachments = [...(record?.attachments ?? [])];
  document.querySelector('#record-dialog-title')!.textContent = record ? 'Edit repair packet' : 'Record a repair';
  document.querySelector('#form-error')!.textContent = '';
  renderStagedEvidence();
  getDialog('record-dialog').showModal();
  window.setTimeout(() => formElement(form, 'title').focus(), 0);
}

function openView(record: RepairRecord): void {
  clearPreviewUrls();
  const evidence = record.attachments.map((attachment) => {
    const url = URL.createObjectURL(attachment.blob); previewUrls.add(url);
    return `<li class="packet-evidence">${attachment.type.startsWith('image/') ? `<img src="${url}" alt="Attachment: ${escapeHtml(attachment.name)}" width="160" height="120">` : '<span class="pdf-tile" aria-hidden="true">PDF</span>'}<div><strong>${escapeHtml(attachment.name)}</strong><span>${escapeHtml(attachment.type || 'Unknown type')} · ${formatBytes(attachment.size)}</span><span>Added ${new Date(attachment.addedAt).toLocaleString()}</span><a href="${url}" download="${escapeHtml(attachment.name)}">Download original</a></div></li>`;
  }).join('');
  const content = document.querySelector<HTMLDivElement>('#view-content')!;
  content.innerHTML = `<div class="dialog-head"><div><p class="kicker">Repair ${escapeHtml(record.id.slice(0, 8))}</p><h2 id="view-dialog-title">${escapeHtml(record.title)}</h2></div><button class="icon-button" type="button" data-action="close-view" aria-label="Close repair packet">×</button></div>
    <div class="packet-date">Completed ${formatDate(record.completedDate)} · ${escapeHtml(record.area || 'Area not recorded')}</div>
    <dl class="packet-facts"><div><dt>Contractor</dt><dd>${escapeHtml(record.contractor || 'Not recorded')}</dd></div><div><dt>Vendor</dt><dd>${escapeHtml(record.vendor || 'Not recorded')}</dd></div><div><dt>Part / model</dt><dd>${escapeHtml(record.part || 'Not recorded')}</dd></div><div><dt>Cost</dt><dd>${record.cost == null ? 'Not recorded' : new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(record.cost)}</dd></div><div><dt>Next action</dt><dd>${escapeHtml(record.nextAction)}</dd></div><div><dt>Next due</dt><dd>${formatDate(record.nextDue)}</dd></div></dl>
    ${record.notes ? `<div class="packet-notes"><h3>Work notes</h3><p>${escapeHtml(record.notes).replaceAll('\n', '<br>')}</p></div>` : ''}
    <section class="packet-section" aria-labelledby="packet-evidence-title"><div class="packet-section-head"><h3 id="packet-evidence-title">Evidence index</h3><span>${record.attachments.length} file${record.attachments.length === 1 ? '' : 's'}</span></div>${evidence ? `<ul class="packet-evidence-list">${evidence}</ul>` : '<p>No evidence attachments were added to this repair.</p>'}</section>
    <p class="provenance-note">File names, types, sizes and added dates are preserved as entered. This packet is a homeowner record, not a legal certification.</p>
    <div class="dialog-actions split-actions"><button class="button button-danger" type="button" data-action="delete-record" data-id="${escapeHtml(record.id)}">${icon('trash')} Delete repair</button><button class="button button-primary" type="button" data-action="edit-record" data-id="${escapeHtml(record.id)}">${icon('edit')} Edit packet</button></div>`;
  getDialog('view-dialog').showModal();
}

async function handleRecordSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const error = document.querySelector<HTMLDivElement>('#form-error')!;
  error.textContent = '';
  const title = formElement<HTMLInputElement>(form, 'title');
  const nextAction = formElement<HTMLInputElement>(form, 'nextAction');
  for (const field of [title, nextAction]) { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); }
  if (!form.checkValidity()) { form.reportValidity(); error.textContent = 'Complete the required repair name, date and next action.'; return; }
  const trimmedRequired = [
    [title, 'Enter a repair name that contains more than spaces.'],
    [nextAction, 'Enter a next action that contains more than spaces.']
  ] as const;
  const invalid = trimmedRequired.find(([field]) => !field.value.trim());
  if (invalid) {
    const [field, message] = invalid;
    field.setCustomValidity(message);
    field.setAttribute('aria-invalid', 'true');
    error.textContent = message;
    field.focus();
    field.reportValidity();
    return;
  }
  const id = formElement(form, 'id').value || crypto.randomUUID();
  const existing = records.find((record) => record.id === id);
  const now = new Date().toISOString();
  const costValue = formElement(form, 'cost').value;
  const record: RepairRecord = {
    id,
    title: formElement(form, 'title').value.trim(),
    area: formElement(form, 'area').value.trim(),
    completedDate: formElement(form, 'completedDate').value,
    contractor: formElement(form, 'contractor').value.trim(),
    vendor: formElement(form, 'vendor').value.trim(),
    part: formElement(form, 'part').value.trim(),
    cost: costValue ? Number(costValue) : null,
    notes: formElement(form, 'notes').value.trim(),
    nextDue: formElement(form, 'nextDue').value,
    nextAction: formElement(form, 'nextAction').value.trim(),
    attachments: stagedAttachments,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  try {
    await saveRecord(record);
    records = existing ? records.map((item) => item.id === id ? record : item) : [...records, record];
    getDialog('record-dialog').close();
    renderTimeline();
    showToast(existing ? 'Repair packet updated.' : 'Repair packet saved locally.');
  } catch (cause) { error.textContent = cause instanceof Error ? cause.message : 'This repair could not be saved. Check browser storage and try again.'; }
}

async function addAttachments(input: HTMLInputElement): Promise<void> {
  const error = document.querySelector<HTMLDivElement>('#form-error')!;
  const files = [...(input.files ?? [])];
  let added = 0;
  error.textContent = '';
  for (const file of files) {
    if (!(file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) { error.textContent = `${file.name} is not an image or PDF.`; continue; }
    if (file.size > MAX_FILE_BYTES) { error.textContent = `${file.name} is over the 10 MB per-file limit.`; continue; }
    const currentBytes = stagedAttachments.reduce((sum, item) => sum + item.size, 0);
    if (currentBytes + file.size > MAX_RECORD_BYTES) { error.textContent = 'This repair would exceed the 50 MB attachment limit.'; break; }
    stagedAttachments.push({ id: crypto.randomUUID(), name: file.name, type: file.type || 'application/pdf', size: file.size, addedAt: new Date().toISOString(), blob: file });
    added += 1;
  }
  if (added) error.textContent = '';
  input.value = '';
  renderStagedEvidence();
}

async function deleteRepair(id: string): Promise<void> {
  const record = records.find((item) => item.id === id);
  if (!record || !window.confirm(`Delete “${record.title}” and all ${record.attachments.length} attached file${record.attachments.length === 1 ? '' : 's'} from this device?`)) return;
  try {
    await removeRecord(id);
    records = records.filter((item) => item.id !== id);
    deletedRecord = record;
    window.clearTimeout(undoTimer);
    undoTimer = window.setTimeout(() => { deletedRecord = null; }, 10_000);
    getDialog('view-dialog').close();
    renderTimeline();
    showToast('Repair deleted.', { label: 'Undo', run: async () => {
      if (!deletedRecord) return;
      await saveRecord(deletedRecord);
      records = [...records, deletedRecord];
      deletedRecord = null;
      renderTimeline();
      showToast('Repair restored.');
    } });
  } catch { showToast('The repair could not be deleted. Try again.'); }
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportJson(): Promise<void> {
  try {
    showToast('Preparing your complete backup…');
    const backup = await createBackup(property, records);
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }), `maintenance-proof-book-${date}.json`);
    showToast('JSON backup downloaded. Keep it somewhere safe.');
  } catch { showToast('The backup could not be created. Check attachment access and try again.', undefined, true); }
}

async function exportPdf(): Promise<void> {
  try {
    showToast('Building the evidence PDF…');
    const { exportProofPdf } = await import('./pdf');
    await exportProofPdf(property, sortRecords(records));
    showToast('Evidence PDF downloaded.');
  } catch (cause) { console.error(cause); showToast('The PDF could not be built. Try again with this tab open.', undefined, true); }
}

async function importJson(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0]; input.value = '';
  if (!file) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    showToast('This file is not valid JSON. Choose a Maintenance Proof Book JSON backup and try again.', undefined, true);
    return;
  }
  if (!window.confirm('Restore this backup? It will replace every repair currently stored on this device. Download a backup first if you need the current records.')) return;
  try {
    const restored = await restoreBackup(parsed);
    property = restored.property; records = restored.records;
    renderTimeline(); getDialog('data-dialog').close();
    showToast(`Restored ${records.length} repair record${records.length === 1 ? '' : 's'}.`);
  } catch (cause) { showToast(cause instanceof Error ? cause.message : 'That backup could not be restored.', undefined, true); }
}

async function showStorage(): Promise<void> {
  const meter = document.querySelector<HTMLParagraphElement>('#storage-meter');
  if (!meter) return;
  if (!navigator.storage?.estimate) { meter.textContent = 'Your browser does not report its local storage allowance.'; return; }
  const estimate = await navigator.storage.estimate();
  meter.textContent = `${formatBytes(estimate.usage ?? 0)} used by this site · ${formatBytes(estimate.quota ?? 0)} browser allowance. Storage can still be cleared by the browser; keep backups.`;
}

function readVerdict(): LicenseVerdict | null {
  try { return JSON.parse(localStorage.getItem(verdictKey) ?? 'null') as LicenseVerdict | null; } catch { return null; }
}

async function verifyLicense(token: string, force = false): Promise<boolean> {
  const cached = readVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < 86_400_000) { unlocked = cached.valid; return cached.valid; }
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable.');
    const result = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(verdictKey, JSON.stringify(verdict));
    unlocked = result.valid;
    renderTimeline();
    if (!result.valid) showToast('This license is no longer active. Existing records and exports are still available.', undefined, true);
    return result.valid;
  } catch {
    if (cached) unlocked = cached.valid;
    return unlocked;
  }
}

async function initializeLicense(): Promise<void> {
  const url = new URL(location.href);
  const incoming = url.searchParams.get('license');
  if (incoming) {
    localStorage.setItem(licenseKey, incoming);
    localStorage.setItem(verdictKey, JSON.stringify({ valid: true, checkedAt: 0 }));
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    unlocked = true;
    showToast('License received. Unlimited records are ready while we verify it.');
  } else {
    unlocked = readVerdict()?.valid ?? false;
  }
  const token = localStorage.getItem(licenseKey);
  if (token) void verifyLicense(token);
}

async function restoreLicense(form: HTMLFormElement): Promise<void> {
  const token = formElement<HTMLInputElement>(form, 'license').value.trim();
  const error = document.querySelector<HTMLDivElement>('#license-error')!;
  error.textContent = '';
  if (!token) { error.textContent = 'Paste the license token from your receipt.'; return; }
  localStorage.setItem(licenseKey, token);
  localStorage.removeItem(verdictKey);
  unlocked = false;
  const valid = await verifyLicense(token, true);
  if (valid) { getDialog('license-dialog').close(); showToast('License restored. Unlimited records are ready.'); }
  else error.textContent = navigator.onLine ? 'That license could not be verified. Check the token and try again.' : 'You are offline. Reconnect once to restore a license on this device.';
}

function bindEvents(): void {
  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (action === 'new-record') openRecordForm();
    if (action === 'edit-record' && id) { getDialog('view-dialog').close(); openRecordForm(records.find((record) => record.id === id)); }
    if (action === 'view-record' && id) { const record = records.find((item) => item.id === id); if (record) openView(record); }
    if (action === 'delete-record' && id) void deleteRepair(id);
    if (action === 'remove-staged' && id) { stagedAttachments = stagedAttachments.filter((attachment) => attachment.id !== id); renderStagedEvidence(); }
    if (action === 'close-record') getDialog('record-dialog').close();
    if (action === 'close-view') getDialog('view-dialog').close();
    if (action === 'edit-property') {
      const form = document.querySelector<HTMLFormElement>('#property-form')!;
      formElement(form, 'name').value = property.name; formElement(form, 'address').value = property.address; getDialog('property-dialog').showModal();
    }
    if (action === 'close-property') getDialog('property-dialog').close();
    if (action === 'open-data') { getDialog('data-dialog').showModal(); void showStorage(); }
    if (action === 'close-data') getDialog('data-dialog').close();
    if (action === 'export-json') void exportJson();
    if (action === 'export-pdf') void exportPdf();
    if (action === 'restore-license') getDialog('license-dialog').showModal();
    if (action === 'close-license') getDialog('license-dialog').close();
    if (action === 'scroll-timeline') document.querySelector('#timeline')?.scrollIntoView({ behavior: 'smooth' });
    if (action === 'clear-filters') { searchTerm = ''; dueFilter = 'all'; (document.querySelector('#search') as HTMLInputElement).value = ''; (document.querySelector('#due-filter') as HTMLSelectElement).value = 'all'; renderTimeline(); }
    if (action === 'reset-demo' && demoMode) void resetDemo();
    if (action === 'start-real' && demoMode) { event.preventDefault(); void clearBook().then(() => { location.href = '/'; }); }
  });
  document.querySelector('#record-form')?.addEventListener('submit', (event) => void handleRecordSubmit(event as SubmitEvent));
  ['title', 'nextAction'].forEach((name) => formElement<HTMLInputElement>(document.querySelector<HTMLFormElement>('#record-form')!, name).addEventListener('input', (event) => {
    const field = event.currentTarget as HTMLInputElement;
    if (field.value.trim()) { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); }
  }));
  document.querySelector<HTMLInputElement>('#attachment-input')?.addEventListener('change', (event) => void addAttachments(event.currentTarget as HTMLInputElement));
  document.querySelector('#property-form')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
    const name = formElement<HTMLInputElement>(form, 'name');
    const error = document.querySelector<HTMLParagraphElement>('#property-error')!;
    name.setCustomValidity(''); name.removeAttribute('aria-invalid'); error.textContent = '';
    if (!name.value.trim()) {
      const message = 'Enter a property name that contains more than spaces.';
      name.setCustomValidity(message); name.setAttribute('aria-invalid', 'true'); error.textContent = message; name.focus(); name.reportValidity(); return;
    }
    const nextProperty = { name: name.value.trim(), address: formElement(form, 'address').value.trim() };
    try {
      await setSetting('property', nextProperty);
      property = nextProperty; getDialog('property-dialog').close(); renderTimeline(); showToast('Property details saved locally.');
    } catch {
      error.textContent = 'The property could not be saved. Check browser storage and try again.';
    }
  });
  formElement<HTMLInputElement>(document.querySelector<HTMLFormElement>('#property-form')!, 'name').addEventListener('input', (event) => {
    const field = event.currentTarget as HTMLInputElement;
    if (field.value.trim()) { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); document.querySelector('#property-error')!.textContent = ''; }
  });
  document.querySelector('#license-form')?.addEventListener('submit', (event) => { event.preventDefault(); void restoreLicense(event.currentTarget as HTMLFormElement); });
  document.querySelector<HTMLInputElement>('#import-input')?.addEventListener('change', (event) => void importJson(event.currentTarget as HTMLInputElement));
  document.querySelector<HTMLInputElement>('#search')?.addEventListener('input', (event) => { searchTerm = (event.currentTarget as HTMLInputElement).value; renderTimeline(); });
  document.querySelector<HTMLSelectElement>('#due-filter')?.addEventListener('change', (event) => { dueFilter = (event.currentTarget as HTMLSelectElement).value; renderTimeline(); });
  ['record-dialog', 'view-dialog', 'property-dialog', 'data-dialog', 'license-dialog'].forEach((id) => getDialog(id).addEventListener('click', (event) => {
    if (event.target === event.currentTarget) getDialog(id).close();
  }));
  window.addEventListener('online', updateNetworkStatus); window.addEventListener('offline', updateNetworkStatus);
}

function updateNetworkStatus(): void {
  document.body.classList.toggle('offline', !navigator.onLine);
  const badge = document.querySelector('#network-status');
  if (badge) badge.innerHTML = `<span class="status-dot"></span><span>${navigator.onLine ? 'Saved locally' : 'Offline · still working'}</span>`;
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const hadController = Boolean(navigator.serviceWorker.controller);
    const registration = await navigator.serviceWorker.register('/sw.js');
    const offerUpdate = (worker: ServiceWorker) => showToast('A fresh version is ready.', { label: 'Update now', run: () => worker.postMessage({ type: 'SKIP_WAITING' }) }, true);
    if (registration.waiting) offerUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker); });
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloading) { reloading = true; location.reload(); } });
  } catch { showToast('Offline installation is unavailable, but local records still work.', undefined, true); }
}

function renderNotFound(): void {
  setRouteMetadata('Page not found — Maintenance Proof Book', 'This Maintenance Proof Book page does not exist. Return to the home repair record.', location.pathname);
  app.innerHTML = `${headerMarkup()}<main id="main-content" class="not-found-shell"><p class="kicker kicker-light">404 · Page not found</p><h1>This repair page does not exist</h1><p>Check the address or return to your repair records.</p><a class="button button-primary" href="/">Return to the proof book</a></main>${footerMarkup()}`;
}

async function init(): Promise<void> {
  const route = normalizedRoute === '/' ? '' : normalizedRoute;
  if (route === '/privacy' || route === '/terms') { renderLegal(route.slice(1) as 'privacy' | 'terms'); void registerServiceWorker(); return; }
  if (route && route !== '/demo') { renderNotFound(); void registerServiceWorker(); return; }
  setRouteMetadata(demoMode ? 'Demo — Maintenance Proof Book' : 'Maintenance Proof Book — Record home repairs', demoMode ? 'Try three sample home repairs in a separate demo book. Reset it anytime without changing your own repair records.' : 'Keep home repairs, contractors, parts, receipts, photos, and next service dates together on your device.', demoMode ? '/demo' : '/');
  app.innerHTML = appMarkup();
  bindEvents();
  updateNetworkStatus();
  try {
    if (demoMode) await seedDemo();
    [records, property] = await Promise.all([getAllRecords(), getSetting('property', defaultProperty)]);
  } catch (cause) { console.error(cause); storageFailed = true; }
  if (!demoMode) await initializeLicense();
  renderTimeline();
  const url = new URL(location.href);
  if (url.searchParams.get('action') === 'new') { url.searchParams.delete('action'); history.replaceState({}, '', `${url.pathname}${url.search}`); openRecordForm(); }
  void registerServiceWorker();
}

void init();
