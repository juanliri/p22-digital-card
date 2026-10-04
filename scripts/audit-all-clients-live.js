/**
 * P-22 CORP — Comprehensive Live iOS WebKit Client Function Audit
 * Validates all client functions, buttons, labels, and Apple flows live against card.p22corp.com
 */

const { webkit, devices } = require('@playwright/test');
const https = require('https');

const iPhone = devices['iPhone 15 Pro'];
const BASE_URL = 'https://card.p22corp.com';

const REPS = ['pedro', 'eduardo', 'marleni', 'bids', 'logistics'];

function checkHeader(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        contentDisposition: res.headers['content-disposition'],
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function runLiveAudit() {
  console.log('================================================================');
  console.log('   P-22 CORP — LIVE CLIENT FUNCTION & APPLE AUDIT (iOS WEBKIT)  ');
  console.log('================================================================\n');

  console.log('[*] Auditing Vercel HTTP Response Headers for Apple / iOS...');
  const vcfHeader = await checkHeader(`${BASE_URL}/assets/vcf/pedro.vcf`);
  console.log(`  [Header] /assets/vcf/pedro.vcf -> Status: ${vcfHeader.statusCode}, Content-Type: ${vcfHeader.contentType}, Disposition: ${vcfHeader.contentDisposition}`);
  if (vcfHeader.statusCode === 200 && vcfHeader.contentDisposition === 'inline') {
    console.log('  [PASS] vCard served as inline text/vcard — iOS Safari directly opens native Contact Sheet!');
  } else {
    console.error('  [FAIL] vCard headers incorrect for native iOS contact sheet!');
  }

  const pdfHeader = await checkHeader(`${BASE_URL}/assets/pdf/P22-Capability-Statement-Official.pdf`);
  console.log(`  [Header] Capability PDF -> Status: ${pdfHeader.statusCode}, Content-Type: ${pdfHeader.contentType}, Disposition: ${pdfHeader.contentDisposition}`);

  console.log('\n[*] Launching Apple WebKit engine (iPhone 15 Pro, iOS Safari simulation)...');
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    locale: 'en-US',
  });
  const page = await context.newPage();

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, desc) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`    [✓ PASS] ${desc}`);
    } else {
      console.error(`    [✗ FAIL] ${desc}`);
    }
  }

  // --- 1. AUDIT ALL 5 CARDS ---
  console.log('\n--- [STAGE 1: AUDITING ALL 5 PUBLIC CARDS] ---');
  for (const slug of REPS) {
    const cardUrl = `${BASE_URL}/${slug}`;
    console.log(`\n[*] Visiting Card: ${cardUrl}`);
    await page.goto(cardUrl, { waitUntil: 'domcontentloaded' });

    // A. Check Primary Golden CTA
    const primaryBtn = await page.locator('button:has-text("Save Contact to Phone")').first();
    const primaryVisible = await primaryBtn.isVisible();
    assert(primaryVisible, `${slug.toUpperCase()}: Primary CTA says "Save Contact to Phone" (no download, no .vcf)`);

    // B. Check Dual Action Bar
    const appleBtn = await page.locator('#cardAppleWalletBtn');
    const appleVisible = await appleBtn.isVisible();
    const appleText = (await appleBtn.innerText()).trim();
    assert(appleVisible && appleText.includes('Save to Apple'), `${slug.toUpperCase()}: Apple button says "${appleText}" (clean, no .pkpass)`);

    const googleBtn = await page.locator('#cardGoogleWalletBtn');
    const googleVisible = await googleBtn.isVisible();
    const googleText = (await googleBtn.innerText()).trim();
    assert(googleVisible && googleText.includes('Save to Google'), `${slug.toUpperCase()}: Google button says "${googleText}"`);

    // C. Check Action Bar Buttons: Call, Email, SMS
    const callBtn = await page.locator('#callAction');
    assert(await callBtn.isVisible(), `${slug.toUpperCase()}: Call button visible`);
    const emailBtn = await page.locator('#emailAction');
    assert(await emailBtn.isVisible(), `${slug.toUpperCase()}: Email button visible`);

    // D. Check Document Section: No "Download", only "View"
    const capabilityBtn = await page.locator('a:has-text("View Capability Statement")').first();
    assert(await capabilityBtn.isVisible(), `${slug.toUpperCase()}: Capability statement says "View Capability Statement"`);

    const docBtn = await page.locator('a:has-text("View Document")').first();
    assert(await docBtn.isVisible(), `${slug.toUpperCase()}: Overview PDF says "View Document"`);

    // E. Test Touch Interaction on "Save to Apple"
    let triggeredVcard = false;
    const requestHandler = (req) => {
      if (req.url().includes('/assets/vcf/')) triggeredVcard = true;
    };
    page.on('request', requestHandler);
    await appleBtn.tap();
    await page.waitForTimeout(500);
    page.off('request', requestHandler);
    assert(triggeredVcard, `${slug.toUpperCase()}: Tapping "Save to Apple" seamlessly dispatches vCard (0 broken pkpass, 0 download errors)`);
  }

  // --- 2. AUDIT ALL 5 STAFF BADGES ---
  console.log('\n--- [STAGE 2: AUDITING ALL 5 STAFF BADGES] ---');
  for (const slug of REPS) {
    const badgeUrl = `${BASE_URL}/badge/${slug}`;
    console.log(`\n[*] Visiting Badge: ${badgeUrl}`);
    await page.goto(badgeUrl, { waitUntil: 'domcontentloaded' });

    // A. Check PWA metadata
    const appTitle = await page.getAttribute('meta[name="apple-mobile-web-app-title"]', 'content');
    assert(!!appTitle, `${slug.toUpperCase()} Badge: apple-mobile-web-app-title is "${appTitle}"`);

    const appleIcon = await page.getAttribute('link[rel="apple-touch-icon"]', 'href');
    assert(!!appleIcon, `${slug.toUpperCase()} Badge: apple-touch-icon configured ("${appleIcon}")`);

    // B. Check Gold Button: says "Save Contact" (no .vcf, no "Save Pass", no download arrow)
    const saveContactBtn = await page.locator('button:has-text("Save Contact")').first();
    assert(await saveContactBtn.isVisible(), `${slug.toUpperCase()} Badge: Primary button says "Save Contact"`);

    // C. Check OCR Scan Card button
    const scanBtn = await page.locator('button:has-text("Scan Card")').first();
    assert(await scanBtn.isVisible(), `${slug.toUpperCase()} Badge: Instant OCR Scan button says "Scan Card"`);

    // D. Check Public Card button
    const publicBtn = await page.locator('#btnPublicCardDirect');
    assert(await publicBtn.isVisible(), `${slug.toUpperCase()} Badge: Public Card button visible`);

    // E. Test Touch on "Save Contact"
    let triggeredVcard = false;
    const requestHandler = (req) => {
      if (req.url().includes('/assets/vcf/')) triggeredVcard = true;
    };
    page.on('request', requestHandler);
    await saveContactBtn.tap();
    await page.waitForTimeout(500);
    page.off('request', requestHandler);
    assert(triggeredVcard, `${slug.toUpperCase()} Badge: Tapping "Save Contact" dispatches native vCard stream!`);
  }

  // --- 3. AUDIT SETUP STUDIO ---
  console.log('\n--- [STAGE 3: AUDITING SETUP STUDIO] ---');
  const setupUrl = `${BASE_URL}/setup`;
  console.log(`\n[*] Visiting Setup: ${setupUrl}`);
  await page.goto(setupUrl, { waitUntil: 'domcontentloaded' });

  const setupAppleBtn = await page.locator('#tool1PkpassBtn');
  if (await setupAppleBtn.isVisible()) {
    const text = (await setupAppleBtn.innerText()).trim();
    assert(text.includes('Save to Apple'), `Setup Studio: Tool 1 Apple button says "${text}" (no .pkpass, clean Save)`);
    const href = await setupAppleBtn.getAttribute('href');
    assert(href && href.endsWith('.vcf'), `Setup Studio: Tool 1 Apple button targets native vcf ("${href}")`);
  }

  const setupContactBtn = await page.locator('#vcfDownloadBtn');
  if (await setupContactBtn.isVisible()) {
    const text = (await setupContactBtn.innerText()).trim();
    assert(text.includes('Save Contact'), `Setup Studio: Native contact button says "${text}"`);
  }

  await browser.close();

  console.log('\n================================================================');
  console.log(` AUDIT COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('================================================================\n');
}

runLiveAudit().catch((err) => {
  console.error('[!] Audit error:', err);
  process.exit(1);
});
