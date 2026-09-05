import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = 'https://maintenance-proof-book.sociobot.in';
const browser = await chromium.launch({ headless: true });

function check(value, message) {
  if (!value) throw new Error(message);
}

async function checkRoute(path, title, heading) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  check(response?.status() === 200, `${path} returned ${response?.status()}.`);
  check(await page.title() === title, `${path} has the wrong title.`);
  check(await page.getByRole('heading', { level: 1, name: heading }).count() === 1, `${path} has the wrong h1.`);
  const axe = await new AxeBuilder({ page }).analyze();
  check(axe.violations.every((violation) => !['serious', 'critical'].includes(violation.impact ?? '')), `${path} has serious axe findings.`);
  check(errors.length === 0, `${path} logged errors: ${errors.join('; ')}`);
  await context.close();
}

try {
  await checkRoute('/', 'Maintenance Proof Book — Record home repairs', 'Keep proof of every home repair');
  await checkRoute('/privacy', 'Privacy — Maintenance Proof Book', 'Privacy for your repair records');
  await checkRoute('/terms', 'Terms — Maintenance Proof Book', 'Terms for using this proof book');

  for (const profile of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'phone', viewport: { width: 390, height: 844 } }
  ]) {
    const context = await browser.newContext({ viewport: profile.viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    const origins = new Set();
    page.on('request', (request) => origins.add(new URL(request.url()).origin));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(origin, { waitUntil: 'networkidle' });
    check(await page.getByText(/For homeowners who need each repair/).isVisible(), `${profile.name} audience is not visible.`);
    check(await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(), `${profile.name} first action is not visible.`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${profile.name} page overflows horizontally.`);
    await page.screenshot({ path: `/work/.evidence/live-${profile.name}.png`, fullPage: true });
    await page.getByRole('link', { name: 'Try it with sample data' }).click();
    await page.waitForURL('**/demo');
    await page.locator('.repair-card').first().waitFor();
    check(await page.locator('.repair-card').count() === 3, `${profile.name} demo does not contain three repairs.`);
    check(await page.getByText('Demo — sample data, nothing is saved').isVisible(), `${profile.name} demo label is missing.`);
    await page.getByRole('button', { name: 'Open packet →' }).first().click();
    check(await page.getByRole('img', { name: 'Attachment: roof-vent-after-repair.webp' }).isVisible(), `${profile.name} sample photo is missing.`);
    check(await page.getByText('Clearline Roofing').first().isVisible(), `${profile.name} contractor data is missing.`);
    await page.getByRole('button', { name: 'Close repair packet' }).click();
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await page.getByText('Demo reset to the original three sample repairs.').waitFor();
    check(await page.locator('.repair-card').count() === 3, `${profile.name} demo reset failed.`);
    check([...origins].every((requestOrigin) => requestOrigin === origin), `${profile.name} ordinary flow contacted another origin.`);
    check(errors.length === 0, `${profile.name} logged errors: ${errors.join('; ')}`);
    await page.screenshot({ path: `/work/.evidence/live-demo-${profile.name}.png`, fullPage: true });
    await context.close();
  }

  const offlineContext = await browser.newContext();
  const offlinePage = await offlineContext.newPage();
  await offlinePage.goto(`${origin}/demo`);
  await offlinePage.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await offlineContext.setOffline(true);
  await offlinePage.reload();
  check(await offlinePage.getByText('Offline · still working').count() === 1, 'Live offline reload failed.');
  check(await offlinePage.locator('.repair-card').count() === 3, 'Live demo data was unavailable offline.');
  await offlineContext.close();

  const missingContext = await browser.newContext();
  const missingPage = await missingContext.newPage();
  const missingResponse = await missingPage.goto(`${origin}/not-a-real-route`);
  check(missingResponse?.status() === 404, `Missing route returned ${missingResponse?.status()} instead of 404.`);
  check(await missingPage.title() === 'Page not found — Maintenance Proof Book', 'Missing route did not render the designed 404 page.');
  check(await missingPage.getByRole('link', { name: 'Return to the proof book' }).isVisible(), '404 recovery link is missing.');
  await missingContext.close();

  console.log(JSON.stringify({ origin, routes: 4, viewports: ['1440x1000', '390x844'], demoRecords: 3, offline: true, notFoundStatus: 404, axeSeriousCritical: 0 }));
} finally {
  await browser.close();
}
