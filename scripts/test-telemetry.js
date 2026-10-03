/**
 * P-22 Telemetry Test Script
 * Usage: node scripts/test-telemetry.js [SPREADSHEET_ID]
 */

const fs = require('fs');
const path = require('path');
const { appendTelemetryRow, initSheetHeaders } = require('../lib/google-sheets');

async function run() {
  const args = process.argv.slice(2);
  let sheetId = args[0] || process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GOOGLE_SHEET_ID=(.+)/);
      if (match) sheetId = match[1].trim();
    }
  }

  if (!sheetId) {
    console.error('[-] Error: No SPREADSHEET_ID provided.');
    console.log('Usage: node scripts/test-telemetry.js <SPREADSHEET_ID>');
    process.exit(1);
  }

  console.log(`[*] Testing Telemetry on Sheet: ${sheetId}`);
  console.log('[*] Initializing headers if not present...');
  await initSheetHeaders(sheetId);

  console.log('[*] Appending test telemetry rows...');
  const testEvents = [
    {
      rep: 'pedro',
      event: 'badge_view',
      platform: 'iOS',
      source: 'nfc',
      details: { role: 'Managing Director & Federal Contract Lead', test: true },
      spreadsheetId: sheetId,
    },
    {
      rep: 'eduardo',
      event: 'vcard_saved',
      platform: 'Android',
      source: 'expo_qr',
      details: { role: 'Operations & Procurement Coordinator', test: true },
      spreadsheetId: sheetId,
    },
    {
      rep: 'marleni',
      event: 'dial',
      platform: 'Desktop',
      source: 'email_sig',
      details: { role: 'Client Relations & Supply Administration', test: true },
      spreadsheetId: sheetId,
    },
  ];

  for (const entry of testEvents) {
    const result = await appendTelemetryRow(entry);
    console.log(`[+] Logged [${entry.rep}] [${entry.event}] ->`, result);
  }

  console.log('\n[✓] Telemetry test completed successfully!');
}

run().catch((err) => {
  console.error('[-] Fatal error running telemetry test:', err);
  process.exit(1);
});
