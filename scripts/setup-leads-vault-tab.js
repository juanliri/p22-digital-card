/**
 * P-22 Badge & Expo Leads - Create and Style Leads_Vault Tab
 * Adds the 'Leads_Vault' tab to the live Google Sheet (P22_Badge_Telemetry).
 * Sets headers, styles header row (Frozen Row 1, Emerald/Navy theme), and adjusts column widths.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';
const KEY_FILE = path.join(__dirname, '..', 'credentials', 'google-sa.json');

async function main() {
  console.log('[*] Connecting to Google Sheets API...');
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // 1. Get existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = meta.data.sheets.map(s => s.properties.title);
  console.log('[*] Current tabs in spreadsheet:', existingSheets);

  let leadsSheetId = null;
  const existingTab = meta.data.sheets.find(s => s.properties.title === 'Leads_Vault');

  if (existingTab) {
    leadsSheetId = existingTab.properties.sheetId;
    console.log('[+] Leads_Vault tab already exists with sheetId:', leadsSheetId);
  } else {
    console.log('[*] Creating "Leads_Vault" tab...');
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Leads_Vault',
                gridProperties: {
                  rowCount: 500,
                  columnCount: 10,
                  frozenRowCount: 1,
                },
                tabColor: {
                  red: 0.06,
                  green: 0.72,
                  blue: 0.51, // Emerald Green tab
                },
              },
            },
          },
        ],
      },
    });
    leadsSheetId = addRes.data.replies[0].addSheet.properties.sheetId;
    console.log('[+] Created Leads_Vault tab with sheetId:', leadsSheetId);
  }

  // 2. Set Row 1 Headers
  const headers = [
    'Timestamp (UTC)',
    'Staff Rep',
    'Client / Lead Name',
    'Agency / Prime Contractor',
    'Work Email',
    'Phone',
    'Procurement Scope / Interest',
    'Extracted Card Text / Notes',
    'Card Photo / Attachment',
    'Intake Source',
  ];

  console.log('[*] Updating Headers in Leads_Vault!A1:J1...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leads_Vault!A1:J1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [headers],
    },
  });

  // 3. Style Headers: Deep Navy (#0B192C) with Gold/White text, bold, centered
  console.log('[*] Styling Leads_Vault header row...');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: leadsSheetId,
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
              sheetId: leadsSheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 10,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.05,
                  green: 0.12,
                  blue: 0.22, // Deep Navy (#0D1F38)
                },
                horizontalAlignment: 'CENTER',
                textFormat: {
                  foregroundColor: {
                    red: 0.95,
                    green: 0.77,
                    blue: 0.25, // P-22 Gold
                  },
                  fontSize: 10,
                  bold: true,
                },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        // Auto dimension column widths for clean readability
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 1, // Timestamp
            },
            properties: { pixelSize: 180 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 1,
              endIndex: 2, // Staff Rep
            },
            properties: { pixelSize: 140 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 2,
              endIndex: 3, // Client Name
            },
            properties: { pixelSize: 180 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 3,
              endIndex: 4, // Agency
            },
            properties: { pixelSize: 220 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 4,
              endIndex: 5, // Email
            },
            properties: { pixelSize: 200 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 5,
              endIndex: 6, // Phone
            },
            properties: { pixelSize: 140 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 6,
              endIndex: 7, // Scope / Interest
            },
            properties: { pixelSize: 220 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 7,
              endIndex: 8, // Extracted OCR / Notes
            },
            properties: { pixelSize: 300 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 8,
              endIndex: 9, // Card Photo
            },
            properties: { pixelSize: 160 },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: leadsSheetId,
              dimension: 'COLUMNS',
              startIndex: 9,
              endIndex: 10, // Source
            },
            properties: { pixelSize: 180 },
            fields: 'pixelSize',
          },
        },
      ],
    },
  });

  console.log('[+] Leads_Vault tab created, configured, and styled successfully!');
}

main().catch(err => {
  console.error('[!] Setup error:', err);
  process.exit(1);
});
