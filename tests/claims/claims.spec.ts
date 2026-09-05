import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function openDemo(page: Page): Promise<void> {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.repair-card')).toHaveCount(3);
}

async function addRepair(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'Record a repair' }).first().click();
  await page.getByLabel('What was repaired? *').fill(title);
  await page.getByLabel('Next action').fill('Inspect this repair next month');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

async function chooseGeneratedFile(page: Page, name: string, size: number): Promise<void> {
  await page.locator('#attachment-input').evaluate((element, file) => {
    const transfer = new DataTransfer();
    const candidate = new File(['boundary fixture'], file.name, { type: 'application/pdf' });
    Object.defineProperty(candidate, 'size', { value: file.size });
    transfer.items.add(candidate);
    Object.defineProperty(element, 'files', { configurable: true, value: transfer.files });
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, { name, size });
}

test('@claim:demo-isolation keeps sample changes out of the real repair book', async ({ page }) => {
  await page.goto('/');
  await addRepair(page, 'Real water-heater service');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page.locator('.repair-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('What was repaired? *').fill('Temporary demo change');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'Repaired roof vent flashing' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Temporary demo change' })).toHaveCount(0);
  await Promise.all([page.waitForURL((url) => url.pathname === '/'), page.getByRole('link', { name: 'Start for real' }).click()]);
  await expect(page.getByRole('heading', { name: 'Real water-heater service' })).toBeVisible();
  const demoRecordCount = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('demo:maintenance-proof-book');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const count = db.transaction('records').objectStore('records').count();
      count.onerror = () => reject(count.error);
      count.onsuccess = () => { resolve(count.result); db.close(); };
    };
  }));
  expect(demoRecordCount).toBe(0);
});

test('@claim:offline-reload works offline for reload, editing, and PDF export', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await openDemo(page);
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await page.waitForFunction(async () => (await caches.keys()).some((key) => key.endsWith('-shell')));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · still working')).toBeAttached();
  await addRepair(page, 'Recorded while offline');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Next action').fill('Inspect the offline edit next month');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByText('Inspect the offline edit next month')).toBeVisible();
  await page.getByRole('button', { name: 'Data & backup' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence PDF' }).click();
  expect((await download).suggestedFilename()).toMatch(/maintenance-proof-book\.pdf$/);
  await context.close();
});

test('@claim:pwa-install exposes an installable manifest and active service worker', async ({ page }) => {
  await openDemo(page);
  const manifest = await page.evaluate(async () => fetch('/manifest.webmanifest').then((response) => response.json()));
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toMatch(/^\//);
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192' }),
    expect.objectContaining({ sizes: '512x512' }),
    expect.objectContaining({ purpose: 'maskable' })
  ]));
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker?.controller))).toBe(true);
});

test('@claim:local-indexeddb persists demo repairs in its isolated IndexedDB database', async ({ page }) => {
  await openDemo(page);
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databases).toContain('demo:maintenance-proof-book');
  expect(databases).not.toContain('maintenance-proof-book');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Next action').fill('Persist this sample change');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByText('Persist this sample change')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Persist this sample change')).toBeVisible();
});

test('@claim:no-account creates a repair in a fresh browser without sign-in', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  await addRepair(page, 'Replaced garage weather seal');
  await expect(page.locator('.repair-card')).toHaveCount(4);
});

test('@claim:no-tracking keeps the complete ordinary demo flow on the product origin', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await openDemo(page);
  await page.getByRole('button', { name: 'Open packet →' }).first().click();
  await expect(page.getByRole('heading', { name: 'Evidence index' })).toBeVisible();
  await page.getByRole('button', { name: 'Close repair packet' }).click();
  await addRepair(page, 'Inspected attic insulation');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:no-remote-assets loads scripts, styles, and fonts without a CDN', async ({ page }) => {
  const resourceOrigins = new Set<string>();
  page.on('request', (request) => {
    if (['script', 'stylesheet', 'font'].includes(request.resourceType())) resourceOrigins.add(new URL(request.url()).origin);
  });
  await openDemo(page);
  expect([...resourceOrigins]).toEqual(['http://127.0.0.1:4173']);
  expect(await page.evaluate(() => document.fonts.size)).toBe(0);
});

test('@claim:attachment-limits accepts exact limits and rejects files over them', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Record a repair' }).first().click();
  for (let index = 1; index <= 5; index += 1) {
    await chooseGeneratedFile(page, `exact-${index}.pdf`, 10 * 1024 * 1024);
    await expect(page.getByText(`exact-${index}.pdf`, { exact: true })).toBeVisible();
  }
  await chooseGeneratedFile(page, 'over-total.pdf', 1);
  await expect(page.getByRole('alert')).toHaveText('This repair would exceed the 50 MB attachment limit.');
  await page.getByRole('button', { name: /Remove exact-5\.pdf/ }).click();
  await chooseGeneratedFile(page, 'over-file.pdf', 10 * 1024 * 1024 + 1);
  await expect(page.getByRole('alert')).toHaveText('over-file.pdf is over the 10 MB per-file limit.');
});

test('@claim:record-tools searches, filters, edits, deletes, and restores a repair', async ({ page }) => {
  await openDemo(page);
  await page.getByLabel('Search repairs').fill('roof vent');
  await expect(page.locator('.repair-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Next action').fill('Photograph the flashing after rain');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByText('Photograph the flashing after rain')).toBeVisible();
  await page.getByLabel('Search repairs').fill('');
  await page.getByLabel('Filter by next due date').selectOption('needs-action');
  await expect(page.getByRole('heading', { name: 'Serviced heat pump' })).toBeVisible();
  await page.getByLabel('Filter by next due date').selectOption('all');
  await page.getByLabel('Search repairs').fill('roof vent');
  await page.getByRole('button', { name: 'Open packet →' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete repair' }).click();
  await expect(page.locator('.repair-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('heading', { name: 'Repaired roof vent flashing' })).toBeVisible();
  await page.getByRole('button', { name: 'Open packet →' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete repair' }).click();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo' })).toHaveCount(0, { timeout: 12_000 });
});

test('@claim:pdf-export downloads a PDF after showing image evidence and its index', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Open packet →' }).first().click();
  await expect(page.getByRole('heading', { name: 'Evidence index' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Attachment: roof-vent-after-repair.webp' })).toBeVisible();
  await page.getByRole('button', { name: 'Close repair packet' }).click();
  await page.getByRole('button', { name: 'Data & backup' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence PDF' }).click();
  const download = await pending;
  const bytes = await readFile(await download.path() as string);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.byteLength).toBeGreaterThan(20_000);
  expect(bytes.toString('latin1')).toContain('EVIDENCE INDEX');
  expect(bytes.toString('latin1')).toContain('/Subtype /Image');
});

test('@claim:json-backup restores records and the original attachment bytes', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Data & backup' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON backup' }).click();
  const backupPath = await (await pending).path() as string;
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.records).toHaveLength(3);
  const roofAttachment = backup.records.find((record: { id: string }) => record.id === 'sample-roof-vent').attachments[0];
  expect(roofAttachment.data).toMatch(/^data:image\/webp;base64,/);
  await page.getByRole('button', { name: 'Close data and backup' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('What was repaired? *').fill('Temporary changed title');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await page.getByRole('button', { name: 'Data & backup' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Restore JSON backup').setInputFiles(backupPath);
  await expect(page.getByRole('heading', { name: 'Repaired roof vent flashing' })).toBeVisible();
  await page.getByRole('button', { name: 'Open packet →' }).first().click();
  const originalPending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download original' }).first().click();
  const restoredBytes = await readFile(await (await originalPending).path() as string);
  expect(restoredBytes.equals(Buffer.from(roofAttachment.data.split(',')[1], 'base64'))).toBe(true);
});

test('@claim:free-five keeps five repairs and both exports free', async ({ page }) => {
  await openDemo(page);
  await addRepair(page, 'Cleaned dryer vent');
  await addRepair(page, 'Sealed bathroom grout');
  await expect(page.locator('.repair-card')).toHaveCount(5);
  await page.getByRole('button', { name: 'Record a repair' }).first().click();
  await expect(page.getByText('The free book holds 5 repairs. Unlock unlimited records to add another.')).toBeVisible();
  await expect(page.locator('#record-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Data & backup' }).click();
  const jsonPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON backup' }).click();
  expect((await jsonPending).suggestedFilename()).toMatch(/\.json$/);
  const pdfPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence PDF' }).click();
  expect((await pdfPending).suggestedFilename()).toMatch(/\.pdf$/);
});

test('@claim:paid-unlimited accepts a valid $24 license and allows a sixth repair', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByText('$24', { exact: true })).toBeVisible();
  await Promise.all([page.waitForURL((url) => url.pathname === '/'), page.getByRole('link', { name: 'Start for real' }).click()]);
  await page.route('https://api.sociobot.in/api/v1/products/maintenance-proof-book/verify?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok","expires_at":null}' }));
  await page.goto('/?license=claim-valid-license');
  await expect(page.getByRole('heading', { name: 'Unlimited records are ready' })).toBeVisible();
  for (let index = 1; index <= 6; index += 1) await addRepair(page, `Licensed repair ${index}`);
  await expect(page.locator('.repair-card')).toHaveCount(6);
});

test('@claim:license-restore restores on a fresh device and keeps records readable after invalidation', async ({ page }) => {
  let valid = true;
  await page.route('https://api.sociobot.in/api/v1/products/maintenance-proof-book/verify?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid, reason: valid ? 'ok' : 'revoked', expires_at: null }) }));
  await openDemo(page);
  await Promise.all([page.waitForURL((url) => url.pathname === '/'), page.getByRole('link', { name: 'Start for real' }).click()]);
  await addRepair(page, 'Readable licensed repair');
  await page.getByRole('button', { name: 'Have a license? Restore it' }).click();
  await page.getByLabel('License token').fill('restored-license-token');
  await page.getByRole('button', { name: 'Verify and restore' }).click();
  await expect(page.getByRole('heading', { name: 'Unlimited records are ready' })).toBeVisible();
  valid = false;
  await page.evaluate(() => localStorage.setItem('sb_license:maintenance-proof-book:verdict', JSON.stringify({ valid: true, checkedAt: 0 })));
  await page.reload();
  await expect(page.getByText('This license is no longer active. Existing records and exports are still available.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Readable licensed repair' })).toBeVisible();
  await page.getByRole('button', { name: 'Data & backup' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON backup' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.json$/);
});

test('@claim:billing-privacy sends only a license token to billing and never shows card fields', async ({ page }) => {
  const requests: Array<{ url: string; method: string; body: string | null }> = [];
  page.on('request', (request) => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  await openDemo(page);
  expect(requests.every((request) => new URL(request.url).origin === 'http://127.0.0.1:4173')).toBe(true);
  await expect(page.locator('#buy-link')).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/maintenance-proof-book/checkout');
  await expect(page.locator('input[name*="card" i], input[autocomplete="cc-number"]')).toHaveCount(0);
  await Promise.all([page.waitForURL((url) => url.pathname === '/'), page.getByRole('link', { name: 'Start for real' }).click()]);
  await page.route('https://api.sociobot.in/api/v1/products/maintenance-proof-book/verify?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":false,"reason":"invalid","expires_at":null}' }));
  await page.getByRole('button', { name: 'Have a license? Restore it' }).click();
  await page.getByLabel('License token').fill('privacy-check-token');
  await page.getByRole('button', { name: 'Verify and restore' }).click();
  await expect(page.locator('#license-error')).toContainText('could not be verified');
  const crossOrigin = requests.filter((request) => new URL(request.url).origin !== 'http://127.0.0.1:4173');
  expect(crossOrigin).toHaveLength(1);
  expect(crossOrigin[0].url).toContain('/verify?license=privacy-check-token');
  expect(crossOrigin[0].method).toBe('GET');
  expect(crossOrigin[0].body).toBeNull();
});
