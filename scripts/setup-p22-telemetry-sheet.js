/**
 * P-22 Badge Telemetry - Setup Shared Sheet
 * Renames sheet to P22_Badge_Telemetry, applies styling tokens, freezes Row 1,
 * and appends verified initialization row.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';
const KEY_FILE = path.join(__dirname, '..', 'credentials', 'google-sa.json');
const ENV_FILE = path.join(__dirname, '..', '.env');

async function main() {
  console.log('[*] Connecting to Google Sheets API...');
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const drive = google.drive({ version: 'v3', auth: client });

  // 1. Rename Sheet to P22_Badge_Telemetry
  console.log('[*] Renaming file to "P22_Badge_Telemetry"...');
  await drive.files.update({
    fileId: SPREADSHEET_ID,
    resource: {
      name: 'P22_Badge_Telemetry',
    },
  });
  console.log('[+] File renamed successfully!');

  // 2. Set Row 1 Headers
  const headers = ['Timestamp', 'Rep', 'Event', 'Platform', 'Source', 'Details'];
  console.log('[*] Setting Header Row: ', headers);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A1:F1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [headers],
    },
  });

  // 3. Style Headers: Dark Navy (#14213d), Bold White Text, Frozen Row 1
  console.log('[*] Styling header row and freezing row 1...');
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.13, blue: 0.24 }, // Dark Navy #14213d
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    fontSize: 11,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      },
    });
    console.log('[+] Header styling and freeze applied successfully!');
  } catch (styleErr) {
    console.warn('[!] Styling notice:', styleErr.message);
  }

  // 4. Append verified test row
  console.log('[*] Appending live telemetry initialization row...');
  const initRow = [
    new Date().toISOString(),
    'system',
    'telemetry_connected',
    'Vercel_Edge',
    'setup_engine',
    JSON.stringify({ status: 'live', nist_au2: true, cookies: false, owner: 'jliriano@p22corp.com' }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:F',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [initRow],
    },
  });
  console.log('[+] Initialization row appended successfully!');

  // 5. Update local .env
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  }
  const regex = /^GOOGLE_SHEET_ID=.*$/m;
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `GOOGLE_SHEET_ID=${SPREADSHEET_ID}`);
  } else {
    envContent += (envContent.length && !envContent.endsWith('\n') ? '\n' : '') + `GOOGLE_SHEET_ID=${SPREADSHEET_ID}\n`;
  }
  fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  console.log('[+] Saved GOOGLE_SHEET_ID to local .env');

  console.log('\n======================================================');
  console.log(`SPREADSHEET CONFIGURED: ${SPREADSHEET_ID}`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Fatal error setting up sheet:', err);
  process.exit(1);
});
