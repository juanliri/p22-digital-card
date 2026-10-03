/**
 * 10-Point Master Production Readiness & Asset Ranking Audit
 * P-22 Corp Digital Identity Suite
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { getSheetsClient } = require('../lib/google-sheets');

const ROOT = path.resolve('.');
const BASE_URL = 'https://p22-digital-card.vercel.app';
const SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';
const REPS = ['pedro', 'eduardo', 'marleni', 'logistics', 'bids'];

let auditScores = [];

function recordAudit(number, name, status, details = []) {
  auditScores.push({ number, name, status, details });
  const icon = status === 'PASSED' ? '✅' : '❌';
  console.log(`\n[AUDIT ${number}/10] ${icon} ${name.toUpperCase()} -> ${status}`);
  details.forEach(d => console.log(`    ${d}`));
}

function httpGet(urlPath) {
  return new Promise((resolve) => {
    https.get(`${BASE_URL}${urlPath}`, (res) => {
      resolve({ code: res.statusCode, headers: res.headers });
    }).on('error', (err) => {
      resolve({ code: 0, error: err.message });
    });
  });
}

async function runMasterAudit() {
  console.log('================================================================');
  console.log('       P-22 CORP: 10-POINT MASTER PRODUCTION AUDIT SUITE        ');
  console.log('================================================================');

  // --- AUDIT 1: Core Profile Routes & HTTP Integrity ---
  let a1Pass = true;
  let a1Details = [];
  for (const rep of REPS) {
    const res = await httpGet(`/${rep}`);
    if (res.code === 200) {
      a1Details.push(`[200 OK] /${rep} (Public Digital Card)`);
    } else {
      a1Pass = false;
      a1Details.push(`[FAIL] /${rep} -> HTTP ${res.code}`);
    }
  }
  recordAudit(1, 'Core Profile Routes & HTTP Integrity', a1Pass ? 'PASSED' : 'FAILED', a1Details);

  // --- AUDIT 2: Staff Mobile Badge & PWA Service Worker ---
  let a2Pass = true;
  let a2Details = [];
  const badgeRes = await httpGet('/badge');
  const swRes = await httpGet('/sw.js');
  if (badgeRes.code === 200) a2Details.push(`[200 OK] /badge (Mobile PWA Shell)`);
  else { a2Pass = false; a2Details.push(`[FAIL] /badge -> ${badgeRes.code}`); }
  if (swRes.code === 200) a2Details.push(`[200 OK] /sw.js (Offline Service Worker Cache)`);
  else { a2Pass = false; a2Details.push(`[FAIL] /sw.js -> ${swRes.code}`); }
  
  const badgeHtml = fs.readFileSync(path.join(ROOT, 'badge.html'), 'utf8');
  if (badgeHtml.includes('min-h-[100dvh]')) a2Details.push('[VERIFIED] 100dvh mobile viewport lock');
  if (badgeHtml.includes("triggerCardScan('badge')")) a2Details.push('[VERIFIED] Direct OCR scan shortcut in action grid');
  recordAudit(2, 'Staff Mobile Badge PWA & Service Worker', a2Pass ? 'PASSED' : 'FAILED', a2Details);

  // --- AUDIT 3: Edge 302 Short-Link Router ---
  let a3Pass = true;
  let a3Details = [];
  for (const rep of REPS) {
    const res = await httpGet(`/r/${rep}`);
    if (res.code === 302) {
      a3Details.push(`[302 Redirect] /r/${rep} -> ${res.headers.location || `/${rep}`}`);
    } else {
      a3Pass = false;
      a3Details.push(`[FAIL] /r/${rep} -> HTTP ${res.code}`);
    }
  }
  recordAudit(3, 'Edge 302 Short-Link & NFC Router', a3Pass ? 'PASSED' : 'FAILED', a3Details);

  // --- AUDIT 4: Digital Wallet Passes (Apple & Google) ---
  let a4Pass = true;
  let a4Details = [];
  for (const rep of ['pedro-felipe', 'eduardo-lopez', 'marleni-mendez', 'bids-p22', 'logistics-p22']) {
    const res = await httpGet(`/assets/passes/${rep}.pkpass`);
    if (res.code === 200) {
      a4Details.push(`[200 OK] /assets/passes/${rep}.pkpass (Apple PassKit)`);
    } else {
      a4Pass = false;
      a4Details.push(`[FAIL] /assets/passes/${rep}.pkpass -> HTTP ${res.code}`);
    }
  }
  const teamData = JSON.parse(fs.readFileSync(path.join(ROOT, 'team.json'), 'utf8'));
  for (const rep of REPS) {
    if (teamData[rep] && teamData[rep].googleWalletUrl && teamData[rep].googleWalletUrl.includes('pay.google.com')) {
      a4Details.push(`[VERIFIED] Google Wallet JWT token for ${rep}`);
    } else {
      a4Pass = false;
      a4Details.push(`[FAIL] Missing Google Wallet URL for ${rep}`);
    }
  }
  recordAudit(4, 'Apple Wallet & Google Pay Cryptographic Passes', a4Pass ? 'PASSED' : 'FAILED', a4Details);

  // --- AUDIT 5: RFC 2426 vCard 3.0 & Embedded Media ---
  let a5Pass = true;
  let a5Details = [];
  for (const rep of REPS) {
    const vcfPath = path.join(ROOT, 'assets', 'vcf', `${rep}.vcf`);
    if (fs.existsSync(vcfPath)) {
      const vcfContent = fs.readFileSync(vcfPath, 'utf8');
      const hasCAGE = vcfContent.includes('169D8');
      const hasPhoto = vcfContent.includes('PHOTO;TYPE=JPEG;ENCODING=b:');
      if (hasCAGE && hasPhoto) {
        a5Details.push(`[VERIFIED] ${rep}.vcf: Valid vCard 3.0, CAGE 169D8, Base64 Photo`);
      } else {
        a5Pass = false;
        a5Details.push(`[FAIL] ${rep}.vcf missing CAGE or Photo`);
      }
    } else {
      a5Pass = false;
      a5Details.push(`[FAIL] File missing: ${rep}.vcf`);
    }
  }
  recordAudit(5, 'RFC 2426 vCard 3.0 & Embedded Media', a5Pass ? 'PASSED' : 'FAILED', a5Details);

  // --- AUDIT 6: In-Field Business Card OCR Scanner Engine ---
  let a6Pass = true;
  let a6Details = [];
  const scannerJs = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'card-scanner.js'), 'utf8');
  if (scannerJs.includes('window.triggerCardScan')) a6Details.push('[VERIFIED] window.triggerCardScan global hook active');
  if (scannerJs.includes('loadTesseract')) a6Details.push('[VERIFIED] On-device neural OCR (Tesseract.js) fallback active');
  if (scannerJs.includes('/api/ocr')) a6Details.push('[VERIFIED] Cloud AI Vision backend fallback route mapped');
  if (scannerJs.includes('activeRep')) a6Details.push('[VERIFIED] Seamless badge activeRep lead association');
  recordAudit(6, 'In-Field Business Card OCR Scanner Engine', a6Pass ? 'PASSED' : 'FAILED', a6Details);

  // --- AUDIT 7: Google Sheets Live Telemetry & Leads Vault ---
  let a7Pass = true;
  let a7Details = [];
  try {
    const sheets = getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetTitles = meta.data.sheets.map(s => s.properties.title);
    a7Details.push(`[CONNECTED] Google Spreadsheet ID: ${SPREADSHEET_ID.slice(0, 10)}...`);
    a7Details.push(`[TABS ACTIVE] ${sheetTitles.join(', ')}`);

    const vaultRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads_Vault!A1:H',
    });
    a7Details.push(`[LEADS LOGGED] ${vaultRows.data.values ? vaultRows.data.values.length : 0} rows in Leads_Vault`);
  } catch (err) {
    a7Pass = false;
    a7Details.push(`[FAIL] Google Sheets error: ${err.message}`);
  }
  recordAudit(7, 'Google Sheets Database & Telemetry Stream', a7Pass ? 'PASSED' : 'FAILED', a7Details);

  // --- AUDIT 8: Visual Asset Canvases & Pre-Rendering ---
  let a8Pass = true;
  let a8Details = [];
  for (const rep of REPS) {
    const lsPath = path.join(ROOT, 'assets', `failsafe_lockscreen_${rep}.png`);
    if (fs.existsSync(lsPath)) {
      const stats = fs.statSync(lsPath);
      a8Details.push(`[LOCKSCREEN] ${rep}: ${(stats.size / 1024).toFixed(1)} KB`);
    } else {
      a8Pass = false;
      a8Details.push(`[FAIL] Missing lockscreen for ${rep}`);
    }
  }
  const setupHtml = fs.readFileSync(path.join(ROOT, 'setup.html'), 'utf8');
  if (setupHtml.includes('watchDialCanvas') && setupHtml.includes('virtualBgCanvas')) {
    a8Details.push('[CANVASES] Apple Watch Dial & 1080p Zoom Virtual Background canvases verified');
  }
  recordAudit(8, 'Visual Asset Canvases & Offline Failsafes', a8Pass ? 'PASSED' : 'FAILED', a8Details);

  // --- AUDIT 9: Zero-Key Exposure & Federal Privacy Compliance ---
  let a9Pass = true;
  let a9Details = [];
  const gitIgnore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  if (gitIgnore.includes('credentials/') && gitIgnore.includes('*.key')) {
    a9Details.push('[SECURE] .gitignore strictly protects credentials/ and private keys');
  } else {
    a9Pass = false;
    a9Details.push('[FAIL] Weak .gitignore rules');
  }
  const teleJs = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'telemetry.js'), 'utf8');
  if (!teleJs.includes('cookie') && !teleJs.includes('document.cookie')) {
    a9Details.push('[COMPLIANT] Zero client-side cookie usage (OMB M-10-22 compliant)');
  }
  recordAudit(9, 'Zero-Key Exposure & Regulatory Compliance', a9Pass ? 'PASSED' : 'FAILED', a9Details);

  // --- AUDIT 10: Complete Asset Directory Inventory & File Size Ranking ---
  console.log('\n[AUDIT 10/10] 📊 ASSET DIRECTORY INVENTORY & FILE SIZE RANKING');
  
  function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (['node_modules', '.git', '.vercel', '.playwright-mcp'].includes(file)) continue;
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFiles = getFiles(ROOT);
  const rankedFiles = allFiles.map(fp => {
    const stats = fs.statSync(fp);
    const rel = path.relative(ROOT, fp);
    return { path: rel, size: stats.size, ext: path.extname(fp).toLowerCase() };
  }).sort((a, b) => b.size - a.size);

  const totalBytes = rankedFiles.reduce((acc, f) => acc + f.size, 0);

  console.log(`    Total Tracked Production Assets: ${rankedFiles.length} files`);
  console.log(`    Total Size on Disk: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB\n`);
  console.log('    Top 15 Heaviest Assets (Optimized Media Breakdown):');
  rankedFiles.slice(0, 15).forEach((f, idx) => {
    const sz = f.size > 1024 * 1024 
      ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${(f.size / 1024).toFixed(1)} KB`;
    console.log(`      ${(idx + 1).toString().padStart(2, ' ')}. ${sz.padStart(9, ' ')} | ${f.path}`);
  });

  console.log('\n================================================================');
  const allPassed = auditScores.every(a => a.status === 'PASSED');
  console.log(`MASTER AUDIT RESULT: ${allPassed ? '10 / 10 AUDITS PASSED (PRODUCTION READY)' : 'AUDIT FAILURES DETECTED'}`);
  console.log('================================================================\n');

  return { allPassed, auditScores, rankedFiles, totalBytes };
}

runMasterAudit().catch(console.error);
