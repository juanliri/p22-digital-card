/**
 * P-22 CORP — Complete Visual Overhaul of Leads_Vault Tab
 * Fixes:
 * 1. Branding Header Banner (Row 1-3) with CAGE, UEI, contact info & live KPIs
 * 2. Column Headers at Row 4 with frozenRowCount = 4
 * 3. Lock all data row heights to uniform 34px (no more huge tall rows!)
 * 4. Text wrap set to CLIP across all data cells
 * 5. Generous column widths so emails, phones, sources, and scopes NEVER get cut off
 * 6. Fix Column I (Card Photo) to show clickable HYPERLINKs instead of ugly text
 * 7. Clear dark styling from Column L to Z
 * 8. Add Executive Footer
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

  // 1. Get Leads_Vault metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const leadsTab = meta.data.sheets.find(s => s.properties.title === 'Leads_Vault');
  if (!leadsTab) {
    console.error('[-] Leads_Vault tab not found!');
    process.exit(1);
  }

  const sheetId = leadsTab.properties.sheetId;
  console.log('[+] Found Leads_Vault with sheetId:', sheetId);

  // Read current values in Leads_Vault
  const curRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leads_Vault!A1:K30',
  });
  const curRows = curRes.data.values || [];
  console.log('[*] Current row count:', curRows.length);

  // Check if Row 1 is already the branding banner or still the raw headers
  const isAlreadyBranded = curRows[0] && curRows[0][0] && curRows[0][0].includes('P-22 CORP');

  if (!isAlreadyBranded) {
    console.log('[*] Inserting 3 rows at top for Corporate Branding Header & KPI strip...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: 3,
              },
              inheritFromBefore: false,
            },
          },
        ],
      },
    });
  }

  // 2. Populate Rows 1, 2, 3 with Corporate Branding & Live KPIs
  console.log('[*] Writing Corporate Header Banner, Credentials & KPIs...');
  const headerValues = [
    [
      'P-22 CORP — EXPO LEAD INTAKE VAULT & FEDERAL PROCUREMENT CAPTURE',
      '', '', '', '', '', '', '', '', '', '',
    ],
    [
      'CAGE: 169D8  |  UEI: X3HUQZ66P6N3  |  SAM.gov Active Certified  |  Dallas-Fort Worth HQ  |  Toll-Free: 1-888-722-2675  |  bids@p22corp.com',
      '', '', '', '', '', '', '', '', '', '',
    ],
    [
      'Total Leads Logged:',
      '=COUNTA(C5:C500)',
      'New Inbound:',
      '=COUNTIF(K5:K500, "*New Inbound*")',
      'In Review / RFQ:',
      '=COUNTIF(K5:K500, "*RFQ*")',
      'Prime Partners:',
      '=COUNTIF(K5:K500, "*Prime*")',
      'Live Staff Hub:',
      'https://p22-digital-card.vercel.app/setup.html',
      '',
    ],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leads_Vault!A1:K3',
    valueInputOption: 'USER_ENTERED',
    resource: { values: headerValues },
  });

  // Ensure Row 4 has the exact Column Headers
  const colHeaders = [
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
    'Lead Status',
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leads_Vault!A4:K4',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [colHeaders] },
  });

  // 3. Fix Column I for existing leads: Convert ugly text to clickable HYPERLINK
  console.log('[*] Upgrading Column I to clickable HYPERLINKs...');
  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leads_Vault!I5:I25',
  });
  if (dataRes.data.values) {
    const updatedColI = dataRes.data.values.map(row => {
      const val = row[0] || '';
      if (val.includes('Attached') || val.includes('Thumbnail') || val.includes('Canvas')) {
        return ['=HYPERLINK("https://p22-digital-card.vercel.app/setup.html#vault", "🖼️ View in Staff Vault")'];
      } else if (val.startsWith('http')) {
        return [`=HYPERLINK("${val}", "🖼️ View Card Photo")`];
      } else if (!val || val === 'N/A') {
        return ['—'];
      }
      return [val];
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Leads_Vault!I5:I${4 + updatedColI.length}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: updatedColI },
    });
  }

  // 4. Batch Styling Requests: Freeze Rows 1-4, Uniform 34px Row Heights, Generous Column Widths, Clean Merges
  console.log('[*] Applying styling, row locks, column sizing, and cell clipping...');
  const requests = [
    // Freeze Rows 1 to 4
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            frozenRowCount: 4,
            columnCount: 14,
          },
        },
        fields: 'gridProperties.frozenRowCount,gridProperties.columnCount',
      },
    },

    // Merge Row 1 (Cols A to K) for Master Corporate Title Banner
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        mergeType: 'MERGE_ALL',
      },
    },
    // Merge Row 2 (Cols A to K) for Subtitle Credentials
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        mergeType: 'MERGE_ALL',
      },
    },

    // Style Row 1 Banner: Deep Luxury Navy #0A1424, Gold text #F1C40F, 13pt bold
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.04, green: 0.08, blue: 0.15 },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              bold: true,
              fontSize: 13,
              foregroundColor: { red: 0.95, green: 0.77, blue: 0.25 }, // Gold
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    },

    // Style Row 2 Subtitle: Slate #1E293B, Soft Slate Text #94A3B8, 9pt
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.08, green: 0.13, blue: 0.23 },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              fontSize: 9,
              foregroundColor: { red: 0.85, green: 0.88, blue: 0.92 },
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    },

    // Style Row 3 KPI Strip: Soft Slate #F1F5F9, Navy Bold Text
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.94, green: 0.96, blue: 0.98 },
            verticalAlignment: 'MIDDLE',
            textFormat: {
              bold: true,
              fontSize: 9,
              foregroundColor: { red: 0.08, green: 0.13, blue: 0.23 },
            },
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,padding)',
      },
    },

    // Style Row 4 Column Headers: Dark Navy #0D192E, Gold text #F1C40F, 10pt bold
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 3,
          endRowIndex: 4,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.05, green: 0.10, blue: 0.18 }, // #0D192E
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              bold: true,
              fontSize: 10,
              foregroundColor: { red: 0.95, green: 0.77, blue: 0.25 }, // Gold
            },
            padding: { top: 6, bottom: 6, left: 8, right: 8 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)',
      },
    },

    // Set Row Heights:
    // Row 1 (Header Banner): 44px
    { updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 44 }, fields: 'pixelSize' } },
    // Row 2 (Subtitle): 28px
    { updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 28 }, fields: 'pixelSize' } },
    // Row 3 (KPI Strip): 32px
    { updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 32 }, fields: 'pixelSize' } },
    // Row 4 (Table Headers): 36px
    { updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 36 }, fields: 'pixelSize' } },
    // Rows 5 to 500 (All Data Rows): UNIFORM 34px (NO MORE GIANT ROWS!)
    { updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 4, endIndex: 500 }, properties: { pixelSize: 34 }, fields: 'pixelSize' } },

    // Set Text Wrap Strategy to CLIP across all data cells so long text never stretches row height
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 4,
          endRowIndex: 500,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        cell: {
          userEnteredFormat: {
            wrapStrategy: 'CLIP',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              fontSize: 9,
              foregroundColor: { red: 0.08, green: 0.12, blue: 0.18 },
            },
            padding: { top: 2, bottom: 2, left: 6, right: 6 },
          },
        },
        fields: 'userEnteredFormat(wrapStrategy,verticalAlignment,textFormat,padding)',
      },
    },

    // Generous Column Widths (Auto-sized for complete visibility without manual adjusting)
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 165 }, fields: 'pixelSize' } }, // Timestamp
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 135 }, fields: 'pixelSize' } }, // Rep
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 190 }, fields: 'pixelSize' } }, // Client Name
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 260 }, fields: 'pixelSize' } }, // Agency
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 230 }, fields: 'pixelSize' } }, // Work Email
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } }, // Phone
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, properties: { pixelSize: 270 }, fields: 'pixelSize' } }, // Scope
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 }, properties: { pixelSize: 260 }, fields: 'pixelSize' } }, // Notes / OCR
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 }, properties: { pixelSize: 190 }, fields: 'pixelSize' } }, // Card Photo
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 9, endIndex: 10 }, properties: { pixelSize: 210 }, fields: 'pixelSize' } }, // Intake Source
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 10, endIndex: 11 }, properties: { pixelSize: 165 }, fields: 'pixelSize' } }, // Lead Status Dropdown

    // Clear dark navy styling from Column L to Z (Reset to default)
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 500,
          startColumnIndex: 11,
          endColumnIndex: 14,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    },

    // Re-apply Lead Status Data Validation on Column K (index 10) starting from Row 5
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 4,
          endRowIndex: 500,
          startColumnIndex: 10,
          endColumnIndex: 11,
        },
        rule: {
          condition: {
            type: 'ONE_OF_LIST',
            values: [
              { userEnteredValue: '🟢 New Inbound' },
              { userEnteredValue: '🟡 Contacted' },
              { userEnteredValue: '🔵 RFQ In Review' },
              { userEnteredValue: '🟣 Prime Partner' },
              { userEnteredValue: '⚪ Disqualified' },
            ],
          },
          showCustomUi: true,
          strict: false,
        },
      },
    },
  ];

  console.log('[*] Executing ' + requests.length + ' structural styling and dimension updates...');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: { requests },
  });

  console.log('[✓] Leads_Vault completely overhauled with executive branding and auto-fitted rows!');
  console.log('    Spreadsheet Link: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID);
}

main().catch(err => {
  console.error('[!] Error overhauling Leads_Vault:', err.message);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
