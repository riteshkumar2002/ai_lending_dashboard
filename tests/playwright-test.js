const { chromium } = require('playwright');
const http = require('http');
const fs   = require('fs');
const path = require('path');

/* ── Tiny static server ─────────────────────────── */
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets', 'screenshots');
const MIME = {
  '.html': 'text/html', '.jsx': 'application/javascript',
  '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/public/Underwriting Workbench.html';
  const filePath = path.join(ROOT, decodeURIComponent(urlPath));
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'text/plain';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  console.log(`Server → ${base}`);

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 30000 });

    /* Wait for React + Babel to compile and mount the app */
    await page.waitForSelector('button.row', { timeout: 20000 });
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(ASSETS, '01-list-view.png') });
    console.log('✓ 01-list-view.png  (list rendered)');

    /* ── Open first applicant ── */
    await page.locator('button.row').first().click({ force: true });
    await page.waitForSelector('.sc-rings-col', { timeout: 10000 });
    await page.waitForTimeout(800);

    await page.screenshot({ path: path.join(ASSETS, '02-detail-initial.png') });
    console.log('✓ 02-detail-initial.png  (scorecard view)');

    /* ── Record rings position BEFORE any drill-down ── */
    const ringsBefore = await page.locator('.sc-rings-col').boundingBox();
    console.log('\nRings BEFORE drill-down :', ringsBefore);

    /* ── Click the outermost ring (first category) ── */
    const svgBox = await page.locator('.sc-rings-col svg').boundingBox();
    if (svgBox) {
      const cx = svgBox.x + svgBox.width  / 2;
      const cy = svgBox.y + svgBox.height / 2;
      const r  = (svgBox.width / 2) * 0.88;   // outermost ring radius
      await page.mouse.click(cx + r, cy);
    }
    await page.waitForTimeout(900);

    await page.screenshot({ path: path.join(ASSETS, '03-subcategory-level.png') });
    console.log('✓ 03-subcategory-level.png');

    const ringsAfterCat = await page.locator('.sc-rings-col').boundingBox();
    console.log('Rings AFTER category click :', ringsAfterCat);

    /* ── Drill into subcategory — click first row in breakdown ── */
    const breakdownRow = page.locator('.sc-level-row').first();
    if (await breakdownRow.count() > 0) {
      await breakdownRow.click();
      await page.waitForTimeout(900);
    }

    await page.screenshot({ path: path.join(ASSETS, '04-parameter-level.png') });
    console.log('✓ 04-parameter-level.png');

    const ringsAfterParam = await page.locator('.sc-rings-col').boundingBox();
    console.log('Rings AFTER parameter drill:', ringsAfterParam);

    /* ── Check Documents Summary Bar is visible ── */
    const docBar = await page.locator('.doc-summary-bar').boundingBox();
    console.log('\nDocuments Summary Bar     :', docBar ? '✅ visible' : '❌ not found');

    /* ── Stability verdict ── */
    const dx1 = Math.abs((ringsBefore?.x ?? 0) - (ringsAfterCat?.x ?? 0));
    const dy1 = Math.abs((ringsBefore?.y ?? 0) - (ringsAfterCat?.y ?? 0));
    const dx2 = Math.abs((ringsBefore?.x ?? 0) - (ringsAfterParam?.x ?? 0));
    const dy2 = Math.abs((ringsBefore?.y ?? 0) - (ringsAfterParam?.y ?? 0));

    console.log('\n── Stability Report ──────────────────────────');
    console.log(`  Before      : x=${ringsBefore?.x?.toFixed(1)}, y=${ringsBefore?.y?.toFixed(1)}`);
    console.log(`  After cat   : x=${ringsAfterCat?.x?.toFixed(1)}, y=${ringsAfterCat?.y?.toFixed(1)}  (Δ ${dx1.toFixed(1)}px x, ${dy1.toFixed(1)}px y)`);
    console.log(`  After param : x=${ringsAfterParam?.x?.toFixed(1)}, y=${ringsAfterParam?.y?.toFixed(1)}  (Δ ${dx2.toFixed(1)}px x, ${dy2.toFixed(1)}px y)`);

    const stable = dx1 < 2 && dy1 < 2 && dx2 < 2 && dy2 < 2;
    console.log(stable
      ? '\n  ✅ STABLE — rings did not shift during drill-down'
      : '\n  ❌ UNSTABLE — rings shifted during drill-down');

    await page.waitForTimeout(3000);
  } catch (err) {
    await page.screenshot({ path: path.join(ASSETS, 'error.png') }).catch(() => {});
    console.error('Error:', err.message);
  } finally {
    await browser.close();
    server.close();
  }
});
