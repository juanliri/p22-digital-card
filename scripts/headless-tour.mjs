import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8089;

function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.vcf': 'text/vcard',
    '.pkpass': 'application/vnd.apple.pkpass'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    else if (reqPath === '/eduardo') reqPath = '/eduardo.html';
    else if (reqPath === '/pedro') reqPath = '/pedro.html';
    else if (reqPath === '/marleni') reqPath = '/marleni.html';
    else if (reqPath === '/bids') reqPath = '/bids.html';
    else if (reqPath === '/logistics') reqPath = '/logistics.html';
    else if (reqPath === '/badge/eduardo') reqPath = '/badge-eduardo.html';
    else if (reqPath === '/badge/pedro') reqPath = '/badge-pedro.html';
    else if (reqPath === '/badge/marleni') reqPath = '/badge-marleni.html';
    else if (reqPath === '/badge/bids') reqPath = '/badge-bids.html';
    else if (reqPath === '/badge/logistics') reqPath = '/badge-logistics.html';

    if (reqPath.startsWith('/_vercel/')) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end('// vercel mock');
      return;
    }
    if (reqPath.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, status: 'mocked' }));
      return;
    }

    const filePath = path.join(process.cwd(), reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise(resolve => {
    server.listen(PORT, () => resolve(server));
  });
}

async function runTour() {
  const server = await createServer();
  console.log(`Local static server live on http://127.0.0.1:${PORT}`);

  console.log('Launching system Chrome headless...');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error]: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error]: ${err.message}`);
  });

  const profiles = [
    {
      slug: 'pedro',
      badgeFile: 'badge-pedro.html',
      cardFile: 'pedro.html',
      name: 'Pedro Felipe',
      email: 'pfelipe@p22corp.com',
      phone: '1-945-218-5896',
      phoneLink: 'tel:19452185896',
      callAction: 'tel:19452185896',
      passId: '1f6f9366-194d-43e8-af5a-ee77d2fadb5a'
    },
    {
      slug: 'eduardo',
      badgeFile: 'badge-eduardo.html',
      cardFile: 'eduardo.html',
      name: 'Eduardo Lopez',
      email: 'elopez@p22corp.com',
      phone: '1-407-369-9001',
      phoneLink: 'tel:14073699001',
      callAction: 'tel:14073699001',
      passId: '1c98dceb-ac84-4197-8a1d-af9c6e61badf'
    },
    {
      slug: 'marleni',
      badgeFile: 'badge-marleni.html',
      cardFile: 'marleni.html',
      name: 'Marleni Mendez',
      email: 'mmendez@p22corp.com',
      phone: '1-888-722-2675',
      phoneLink: 'tel:18887222675',
      callAction: 'tel:18887222675',
      passId: '730fa126-7f6c-415a-bec7-fdeb2cbc344f'
    }
  ];

  for (const prof of profiles) {
    console.log(`\n========================================`);
    console.log(`TESTING PERSONA: ${prof.name.toUpperCase()} (${prof.slug})`);
    console.log(`========================================`);

    // 1. Test Badge Page
    console.log(`-> Testing ${prof.badgeFile}...`);
    await page.goto(`http://127.0.0.1:${PORT}/${prof.badgeFile}`, { waitUntil: 'networkidle' });

    const badgeName = await page.$eval('#staffName', el => el.textContent.trim());
    const badgePhone = await page.$eval('#staffPhone', el => el.textContent.trim());
    const badgePhoneLink = await page.$eval('#phoneLink', el => el.getAttribute('href'));

    console.log(`   Badge Staff Name:  ${badgeName}`);
    console.log(`   Badge Staff Phone: ${badgePhone}`);
    console.log(`   Badge Phone Link:  ${badgePhoneLink}`);

    if (badgeName !== prof.name) throw new Error(`${prof.badgeFile} name mismatch: got "${badgeName}", expected "${prof.name}"`);
    if (badgePhoneLink !== prof.phoneLink) throw new Error(`${prof.badgeFile} phone link mismatch: ${badgePhoneLink}`);

    // Test QR Modal on badge
    await page.evaluate(() => window.toggleExpoQr(true));
    const modalRepName = await page.$eval('#modalRepName', el => el.textContent.trim());
    const modalPublicCardLink = await page.$eval('#modalPublicCardLink', el => el.getAttribute('href'));
    console.log(`   QR Modal Rep Name:  ${modalRepName}`);
    console.log(`   QR Modal Card Link: ${modalPublicCardLink}`);

    if (!modalRepName.includes(prof.name.split(' ')[0])) {
      throw new Error(`${prof.badgeFile} modal rep mismatch: ${modalRepName}`);
    }
    if (modalPublicCardLink !== `/${prof.slug}`) {
      throw new Error(`${prof.badgeFile} modal link mismatch: ${modalPublicCardLink}`);
    }

    // 2. Test Card Page
    console.log(`-> Testing ${prof.cardFile}...`);
    await page.goto(`http://127.0.0.1:${PORT}/${prof.cardFile}`, { waitUntil: 'networkidle' });

    const cardRepName = await page.$eval('#staffName', el => el.textContent.trim());
    const callAction = await page.$eval('#callAction', el => el.getAttribute('href'));
    const emailAction = await page.$eval('#emailAction', el => el.getAttribute('href'));
    const applePassLink = await page.$eval('#cardAppleWalletBtn', el => el.getAttribute('href'));

    console.log(`   Card Staff Name:    ${cardRepName}`);
    console.log(`   Card Call Link:     ${callAction}`);
    console.log(`   Card Email Link:    ${emailAction}`);
    console.log(`   Apple Pass URL:     ${applePassLink}`);

    if (cardRepName !== prof.name) throw new Error(`${prof.cardFile} name mismatch: got "${cardRepName}", expected "${prof.name}"`);
    if (callAction !== prof.callAction) throw new Error(`${prof.cardFile} call mismatch: got "${callAction}", expected "${prof.callAction}"`);
    if (!emailAction.includes(prof.email)) throw new Error(`${prof.cardFile} email mismatch: ${emailAction}`);
    if (!applePassLink.includes(prof.passId)) throw new Error(`${prof.cardFile} wallet pass ID mismatch: ${applePassLink}`);

    // 3. Test End-to-End Briefing Modal & Form Flow
    console.log(`-> Testing Briefing Consultation modal & booking flow...`);
    await page.evaluate(() => {
      if (typeof openBriefingModal === 'function') openBriefingModal();
    });

    const modalRepVal = await page.$eval('#briefingModalRepName', el => el.textContent.trim());
    console.log(`   Briefing Modal Rep: ${modalRepVal}`);
    if (!modalRepVal.includes(prof.name.split(' ')[0])) {
      throw new Error(`${prof.cardFile} briefingModalRepName mismatch: ${modalRepVal}`);
    }

    // Fill consultation inputs
    await page.fill('#consultName', 'Alex Rivera');
    await page.fill('#consultAgency', 'Department of Transportation');
    await page.fill('#consultEmail', 'alex.rivera@dot.gov');
    await page.fill('#consultPhone', '(202) 555-0199');

    // Trigger consultation booking
    await page.evaluate(() => {
      if (typeof submitConsultationBooking === 'function') {
        submitConsultationBooking(new Event('submit'));
      }
    });

    await page.waitForTimeout(600);

    const successRepVal = await page.$eval('#successRepName', el => el.textContent.trim());
    console.log(`   Success Card Assigned Rep: ${successRepVal}`);
    if (successRepVal !== prof.name) {
      throw new Error(`${prof.cardFile} successRepName mismatch: got "${successRepVal}", expected "${prof.name}"`);
    }

    // Close Briefing Modal
    await page.evaluate(() => {
      if (typeof closeBriefingModal === 'function') closeBriefingModal();
    });
    await page.waitForTimeout(300);

    // 4. Test Reciprocal Inline Lead Capture (Step 2)
    console.log(`-> Testing Reciprocal Inline Lead Capture (Step 2)...`);
    await page.evaluate(() => {
      if (typeof revealStep2Exchange === 'function') revealStep2Exchange(false);
    });
    await page.waitForTimeout(300);

    await page.fill('#inlineName', 'Elena Vance');
    await page.fill('#inlineAgency', 'US Army Corps of Engineers');
    await page.fill('#inlineEmail', 'elena.vance@usace.army.mil');
    await page.fill('#inlinePhone', '(817) 555-0144');
    await page.evaluate(() => {
      if (typeof handleInlineLeadSubmit === 'function') {
        handleInlineLeadSubmit(new Event('submit'));
      }
    });

    // Check localStorage lead queue
    const leadSavedLocally = await page.evaluate(() => {
      const leads = JSON.parse(localStorage.getItem('p22_leads') || '[]');
      return leads.some(l => l.client_email === 'elena.vance@usace.army.mil');
    });
    console.log(`   Lead saved to localStorage offline queue: ${leadSavedLocally ? 'YES (Verified)' : 'NO'}`);
    if (!leadSavedLocally) {
      throw new Error(`${prof.cardFile} inline lead was not saved to localStorage!`);
    }
  }

  await browser.close();
  server.close();

  console.log('\n========================================');
  console.log(`HEADLESS TOUR SUMMARY`);
  console.log(`========================================`);
  const appErrors = errors.filter(e => !e.includes('vercel') && !e.includes('favicon'));
  console.log(`App Console Errors: ${appErrors.length}`);
  if (appErrors.length > 0) {
    console.log(appErrors);
    process.exit(1);
  }
  console.log('Zero console errors detected. All personas, modals, wallet passes, and forms verified 100% operational.');
}

runTour().catch(err => {
  console.error('\nTest Tour Failed:', err);
  process.exit(1);
});
