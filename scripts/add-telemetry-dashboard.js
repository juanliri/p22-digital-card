/**
 * P-22 Badge Telemetry - Add KPI Analytics Dashboard Tab
 * Creates an executive dashboard tab inside P22_Badge_Telemetry with live counting formulas.
 */

const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';
const KEY_FILE = path.join(__dirname, '..', 'credentials', 'google-sa.json');

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // 1. Check if 'Dashboard' tab already exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetTitles = meta.data.sheets.map((s) => s.properties.title);

  let dashboardSheetId = null;
  if (!sheetTitles.includes('Dashboard')) {
    console.log('[*] Creating "Dashboard" tab in Google Sheets...');
    const addSheetRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Dashboard',
                gridProperties: {
                  frozenRowCount: 2,
                },
              },
            },
          },
        ],
      },
    });
    dashboardSheetId = addSheetRes.data.replies[0].addSheet.properties.sheetId;
  } else {
    dashboardSheetId = meta.data.sheets.find((s) => s.properties.title === 'Dashboard').properties.sheetId;
  }

  // 2. Populate Dashboard with KPI Formulas (Wrapped in INDIRECT to prevent row-deletion shifts)
  const dashboardValues = [
    ['P-22 CORP EXECUTIVE TELEMETRY DASHBOARD', '', '', ''],
    ['Metric', 'Current Count', 'Percentage of Total', 'Benchmark / Notes'],
    ['Total Events Logged', '=COUNTA(INDIRECT("Sheet1!A2:A"))', '100.0%', 'All edge routing + user actions'],
    ['Total NFC Card Taps', '=COUNTIF(INDIRECT("Sheet1!E2:E"), "*nfc*")', '=IFERROR(B4/B3, 0)', 'Direct physical badge taps'],
    ['Total Expo QR Scans', '=COUNTIF(INDIRECT("Sheet1!E2:E"), "*expo_qr*")', '=IFERROR(B5/B3, 0)', 'Printed/badge QR code scans'],
    ['Email Signature Clicks', '=COUNTIF(INDIRECT("Sheet1!E2:E"), "*email_sig*")', '=IFERROR(B6/B3, 0)', 'Inbound email signature links'],
    ['', '', '', ''],
    ['KEY CONVERSION INTERACTIONS', '', '', ''],
    ['Contacts Saved (.vcf)', '=COUNTIF(INDIRECT("Sheet1!C2:C"), "*vcard*")', '=IFERROR(B9/B3, 0)', 'Downloaded full federal contact card'],
    ['Phone Calls Initiated', '=COUNTIF(INDIRECT("Sheet1!C2:C"), "*dial*")', '=IFERROR(B10/B3, 0)', 'Direct click-to-dial taps'],
    ['Email Inquiries Clicked', '=COUNTIF(INDIRECT("Sheet1!C2:C"), "*email*")', '=IFERROR(B11/B3, 0)', 'Direct mailto clicks to rep'],
    ['Wallet Passes Installed', '=COUNTIF(INDIRECT("Sheet1!C2:C"), "*wallet*")', '=IFERROR(B12/B3, 0)', 'Apple / Google Wallet installs'],
    ['QR Code Enlarged/Zoomed', '=COUNTIF(INDIRECT("Sheet1!C2:C"), "*qr_zoom*")', '=IFERROR(B13/B3, 0)', 'Badge screen shared at booth/expo'],
    ['', '', '', ''],
    ['ACTIVITY BY REPRESENTATIVE', '', '', ''],
    ['Pedro Felipe (Managing Director)', '=COUNTIF(INDIRECT("Sheet1!B2:B"), "pedro")', '=IFERROR(B16/B3, 0)', 'Federal procurement & primes'],
    ['Eduardo López (Operations)', '=COUNTIF(INDIRECT("Sheet1!B2:B"), "eduardo")', '=IFERROR(B17/B3, 0)', 'Field operations & materials'],
    ['Marleni Méndez (Client Relations)', '=COUNTIF(INDIRECT("Sheet1!B2:B"), "marleni")', '=IFERROR(B18/B3, 0)', 'Supply administration & inquiries'],
    ['Bids / Estimating Division', '=COUNTIF(INDIRECT("Sheet1!B2:B"), "bids")', '=IFERROR(B19/B3, 0)', 'Direct RFQ / Solicitations'],
    ['Logistics / DFW Fleet', '=COUNTIF(INDIRECT("Sheet1!B2:B"), "logistics")', '=IFERROR(B20/B3, 0)', 'Material delivery & tracking'],
  ];

  console.log('[*] Writing KPI formulas to "Dashboard"...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Dashboard!A1:D20',
    valueInputOption: 'USER_ENTERED',
    resource: { values: dashboardValues },
  });

  // 3. Style Dashboard: Dark Navy Header, Section Dividers, Clean Table Styling
  console.log('[*] Applying executive styling to "Dashboard"...');
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          // Title Banner
          {
            repeatCell: {
              range: {
                sheetId: dashboardSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 4,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.13, blue: 0.24 }, // Dark Navy #14213d
                  textFormat: { bold: true, foregroundColor: { red: 0.79, green: 0.64, blue: 0.15 }, fontSize: 13 }, // Gold text
                  horizontalAlignment: 'LEFT',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          // Column Headers
          {
            repeatCell: {
              range: {
                sheetId: dashboardSheetId,
                startRowIndex: 1,
                endRowIndex: 2,
                startColumnIndex: 0,
                endColumnIndex: 4,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.15, green: 0.22, blue: 0.35 },
                  textFormat: { bold: true, foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, fontSize: 10 },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          // Section Subheaders (Row 8 & 15)
          {
            repeatCell: {
              range: {
                sheetId: dashboardSheetId,
                startRowIndex: 7,
                endRowIndex: 8,
                startColumnIndex: 0,
                endColumnIndex: 4,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.92, green: 0.94, blue: 0.97 },
                  textFormat: { bold: true, foregroundColor: { red: 0.08, green: 0.13, blue: 0.24 }, fontSize: 10 },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: dashboardSheetId,
                startRowIndex: 14,
                endRowIndex: 15,
                startColumnIndex: 0,
                endColumnIndex: 4,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.92, green: 0.94, blue: 0.97 },
                  textFormat: { bold: true, foregroundColor: { red: 0.08, green: 0.13, blue: 0.24 }, fontSize: 10 },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });
    console.log('[+] Executive styling applied to Dashboard!');
  } catch (err) {
    console.warn('[!] Styling note:', err.message);
  }

  console.log('[✓] Dashboard setup completed successfully!');
}

main().catch((err) => {
  console.error('Fatal error setting up dashboard:', err);
  process.exit(1);
});
