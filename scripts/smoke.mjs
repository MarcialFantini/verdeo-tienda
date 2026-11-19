// Smoke test against the production build: every view at desktop and 390px, reduced motion,
// showcase, and a full purchase flow. Fails on any console error or warning, page error or
// horizontal overflow. Usage: pnpm build && pnpm test:smoke
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = Number(process.env.PORT ?? 4611);
const BASE = `http://localhost:${PORT}`;
const VIEWS = ['/', '/catalogo', '/catalogo?ambiente=living&orden=precio-asc', '/producto/silla-tafi', '/producto/cama-raco', '/comparar', '/showroom', '/carrito', '/checkout', '/pedido', '/favoritos', '/cuenta', '/no-existe'];

let server = null;
try {
  server = await startServer(PORT);
} catch {
  /* reuse a server already listening */
}

const problems = [];
const browser = await chromium.launch();

async function visit(ctx, path, label) {
  const page = await ctx.newPage();
  const log = (kind, text) => {
    if (path === '/no-existe' && /404/.test(text)) return;
    problems.push(`${label} ${path} [${kind}] ${text}`);
  };
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') log(m.type(), m.text());
  });
  page.on('pageerror', (e) => log('pageerror', e.message));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) problems.push(`${label} ${path} [overflow] ${overflow}px`);
  await page.close();
}

const configs = [
  { label: 'desktop', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' },
  { label: 'mobile', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference', isMobile: true, hasTouch: true },
  { label: 'reduced', viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' },
];

for (const cfg of configs) {
  const ctx = await browser.newContext(cfg);
  for (const path of VIEWS) await visit(ctx, path, cfg.label);
  await ctx.close();
}

// Purchase flow with client-side navigation.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`flow [${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`flow [pageerror] ${e.message}`));
  await page.goto(`${BASE}/producto/silla-tafi`, { waitUntil: 'networkidle' });
  await page.locator('[data-configurator] input[data-kind="wood"]').nth(1).check({ force: true });
  await page.locator('[data-add]').click();
  await page.locator('[data-wish]').first().click();
  await page.keyboard.press('Control+k');
  await page.keyboard.type('carrito');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/carrito');
  await page.waitForTimeout(600);
  const lines = await page.locator('.cart-line:not(.is-skeleton)').count();
  if (lines < 1) problems.push('flow: cart is empty after adding');
  await page.locator('[data-checkout]').click();
  await page.waitForURL('**/checkout');
  for (let i = 0; i < 4; i++) {
    await page.locator('[data-next]').click();
    await page.waitForTimeout(250);
  }
  await page.waitForURL('**/pedido**', { timeout: 10000 });
  await page.waitForTimeout(800);
  const title = await page.locator('[data-order-title]').textContent();
  if (!title?.startsWith('Pedido RL-')) problems.push(`flow: order page title is "${title}"`);
  await page.locator('[data-advance-week]').click();
  await page.waitForTimeout(400);
  await page.keyboard.press('?');
  const helpOpen = await page.locator('[data-help]').evaluate((d) => d.open);
  if (!helpOpen) problems.push('flow: help dialog did not open with ?');
  await page.keyboard.press('Escape');
  const saved = await page.evaluate(() => localStorage.getItem('rioLujan.demo.v2'));
  if (!saved?.includes('RL-')) problems.push('flow: order not persisted');
  // showcase must not touch the saved session
  await page.goto(`${BASE}/?showcase`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  const after = await page.evaluate(() => localStorage.getItem('rioLujan.demo.v2'));
  const before = JSON.parse(saved ?? '{}');
  const now = JSON.parse(after ?? '{}');
  if (JSON.stringify(before.orders) !== JSON.stringify(now.orders) || JSON.stringify(before.cart) !== JSON.stringify(now.cart)) {
    problems.push('showcase: saved session changed');
  }
  await ctx.close();
}

await browser.close();
server?.close();

if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  for (const p of problems) console.log(` - ${p}`);
  process.exit(1);
}
console.log(`OK: ${VIEWS.length} views x ${configs.length} configs, purchase flow, showcase isolation. Zero console errors or warnings.`);
