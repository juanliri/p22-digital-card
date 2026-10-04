/**
 * P-22 CORP — Add and Style "Consultations" Tab in Google Sheets
 * Upgrades P22_Badge_Telemetry (1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0)
 * 
 * Features:
 * - Dedicated tab: 'Consultations'
 * - Headers: Timestamp, Staff Rep, Client Name, Agency / Prime, Work Email, Phone, Meeting Time (CST), Google Meet Link, Status, Notes
 * - P-22 Navy & Gold styling, frozen header row, zebra row striping, status data validation
 */

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

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  let consultSheetId = null;
  const existingTab = meta.data.sheets.find(s => s.properties.title === 'Consultations');

  if (existingTab) {
    consultSheetId = existingTab.properties.sheetId;
    console.log('[+] Consultations tab already exists with sheetId:', consultSheetId);
  } else {
    console.log('[*] Creating "Consultations" tab...');
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Consultations',
                gridProperties: {
                  rowCount: 500,
                  columnCount: 10,
                  frozenRowCount: 1,
                },
                tabColor: {
                  red: 0.95,
                  green: 0.77,
                  blue: 0.25, // Gold Tab
                },
              },
            },
          },
        ],
      },
    });
    consultSheetId = addRes.data.replies[0].addSheet.properties.sheetId;
    console.log('[+] Created Consultations tab with sheetId:', consultSheetId);
  }

  // Set Headers
  const headers = [
    'Timestamp (UTC)',
    'Staff Rep',
    'Client / Attendee Name',
    'Agency / Prime Contractor',
    'Work Email',
    'Phone',
    'Meeting Time (CST)',
    'Google Meet Link',
    'Status',
    'Procurement Scope / Notes',
  ];

  console.log('[*] Updating Headers in Consultations!A1:J1...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Consultations!A1:J1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [headers],
    },
  });

  // Apply Styling: Navy #0D192E with Gold #F1C40F text, Column widths, text wrap CLIP
  console.log('[*] Styling Consultations header row and column dimensions...');
  const requests = [
    {
      repeatCell: {
        range: {
          sheetId: consultSheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.05, green: 0.10, blue: 0.18 }, // #0D192E Navy
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              bold: true,
              fontSize: 10,
              foregroundColor: { red: 0.95, green: 0.77, blue: 0.25 }, // P-22 Gold
            },
            padding: { top: 6, bottom: 6, left: 8, right: 8 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)',
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: consultSheetId,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            wrapStrategy: 'CLIP',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              fontSize: 9,
              foregroundColor: { red: 0.08, green: 0.12, blue: 0.18 },
            },
          },
        },
        fields: 'userEnteredFormat(wrapStrategy,verticalAlignment,textFormat)',
      },
    },
    // Column widths
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 160 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 140 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 220 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 210 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 140 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 }, properties: { pixelSize: 240 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId: consultSheetId, dimension: 'COLUMNS', startIndex: 9, endIndex: 10 }, properties: { pixelSize: 260 }, fields: 'pixelSize' } },
    // Status Dropdown in Column I (index 8)
    {
      setDataValidation: {
        range: {
          sheetId: consultSheetId,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 8,
          endColumnIndex: 9,
        },
        rule: {
          condition: {
            type: 'ONE_OF_LIST',
            values: [
              { userEnteredValue: '🟢 Scheduled' },
              { userEnteredValue: '🟡 In Progress' },
              { userEnteredValue: '🔵 Completed' },
              { userEnteredValue: '🟣 Follow-Up / RFQ' },
              { userEnteredValue: '🔴 Rescheduled' },
              { userEnteredValue: '⚪ No Show' },
            ],
          },
          showCustomUi: true,
          strict: false,
        },
      },
    },
    // Zebra Striping
    {
      addBanding: {
        bandedRange: {
          range: {
            sheetId: consultSheetId,
            startRowIndex: 0,
            endRowIndex: 500,
            startColumnIndex: 0,
            endColumnIndex: 10,
          },
          rowProperties: {
            headerColor: { red: 0.05, green: 0.10, blue: 0.18 },
            firstBandColor: { red: 1.0, green: 1.0, blue: 1.0 },
            secondBandColor: { red: 0.96, green: 0.97, blue: 0.98 },
          },
        },
      },
    },
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: { requests },
  });

  console.log('[✓] Consultations tab successfully created and configured!');
  console.log('    Spreadsheet Link: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID);
}

main().catch(err => {
  console.error('[!] Error setting up Consultations tab:', err.message);
  process.exit(1);
});
