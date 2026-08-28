import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('empty book is accessible and can save a complete repair packet', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Maintenance Proof Book/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByText('Start with the last repair')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.getByRole('button', { name: 'Record a repair' }).first().click();
  await page.getByLabel('What was repaired? *').fill('Replaced kitchen tap');
  await page.getByLabel('Area of the home').fill('Kitchen');
  await page.getByLabel('Contractor').fill('Northside Plumbing');
  await page.getByLabel('Part / model').fill('Ceramic cartridge C-22');
  await page.getByLabel('Next action').fill('Inspect for drips');
  await page.locator('input[name="nextDue"]').fill('2026-10-15');
  await page.getByLabel('Add photos or receipts').setInputFiles('tests/fixtures/receipt.pdf');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByRole('heading', { name: 'Replaced kitchen tap' })).toBeVisible();
  await expect(page.getByText('1 evidence file')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Replaced kitchen tap' })).toBeVisible();
  await page.getByRole('button', { name: 'Data & backup' }).click();
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence PDF' }).click();
  await expect.poll(async () => (await pdfDownload).suggestedFilename()).toMatch(/maintenance-proof-book\.pdf$/);
});

test('installed shell remains available offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    const shell = keys.find((key) => key.includes('-shell'));
    if (!shell) return false;
    return (await caches.open(shell).then((cache) => cache.keys())).some((request) => request.url.includes('/assets/index-') && request.url.endsWith('.js'));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Every repair/ })).toBeVisible();
  await expect(page.getByText('Offline · still working')).toBeAttached();
});

test('privacy and terms routes have semantic pages', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Your records stay yours.' })).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByRole('heading', { level: 1, name: 'Plain-language terms.' })).toBeVisible();
});

test('visible links meet the 44px touch-target contract on desktop and 390px mobile', async ({ page }) => {
  await page.goto('/');
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => page.locator('a:visible').evaluateAll((links) => links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { label: (link.textContent || link.getAttribute('aria-label') || '').trim(), width: rect.width, height: rect.height };
    }).filter((link) => link.width < 44 || link.height < 44))).toEqual([]);
  }
});

test('390px hero wraps its primary message and keeps all readable copy at 16px or larger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const heroBounds = await page.locator('.hero h1').evaluate((heading) => {
    const hero = heading.closest('.hero')!.getBoundingClientRect();
    const emphasis = heading.querySelector('em')!.getBoundingClientRect();
    return { heroRight: hero.right, emphasisRight: emphasis.right, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
  });
  expect(heroBounds.emphasisRight).toBeLessThanOrEqual(heroBounds.heroRight);
  expect(heroBounds.scrollWidth).toBeLessThanOrEqual(heroBounds.clientWidth);

  const undersized = await page.locator('body *:visible').evaluateAll((elements) => elements.flatMap((element) => {
    const hasDirectText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    return hasDirectText && Number.parseFloat(getComputedStyle(element).fontSize) < 16
      ? [{ tag: element.tagName, text: (element.textContent || '').trim(), size: getComputedStyle(element).fontSize }]
      : [];
  }));
  expect(undersized).toEqual([]);
});

test('whitespace-only repair fields are rejected and a successful attachment clears an old rejection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Record a repair' }).first().click();
  await page.getByLabel('What was repaired? *').fill('   ');
  await page.getByLabel('Next action').fill('   ');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a repair name that contains more than spaces.');
  await expect(page.getByLabel('What was repaired? *')).toBeFocused();
  await expect(page.locator('#record-dialog')).toBeVisible();

  await page.getByLabel('Add photos or receipts').setInputFiles({ name: 'not-evidence.txt', mimeType: 'text/plain', buffer: Buffer.from('not a receipt') });
  await expect(page.getByRole('alert')).toHaveText('not-evidence.txt is not an image or PDF.');
  await page.getByLabel('Add photos or receipts').setInputFiles('tests/fixtures/receipt.pdf');
  await expect(page.getByText('receipt.pdf', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('');

  await page.getByLabel('What was repaired? *').fill('Replace weather seal');
  await page.getByLabel('Next action').fill('Inspect before winter');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByRole('heading', { name: 'Replace weather seal' })).toBeVisible();
});
