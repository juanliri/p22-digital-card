const fs = require('fs');
const path = require('path');

const REPS = ['pedro', 'eduardo', 'marleni', 'logistics', 'bids'];
const ROOT = path.resolve('.');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log('  [PASS] ' + message);
  } else {
    failedChecks++;
    console.error('  [FAIL] ' + message);
  }
}

console.log('===========================================================');
console.log('   P-22 CORP: MULTI-USER PERSPECTIVE INTEGRITY AUDIT');
console.log('===========================================================\n');

// 1. Audit Public Card Files
for (const rep of REPS) {
  const file = path.join(ROOT, rep + '.html');
  console.log('[*] Auditing Public Card for [' + rep.toUpperCase() + ']:');
  assert(fs.existsSync(file), 'HTML file exists: ' + rep + '.html');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('CAGE: 169D8') || content.includes('169D8'), 'Contains verified CAGE 169D8');
  assert(content.includes('X3HUQZ66P6N3'), 'Contains verified UEI X3HUQZ66P6N3');
  assert(content.includes('/assets/js/telemetry.js'), 'Loads telemetry tracking engine');
  assert(content.includes('/assets/js/card-scanner.js'), 'Loads OCR card scanner engine');
  assert(content.includes('assets/passes/'), 'Contains Apple Wallet pass reference');
  assert(content.includes('assets/vcf/'), 'Contains vCard download reference');
  assert(content.includes('triggerCardScan'), 'Contains OCR camera trigger hook');
  console.log('');
}

// 2. Audit Badge File
console.log('[*] Auditing Staff Badge (badge.html):');
const badgeFile = path.join(ROOT, 'badge.html');
assert(fs.existsSync(badgeFile), 'badge.html exists');
const badgeContent = fs.readFileSync(badgeFile, 'utf8');
assert(badgeContent.includes("triggerCardScan('badge')"), 'Contains direct OCR card scan shortcut');
assert(badgeContent.includes('Save Pass'), 'Contains instant save pass button');
assert(badgeContent.includes('Display QR'), 'Contains fullscreen QR modal trigger');
assert(badgeContent.includes('Staff Tools'), 'Contains compact staff tools dropdown');
assert(badgeContent.includes('/assets/js/card-scanner.js'), 'Imports card-scanner.js');
assert(badgeContent.includes('/assets/js/telemetry.js'), 'Imports telemetry.js');

for (const rep of REPS) {
  assert(badgeContent.includes('"' + rep + '":'), 'TEAM_DATA includes ' + rep + ' profile');
}
console.log('');

// 3. Audit Setup Studio (setup.html)
console.log('[*] Auditing Setup Studio (setup.html):');
const setupFile = path.join(ROOT, 'setup.html');
assert(fs.existsSync(setupFile), 'setup.html exists');
const setupContent = fs.readFileSync(setupFile, 'utf8');
assert(setupContent.includes('tabBtn-passes'), 'Contains tabBtn-passes');
assert(setupContent.includes('tabBtn-visuals'), 'Contains tabBtn-visuals');
assert(setupContent.includes('tabBtn-signature'), 'Contains tabBtn-signature');
assert(setupContent.includes('tabBtn-telemetry'), 'Contains tabBtn-telemetry');
assert(setupContent.includes('switchSetupTab'), 'Contains switchSetupTab function');
assert(setupContent.includes('switchProfileModal'), 'Contains switchProfileModal overlay');
assert(setupContent.includes("triggerCardScan('setup')"), 'Contains setup card scanner trigger');
assert(setupContent.includes('syncAllLeadsToGoogleSheet'), 'Contains Google Sheets sync function');
assert(setupContent.includes('exportLeadsSetupCSV'), 'Contains CSV export function');
console.log('');

// 4. Audit Static Assets
console.log('[*] Auditing Static Assets on Disk:');
for (const rep of REPS) {
  const vcf = path.join(ROOT, 'assets', 'vcf', rep + '.vcf');
  assert(fs.existsSync(vcf), 'vCard exists: assets/vcf/' + rep + '.vcf');

  const lockscreen = path.join(ROOT, 'assets', 'failsafe_lockscreen_' + rep + '.png');
  assert(fs.existsSync(lockscreen), 'Failsafe lockscreen exists: assets/failsafe_lockscreen_' + rep + '.png');
}

console.log('\n===========================================================');
console.log('RESULTS: ' + passedChecks + ' Passed / ' + failedChecks + ' Failed (Total: ' + totalChecks + ')');
console.log('===========================================================\n');

if (failedChecks > 0) {
  process.exit(1);
}
