// Captures public/poster.jpg (1600x900) from the real built page with Playwright.
// Usage: pnpm build && pnpm poster
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const PORT = Number(process.env.PORT ?? 4611);
let server = null;
try {
  server = await startServer(PORT);
} catch {
  /* a server is already listening on the port */
}
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${PORT}/?still`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// Halfway through the assembly: pieces are visibly coming together while the headline stays in view.
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const stage = document.querySelector('[data-assembly]');
  stage?.style.setProperty('--k', '0.62');
  const pieces = document.querySelector('[data-pieces]');
  if (pieces) pieces.textContent = '3 de 9';
});
// Wait for a live purchase toast (seeded simulation), up to 20 s.
await page.waitForSelector('.toast', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(700);
await page.screenshot({ path: 'public/poster.jpg', type: 'jpeg', quality: 86 });
await browser.close();
server?.close();
console.log('public/poster.jpg written (1600x900)');
