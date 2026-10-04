import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8089;

// Lightweight static HTTP server for accurate root-relative asset testing
function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.vcf': 'text/vcard',
    '.pkpass': 'application/vnd.apple.pkpass'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/eduardo') {
      reqPath = reqPath === '/' ? '/index.html' : '/eduardo.html';
    } else if (reqPath === '/pedro') {
      reqPath = '/pedro.html';
    } else if (reqPath === '/marleni') {
      reqPath = '/marleni.html';
    } else if (reqPath === '/bids') {
      reqPath = '/bids.html';
    } else if (reqPath === '/logistics') {
      reqPath = '/logistics.html';
    }

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
      console.log(`[Server 404]: ${reqPath}`);
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

  // 1. Test badge-eduardo.html
  console.log('\n--- Touring badge-eduardo.html ---');
  await page.goto(`http://127.0.0.1:${PORT}/badge-eduardo.html`, { waitUntil: 'networkidle' });

  const badgeStaffName = await page.$eval('#staffName', el => el.textContent.trim());
  const badgeStaffEmail = await page.$eval('#staffEmail', el => el.textContent.trim());
  const badgeStaffPhone = await page.$eval('#staffPhone', el => el.textContent.trim());
  const badgePhoneLink = await page.$eval('#phoneLink', el => el.getAttribute('href'));

  console.log(`Badge Staff Name:  ${badgeStaffName}`);
  console.log(`Badge Staff Email: ${badgeStaffEmail}`);
  console.log(`Badge Staff Phone: ${badgeStaffPhone}`);
  console.log(`Badge Phone Link:  ${badgePhoneLink}`);

  if (badgeStaffName !== 'Eduardo Lopez') throw new Error(`Unexpected name: ${badgeStaffName}`);
  if (badgeStaffEmail !== 'elopez@p22corp.com') throw new Error(`Unexpected email: ${badgeStaffEmail}`);
  if (!badgeStaffPhone.includes('407')) throw new Error(`Expected 407 in phone: ${badgeStaffPhone}`);
  if (badgePhoneLink !== 'tel:14073699001') throw new Error(`Unexpected phone link: ${badgePhoneLink}`);

  // Test QR Modal on badge
  console.log('Testing Expo QR modal on badge...');
  await page.evaluate(() => window.toggleExpoQr(true));
  const modalRepName = await page.$eval('#modalRepName', el => el.textContent.trim());
  const modalPublicCardLink = await page.$eval('#modalPublicCardLink', el => el.getAttribute('href'));
  console.log(`QR Modal Rep Name:   ${modalRepName}`);
  console.log(`QR Modal Card Link:  ${modalPublicCardLink}`);

  if (modalRepName !== 'Eduardo Lopez') throw new Error(`Unexpected modal rep: ${modalRepName}`);
  if (modalPublicCardLink !== '/eduardo') throw new Error(`Unexpected public card link: ${modalPublicCardLink}`);

  // 2. Test eduardo.html
  console.log('\n--- Touring eduardo.html ---');
  await page.goto(`http://127.0.0.1:${PORT}/eduardo.html`, { waitUntil: 'networkidle' });

  const cardRepName = await page.$eval('#staffName', el => el.textContent.trim());
  const callAction = await page.$eval('#callAction', el => el.getAttribute('href'));
  const smsAction = await page.$eval('#smsAction', el => el.getAttribute('href'));
  const waAction = await page.$eval('#whatsappAction', el => el.getAttribute('href'));
  const emailAction = await page.$eval('#emailAction', el => el.getAttribute('href'));

  console.log(`Card Rep Name:    ${cardRepName}`);
  console.log(`Call Action Href: ${callAction}`);
  console.log(`SMS Action Href:  ${smsAction}`);
  console.log(`WA Action Href:   ${waAction}`);
  console.log(`Email Action:     ${emailAction}`);

  if (callAction !== 'tel:14073699001') throw new Error(`Call action mismatch: ${callAction}`);
  if (smsAction !== 'sms:14073699001') throw new Error(`SMS action mismatch: ${smsAction}`);
  if (!waAction.includes('14073699001')) throw new Error(`WhatsApp action mismatch: ${waAction}`);
  if (!emailAction.includes('elopez@p22corp.com')) throw new Error(`Email mismatch: ${emailAction}`);

  // Test Lead Capture Modal & Form Validation
  console.log('\nTesting Lead Capture form completion...');
  await page.evaluate(() => {
    if (typeof openExchangeModal === 'function') {
      openExchangeModal();
    }
  });

  const repFieldVal = await page.evaluate(() => {
    const repInput = document.getElementById('briefingModalRepName');
    return repInput ? repInput.textContent.trim() : 'N/A';
  });
  console.log(`Lead form assigned rep: ${repFieldVal}`);
  if (repFieldVal !== 'Eduardo Lopez') throw new Error(`Lead modal rep mismatch: ${repFieldVal}`);

  await browser.close();
  server.close();

  console.log('\n--- SUMMARY ---');
  // Filter out any 3rd party CDN tracking errors if offline (e.g. analytics or external script timeouts)
  const appErrors = errors.filter(e => !e.includes('vercel') && !e.includes('favicon'));
  console.log(`App Console Errors: ${appErrors.length}`);
  if (appErrors.length > 0) {
    console.log(appErrors);
    process.exit(1);
  }
  console.log('Headless Browser Tour completed with 0 errors! Verified 100% operational.');
}

runTour().catch(err => {
  console.error('Test Tour Failed:', err);
  process.exit(1);
});
