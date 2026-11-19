// Dev helper: screenshots of given paths at given widths, printing console messages.
// usage: node scripts/shot.mjs <outDir> <width> <path> [path...]   (env FULL=1 for full page, WAIT=ms, SCROLL=px, RM=1 reduced motion)
import { chromium } from 'playwright';
const [outDir, width, ...paths] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: Number(width), height: Number(width) < 600 ? 844 : 900 },
  reducedMotion: process.env.RM ? 'reduce' : 'no-preference',
  deviceScaleFactor: 1,
});
for (const p of paths) {
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}] ${p}: ${m.text()}`); });
  page.on('pageerror', (e) => console.log(`[pageerror] ${p}: ${e.message}`));
  await page.goto(`http://localhost:4611${p}`, { waitUntil: 'networkidle' });
  if (process.env.SCROLL) { await page.evaluate((y) => window.scrollTo(0, y), Number(process.env.SCROLL)); }
  await page.waitForTimeout(Number(process.env.WAIT ?? 600));
  const name = p.replace(/[^a-z0-9]+/gi, '_') || 'home';
  await page.screenshot({ path: `${outDir}/${name}_${width}.png`, fullPage: !!process.env.FULL });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) console.log(`[overflow] ${p} @${width}: ${overflow}px`);
  await page.close();
}
await browser.close();
