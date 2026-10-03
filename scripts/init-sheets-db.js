/**
 * P-22 Badge Telemetry - Google Sheets Database Initializer
 * Creates the telemetry sheet in Google Drive, adds headers, and grants access to jliriano@p22corp.com
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '..', 'credentials', 'google-sa.json');
const ENV_FILE = path.join(__dirname, '..', '.env');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

async function main() {
  console.log('[*] Loading Service Account credentials...');
  if (!fs.existsSync(KEY_FILE)) {
    throw new Error(`Credentials file not found at ${KEY_FILE}`);
  }

  const credentials = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  console.log(`[+] Authenticated as: ${credentials.client_email}`);
  console.log(`[+] Project ID: ${credentials.project_id}`);

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const drive = google.drive({ version: 'v3', auth: authClient });

  console.log('[*] Creating Google Spreadsheet "P22_Badge_Telemetry"...');
  const createRes = await sheets.spreadsheets.create({
    resource: {
      properties: {
        title: 'P22_Badge_Telemetry',
      },
      sheets: [
        {
          properties: {
            title: 'Sheet1',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId;
  const spreadsheetUrl = createRes.data.spreadsheetUrl;
  console.log(`[+] Spreadsheet created successfully!`);
  console.log(`[+] SPREADSHEET_ID: ${spreadsheetId}`);
  console.log(`[+] URL: ${spreadsheetUrl}`);

  // Set Row 1 Headers
  const headers = ['Timestamp', 'Rep', 'Event', 'Platform', 'Source', 'Details'];
  console.log('[*] Setting Header Row: ', headers);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Sheet1!A1:F1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [headers],
    },
  });

  // Optional: Format header row (bold, dark navy background, white text)
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
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
    console.log('[+] Header styling applied successfully.');
  } catch (fmtErr) {
    console.warn('[!] Non-fatal warning styling headers:', fmtErr.message);
  }

  // Grant access to jliriano@p22corp.com
  const usersToShare = ['jliriano@p22corp.com', 'admin@p22corp.com'];
  for (const email of usersToShare) {
    try {
      console.log(`[*] Sharing spreadsheet with ${email} (Role: writer)...`);
      await drive.permissions.create({
        fileId: spreadsheetId,
        sendNotificationEmail: false,
        resource: {
          type: 'user',
          role: 'writer',
          emailAddress: email,
        },
      });
      console.log(`[+] Successfully granted access to ${email}`);
    } catch (shareErr) {
      console.error(`[-] Error sharing with ${email}: ${shareErr.message}`);
    }
  }

  // Also make it accessible via domain/link if desired (commented out to stay strictly restricted to p22corp)
  // Save to .env
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  }

  const sheetIdRegex = /^GOOGLE_SHEET_ID=.*$/m;
  if (sheetIdRegex.test(envContent)) {
    envContent = envContent.replace(sheetIdRegex, `GOOGLE_SHEET_ID=${spreadsheetId}`);
  } else {
    envContent += (envContent.length && !envContent.endsWith('\n') ? '\n' : '') + `GOOGLE_SHEET_ID=${spreadsheetId}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  console.log(`[+] Saved GOOGLE_SHEET_ID to .env`);

  // Append a verification test row
  console.log('[*] Appending verification test row...');
  const testRow = [
    new Date().toISOString(),
    'system',
    'telemetry_init',
    'Server',
    'setup_script',
    JSON.stringify({ status: 'active', nist_au2: true, cookies: false }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:F',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [testRow],
    },
  });
  console.log('[+] Test row inserted successfully!');
  console.log('\n======================================================');
  console.log(`GOOGLE_SHEET_ID=${spreadsheetId}`);
  console.log(`GOOGLE_SHEET_URL=${spreadsheetUrl}`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
