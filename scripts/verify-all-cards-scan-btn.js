/**
 * Browser verification script for OCR Scan Card button across ALL public cards
 * Uses playwright to open each page, click 'Scan Card', verify modal visibility, and close it.
 */

const { chromium } = require('playwright');

const PAGES = [
  { name: 'Pedro Felipe', url: 'http://localhost:8089/pedro.html' },
  { name: 'Eduardo López', url: 'http://localhost:8089/eduardo.html' },
  { name: 'Marleni Méndez', url: 'http://localhost:8089/marleni.html' },
  { name: 'Dallas Logistics Hub', url: 'http://localhost:8089/logistics.html' },
  { name: 'Government Bids Desk', url: 'http://localhost:8089/bids.html' },
  { name: 'Main Index Card', url: 'http://localhost:8089/index.html' },
  { name: 'Staff Badge (PWA)', url: 'http://localhost:8089/badge.html' },
  { name: 'Setup Studio Hub', url: 'http://localhost:8089/setup.html' },
];

async function run() {
  console.log('===============================================================');
  console.log('   VERIFYING OCR SCAN BUTTON INTERACTION ON ALL PUBLIC CARDS   ');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  let totalTested = 0;
  let passed = 0;
  let failed = 0;

  for (const p of PAGES) {
    totalTested++;
    console.log(`[*] Testing [${p.name}] at ${p.url}...`);
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport

    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 10000 });

      // Locate Scan Card button
      const scanBtn = page.locator('button:has-text("Scan Card")').first();
      await scanBtn.waitFor({ state: 'visible', timeout: 5000 });
      console.log(`    [✓] Scan Card button is visible on page.`);

      // Click Scan Card button
      await scanBtn.click();

      // Verify Scanner Modal appeared
      const modal = page.locator('#p22CardScannerModal');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      console.log(`    [✓] Scanner modal (#p22CardScannerModal) opened successfully.`);

      // Verify modal text
      const modalText = await page.locator('#p22CardScannerModal h3').textContent();
      console.log(`    [✓] Modal header confirmed: "${modalText.trim()}"`);

      // Close modal
      const closeBtn = page.locator('#p22CardScannerModal button:has-text("✕"), #p22CardScannerModal button:has(svg)').first();
      await closeBtn.click();
      await modal.waitFor({ state: 'hidden', timeout: 3000 });
      console.log(`    [✓] Modal closed successfully.\n`);

      passed++;
    } catch (err) {
      console.error(`    [FAIL] Error on ${p.name}: ${err.message}\n`);
      failed++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log('===============================================================');
  console.log(`RESULT: ${passed} / ${totalTested} Cards Verified (${failed} Failures)`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
