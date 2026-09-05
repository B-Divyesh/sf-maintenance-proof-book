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
  await expect(page.getByRole('heading', { level: 1, name: 'Keep proof of every home repair' })).toBeVisible();
  await expect(page.getByText('Offline · still working')).toBeAttached();
});

test('privacy and terms routes have semantic pages', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy for your repair records' })).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByRole('heading', { level: 1, name: 'Terms for using this proof book' })).toBeVisible();
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
    const title = heading.getBoundingClientRect();
    return { heroRight: hero.right, titleRight: title.right, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
  });
  expect(heroBounds.titleRight).toBeLessThanOrEqual(heroBounds.heroRight);
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

test('sample demo is populated, resettable, and isolated from the real book', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Record a repair' }).first().click();
  await page.getByLabel('What was repaired? *').fill('Real boiler repair');
  await page.getByLabel('Next action').fill('Check pressure next month');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page).toHaveTitle('Demo — Maintenance Proof Book');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Repaired roof vent flashing' })).toBeVisible();
  await expect(page.locator('.repair-card')).toHaveCount(3);

  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('What was repaired? *').fill('Changed only in demo');
  await page.getByRole('button', { name: 'Save repair packet' }).click();
  await expect(page.getByRole('heading', { name: 'Changed only in demo' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'Repaired roof vent flashing' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Changed only in demo' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Real boiler repair' })).toBeVisible();
});

test('property and malformed backup errors explain how to recover without changing records', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Edit property' }).click();
  await page.getByLabel('Property name').fill('   ');
  await page.getByRole('button', { name: 'Save property' }).click();
  await expect(page.locator('#property-error')).toHaveText('Enter a property name that contains more than spaces.');
  await expect(page.getByLabel('Property name')).toBeFocused();
  await page.getByLabel('Property name').fill('Sample house');
  await page.getByRole('button', { name: 'Save property' }).click();
  await expect(page.locator('#property-label')).toHaveText('Sample house');

  await page.getByRole('button', { name: 'Data & backup' }).click();
  await page.getByLabel('Restore JSON backup').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByText('This file is not valid JSON. Choose a Maintenance Proof Book JSON backup and try again.')).toBeVisible();
  await expect(page.locator('.repair-card')).toHaveCount(3);
});

test('landing page follows the required information order and metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Keep proof of every home repair');
  await expect(page.getByText(/For homeowners who need each repair/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Build one record for each repair' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What this proof book does not do' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Add unlimited repair records' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://maintenance-proof-book.sociobot.in/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.jpg$/);
});

test('designed not-found document has a clear recovery path', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Maintenance Proof Book');
  await expect(page.getByRole('heading', { level: 1, name: 'This repair page does not exist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the proof book' })).toHaveAttribute('href', '/');
});

test('public routes have route titles, canonical URLs, no serious axe issues, and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const routes = [
    { path: '/', title: 'Maintenance Proof Book — Record home repairs', canonical: 'https://maintenance-proof-book.sociobot.in/' },
    { path: '/demo', title: 'Demo — Maintenance Proof Book', canonical: 'https://maintenance-proof-book.sociobot.in/demo' },
    { path: '/privacy', title: 'Privacy — Maintenance Proof Book', canonical: 'https://maintenance-proof-book.sociobot.in/privacy' },
    { path: '/terms', title: 'Terms — Maintenance Proof Book', canonical: 'https://maintenance-proof-book.sociobot.in/terms' },
    { path: '/404.html', title: 'Page not found — Maintenance Proof Book', canonical: 'https://maintenance-proof-book.sociobot.in/404' }
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', route.canonical);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('keyboard focus, dialog escape, sticky demo label, and reduced motion remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByRole('button', { name: 'Record a repair' }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('What was repaired? *')).toBeFocused();
  const duration = await page.locator('#record-dialog').evaluate((dialog) => getComputedStyle(dialog).animationDuration);
  expect(Number.parseFloat(duration)).toBeLessThan(0.1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#record-dialog')).not.toBeVisible();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.demo-banner')).toHaveCSS('position', 'sticky');
});
