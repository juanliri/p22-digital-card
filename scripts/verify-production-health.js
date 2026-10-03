/**
 * Production Health & Integrity Verification
 * Verifies every single route, pass, vCard, edge redirect, and Google Sheets telemetry stream.
 */

const https = require('https');
const path = require('path');
const { google } = require('googleapis');

const BASE_URL = 'https://p22-digital-card.vercel.app';
const SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';
const KEY_FILE = path.join(__dirname, '..', 'credentials', 'google-sa.json');

function checkUrl(urlPath, expectedCode = 200) {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    https.get(fullUrl, (res) => {
      const code = res.statusCode;
      const location = res.headers['location'] || '';
      const pass = code === expectedCode;
      resolve({
        url: urlPath,
        code,
        expectedCode,
        location,
        pass,
      });
    }).on('error', (err) => {
      resolve({
        url: urlPath,
        error: err.message,
        pass: false,
      });
    });
  });
}

async function verifyGoogleSheet() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const sheet1Res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A1:F',
  });

  const dashboardRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Dashboard!A1:C12',
  });

  return {
    sheet1Rows: sheet1Res.data.values ? sheet1Res.data.values.length : 0,
    dashboardTitle: dashboardRes.data.values ? dashboardRes.data.values[0][0] : 'N/A',
  };
}

async function run() {
  console.log('===========================================================');
  console.log('   P-22 CORP DIGITAL PORTAL & TELEMETRY HEALTH AUDIT');
  console.log('===========================================================\n');

  const tests = [
    // 1. Core Profile Pages
    { path: '/pedro', expected: 200, category: 'Profile' },
    { path: '/eduardo', expected: 200, category: 'Profile' },
    { path: '/marleni', expected: 200, category: 'Profile' },
    { path: '/bids', expected: 200, category: 'Profile' },
    { path: '/logistics', expected: 200, category: 'Profile' },

    // 2. Hub & Portal Tools
    { path: '/badge', expected: 200, category: 'Portal' },
    { path: '/setup', expected: 200, category: 'Portal' },
    { path: '/capability-statement', expected: 200, category: 'Portal' },
    { path: '/assets/js/telemetry.js', expected: 200, category: 'Asset' },

    // 3. Apple Wallet Passes (.pkpass)
    { path: '/assets/passes/pedro-felipe.pkpass', expected: 200, category: 'Pass' },
    { path: '/assets/passes/eduardo-lopez.pkpass', expected: 200, category: 'Pass' },
    { path: '/assets/passes/marleni-mendez.pkpass', expected: 200, category: 'Pass' },
    { path: '/assets/passes/bids-p22.pkpass', expected: 200, category: 'Pass' },
    { path: '/assets/passes/logistics-p22.pkpass', expected: 200, category: 'Pass' },

    // 4. Contact Cards (.vcf)
    { path: '/assets/vcf/pedro.vcf', expected: 200, category: 'vCard' },
    { path: '/assets/vcf/eduardo.vcf', expected: 200, category: 'vCard' },
    { path: '/assets/vcf/marleni.vcf', expected: 200, category: 'vCard' },
    { path: '/assets/vcf/bids.vcf', expected: 200, category: 'vCard' },
    { path: '/assets/vcf/logistics.vcf', expected: 200, category: 'vCard' },

    // 5. Edge 302 Redirection Router
    { path: '/r/pedro', expected: 302, category: 'Edge Router' },
    { path: '/r/eduardo', expected: 302, category: 'Edge Router' },
    { path: '/r/marleni', expected: 302, category: 'Edge Router' },
    { path: '/r/bids', expected: 302, category: 'Edge Router' },
    { path: '/r/logistics', expected: 302, category: 'Edge Router' },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const res = await checkUrl(t.path, t.expected);
    if (res.pass) {
      passed++;
      const extra = res.location ? `-> ${res.location}` : '';
      console.log(`[PASS] [${t.category}] ${t.path} (${res.code}) ${extra}`);
    } else {
      failed++;
      console.error(`[FAIL] [${t.category}] ${t.path} (Expected ${t.expected}, Got ${res.code || res.error})`);
    }
  }

  console.log('\n[*] Verifying Google Sheets API Connection...');
  try {
    const sheetHealth = await verifyGoogleSheet();
    console.log(`[PASS] Google Sheets Telemetry Active:`);
    console.log(`       - Raw Audit Rows Logged: ${sheetHealth.sheet1Rows}`);
    console.log(`       - Dashboard Tab Title: "${sheetHealth.dashboardTitle}"`);
  } catch (err) {
    console.error(`[FAIL] Google Sheets error: ${err.message}`);
    failed++;
  }

  console.log('\n===========================================================');
  console.log(`TOTAL VERIFIED: ${passed + (failed === 0 ? 1 : 0)} / ${tests.length + 1} | FAILURES: ${failed}`);
  console.log('===========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal audit failure:', e);
  process.exit(1);
});
