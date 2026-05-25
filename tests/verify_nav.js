const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const ASSETS = path.join(BASE, 'assets', 'screenshots');

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/public/Underwriting Workbench.html';
  const filePath = path.join(BASE, rel);
  const ext = path.extname(filePath);
  const mime = {
    '.html': 'text/html',
    '.jsx': 'application/javascript',
    '.js': 'application/javascript',
    '.css': 'text/css'
  }[ext] || 'text/plain';
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end('Not found: ' + filePath);
  }
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(3456, async () => {
  console.log('Server on :3456, BASE =', BASE);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('http://localhost:3456/public/Underwriting%20Workbench.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ASSETS, 'snap_home.png'), fullPage: false });
  console.log('Saved snap_home.png');

  // Try to find and click an applicant card
  const text = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Body text:', text);

  // Click Arjun Mehta if visible
  try {
    await page.getByText('Arjun Mehta').first().click({ timeout: 5000 });
    await page.waitForTimeout(2000);
  } catch(e) {
    console.log('Could not click Arjun Mehta:', e.message);
    // Try clicking first applicant card
    const cards = await page.$$('.appl-card, .applicant-card, [class*="card"]');
    console.log('Found cards:', cards.length);
    if (cards[0]) { await cards[0].click(); await page.waitForTimeout(2000); }
  }

  await page.screenshot({ path: path.join(ASSETS, 'snap_detail.png'), fullPage: false });
  console.log('Saved snap_detail.png (applicant detail view)');

  // Open AI panel
  try {
    await page.click('.ask-ai-fab', { timeout: 5000 });
    await page.waitForTimeout(1500);
  } catch(e) {
    console.log('Could not click ask-ai-fab:', e.message);
  }

  await page.screenshot({ path: path.join(ASSETS, 'snap_ai_open.png'), fullPage: false });
  console.log('Saved snap_ai_open.png (AI panel open)');

  // Measure navigator
  const info = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div[style]'));
    const nav = divs.find(d => {
      const s = d.getAttribute('style') || '';
      return s.includes('translateY(-50%)') && (s.includes('8999') || s.includes('460'));
    });
    if (!nav) return { error: 'nav not found', sample: divs.slice(0,3).map(d => d.getAttribute('style')) };
    const r = nav.getBoundingClientRect();
    return { right: Math.round(r.right), left: Math.round(r.left), width: Math.round(r.width), style: nav.getAttribute('style') };
  });
  console.log('Navigator info:', JSON.stringify(info, null, 2));
  console.log('Expected right edge of container:', Math.round(1400 * 0.66667), 'px when AI open');

  await browser.close();
  server.close();
});
