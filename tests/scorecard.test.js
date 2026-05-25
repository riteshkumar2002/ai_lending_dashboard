// Playwright verification: scorecard rings, weights summing to 100, and navigation
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, '..');
const PORT = 7432;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(DIR, decodeURIComponent(req.url.split("?")[0]));
      if (filePath === path.join(DIR, "/")) filePath = path.join(DIR, "public", "Underwriting Workbench.html");
      const ext = path.extname(filePath);
      const mime = { ".html": "text/html", ".jsx": "application/javascript", ".js": "application/javascript", ".css": "text/css" }[ext] || "text/plain";
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found: " + filePath); return; }
        res.writeHead(200, { "Content-Type": mime });
        res.end(data);
      });
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

// Expected 1:1 mapping of category tile text → parameter tab label
const EXPECTED_NAV = [
  { tileText: "Bureau & Credit History",       expectedTab: "Bureau" },
  { tileText: "Income & Repayment Capacity",   expectedTab: "Income" },
  { tileText: "Property & Collateral Quality", expectedTab: "Property" },
  { tileText: "Applicant Stability & Profile", expectedTab: "Employment" },
  { tileText: "Banking & Cashflow",            expectedTab: "Collateral" },
  { tileText: "KYC & Fraud Prevention",        expectedTab: "Identity" },
];

async function goToScorecard(page) {
  await page.goto(`http://127.0.0.1:${PORT}/`);
  await page.waitForSelector('[aria-label="LAP Credit"]', { timeout: 15000 });
  await page.click('[aria-label="LAP Credit"]');
  await page.waitForSelector(".row", { timeout: 8000 });
  await page.click(".row");
  await page.waitForSelector(".sc-panel", { timeout: 10000 });
}

async function backToSummary(page) {
  // Click the Summary nav item to return to scorecard view
  const navItems = await page.$$(".apdet-nav-item");
  for (const item of navItems) {
    const txt = await item.textContent();
    if (txt.trim() === "Summary") { await item.click(); break; }
  }
  await page.waitForSelector(".sc-overview-grid", { timeout: 5000 });
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let passed = 0, failed = 0;

  function log(ok, msg) {
    console.log(`  ${ok ? "✓" : "✗"} ${msg}`);
    ok ? passed++ : failed++;
  }

  try {
    await goToScorecard(page);

    // ── Test 1: 6 rings rendered ──────────────────────────────────
    console.log("\n[1] Ring count");
    const ringGroups = await page.$$(".sc-rings-col svg > g");
    log(ringGroups.length === 6, `Expected 6 rings, found ${ringGroups.length}`);

    // ── Test 2: legend has 6 items ────────────────────────────────
    console.log("\n[2] Legend items");
    const legendItems = await page.$$(".sc-legend-item");
    log(legendItems.length === 6, `Expected 6 legend items, found ${legendItems.length}`);

    // ── Test 3: composite overview tiles sum maxPts to 100 ────────
    console.log("\n[3] MaxPts sum = 100");
    const tilePtsTexts = await page.$$eval(".sc-overview-cell .sc-overview-pts", els =>
      els.map(el => el.textContent)
    );
    const total = tilePtsTexts.reduce((sum, txt) => {
      const m = txt.match(/\/(\d+)/);
      return sum + (m ? parseInt(m[1], 10) : 0);
    }, 0);
    log(total === 100, `MaxPts sum = ${total} (expected 100)`);

    // ── Test 4: 6 overview tiles visible ─────────────────────────
    console.log("\n[4] Overview tile count = 6");
    const tiles = await page.$$(".sc-overview-cell");
    log(tiles.length === 6, `Expected 6 tiles, found ${tiles.length}`);

    // ── Test 5: each tile navigates to correct parameter tab ──────
    console.log("\n[5] Tile → tab navigation");
    for (const { tileText, expectedTab } of EXPECTED_NAV) {
      // Return to scorecard overview between each test
      await backToSummary(page);

      const tileHandles = await page.$$(".sc-overview-cell");
      let matchedTile = null;
      for (const t of tileHandles) {
        const labelEl = await t.$(".sc-overview-label");
        const txt = labelEl ? await labelEl.textContent() : "";
        if (txt.trim() === tileText) { matchedTile = t; break; }
      }

      if (!matchedTile) { log(false, `Tile "${tileText}" not found`); continue; }

      await matchedTile.click();
      await page.waitForTimeout(400);

      const activeTab = await page.$eval(".apdet-nav-active", el => el.textContent.trim()).catch(() => "(none)");
      log(activeTab === expectedTab, `"${tileText}" → "${activeTab}" (expected "${expectedTab}")`);
    }

    // ── Test 6: legend click → param row click → navigates ───────
    console.log("\n[6] Legend click → param row → navigation");
    await backToSummary(page);

    const firstLegend = await page.$(".sc-legend-item");
    if (firstLegend) {
      await firstLegend.click();
      await page.waitForSelector(".sc-cat-item-nav", { timeout: 3000 });
      const itemRow = await page.$(".sc-cat-item-nav");
      if (itemRow) {
        await itemRow.click();
        await page.waitForTimeout(400);
        const activeTab = await page.$eval(".apdet-nav-active", el => el.textContent.trim()).catch(() => "(none)");
        log(activeTab === "Bureau", `Legend[0] param row → "${activeTab}" (expected "Bureau")`);
      } else {
        log(false, "No .sc-cat-item-nav rows after legend click");
      }
    } else {
      log(false, "No legend items found");
    }

    // ── Test 7: AI summary card renders ──────────────────────────
    console.log("\n[7] AI Summary Card — renders with key data");
    await backToSummary(page);
    const aiCard = await page.$('[data-testid="ai-assistant"]');
    log(!!aiCard, "AI summary card rendered");

    // Check verdict label and score are visible
    const verdictText = await page.$eval(".ais-verdict-label", el => el.textContent).catch(() => "");
    log(verdictText.length > 0, `Verdict shown: "${verdictText}"`);
    const scoreNum = await page.$eval(".ais-score-num", el => el.textContent).catch(() => "");
    log(scoreNum.trim() === "75", `Score displayed: "${scoreNum.trim()}" (expected "75")`);

    // Check 3 metric chips
    const metrics = await page.$$(".ais-metric");
    log(metrics.length === 3, `Expected 3 metric chips, found ${metrics.length}`);

    // Check findings section
    const findings = await page.$$(".ais-finding-row");
    log(findings.length > 0, `Key findings rendered (${findings.length} rows)`);

    // ── Test 8: clicking card opens the drawer ────────────────────
    console.log("\n[8] AI Analyst Drawer — opens on card click");
    await aiCard.click();
    await page.waitForSelector(".aid-drawer-open", { timeout: 3000 });
    const drawerOpen = await page.$(".aid-drawer-open");
    log(!!drawerOpen, "Drawer opened after card click");

    // Welcome message loads inside drawer
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 5000 });
    const welcomeText = await page.$eval('[data-testid="ai-response"]', el => el.textContent).catch(() => "");
    log(welcomeText.length > 50, `Welcome message loaded (${welcomeText.length} chars)`);

    // ── Test 9: suggested chips in drawer ────────────────────────
    console.log("\n[9] AI Drawer — suggested chips");
    const chips = await page.$$('[data-testid="ai-chip"]');
    log(chips.length === 6, `Expected 6 suggestion chips, found ${chips.length}`);

    // ── Test 10: chip click triggers response ────────────────────
    console.log("\n[10] AI Drawer — chip click triggers response");
    if (chips[0]) {
      await chips[0].click();
      await page.waitForSelector('[data-testid="ai-user-msg"]', { timeout: 3000 });
      const userMsg = await page.$eval('[data-testid="ai-user-msg"]', el => el.textContent).catch(() => "");
      log(userMsg.trim().length > 0, `User message: "${userMsg.trim()}"`);
      await page.waitForTimeout(2000);
      const allResponses = await page.$$('[data-testid="ai-response"]');
      log(allResponses.length >= 2, `AI responded (${allResponses.length} assistant msgs)`);
    } else {
      log(false, "No chips found");
    }

    // ── Test 11: manual input works ──────────────────────────────
    console.log("\n[11] AI Drawer — manual question");
    const inputEl = await page.$('[data-testid="ai-input"]');
    if (inputEl) {
      await inputEl.fill("What documents are missing?");
      const sendBtn = await page.$('[data-testid="ai-send"]');
      log(await sendBtn.getAttribute("disabled") === null, "Send enabled with input");
      await sendBtn.click();
      await page.waitForTimeout(2200);
      const allRes = await page.$$('[data-testid="ai-response"]');
      log(allRes.length >= 3, `Response received (${allRes.length} total)`);
    } else {
      log(false, "Input field not found");
    }

    // ── Test 12: Escape closes drawer ────────────────────────────
    console.log("\n[12] AI Drawer — Escape key closes it");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const stillOpen = await page.$(".aid-drawer-open");
    log(!stillOpen, "Drawer closed on Escape");

  } catch (err) {
    console.error("\nFatal:", err.message);
    failed++;
  } finally {
    await browser.close();
    server.close();
    console.log(`\n─────────────────────────────`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
})();
