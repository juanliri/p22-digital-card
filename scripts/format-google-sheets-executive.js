/**
 * P-22 CORP — Executive Google Sheets Visual & Analytics Suite
 * Upgrades P22_Badge_Telemetry (1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0)
 * 
 * Enhancements:
 * 1. Leads_Vault:
 *    - Frozen Row 1 with Navy & P-22 Gold theme
 *    - Alternating row zebra striping (White / Soft Slate #F8FAFC)
 *    - Text wrapping set to CLIP on Column H (Extracted OCR) so rows stay clean & uniform
 *    - Column K added: "Lead Status" with colored data validation dropdowns
 * 2. Sheet1 (Raw Telemetry):
 *    - Frozen Row 1, Navy header, alternating row striping, clean column sizing
 * 3. Dashboard (Command Center):
 *    - KPI Scorecards with bold figures and percentage formats
 *    - Embedded Donut Chart (Activity by Representative)
 *    - Embedded Bar/Column Chart (Conversion Interactions)
 */

const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';
const KEY_FILE = path.join(__dirname, '..', 'credentials', 'google-sa.json');

async function main() {
  console.log('[*] Initializing Google Sheets API connection...');
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // Get current spreadsheet metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetMap = {};
  meta.data.sheets.forEach(s => {
    sheetMap[s.properties.title] = s.properties.sheetId;
  });

  console.log('[*] Available tabs:', sheetMap);

  const requests = [];

  // ==========================================================
  // 1. FORMAT LEADS_VAULT
  // ==========================================================
  if (sheetMap['Leads_Vault'] !== undefined) {
    const leadsSheetId = sheetMap['Leads_Vault'];
    console.log('[*] Expanding and formatting Leads_Vault tab (sheetId: ' + leadsSheetId + ')...');

    // Ensure Leads_Vault has at least 12 columns
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: leadsSheetId,
                gridProperties: {
                  columnCount: 12,
                },
              },
              fields: 'gridProperties.columnCount',
            },
          },
        ],
      },
    });

    // Make sure header has Column K: 'Lead Status'
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads_Vault!K1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['Lead Status']] },
    });

    // A. Freeze Row 1
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: leadsSheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    // B. Header Row Styling (Navy #0B192C with Gold #F1C40F text)
    requests.push({
      repeatCell: {
        range: {
          sheetId: leadsSheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 11,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.05, green: 0.10, blue: 0.18 }, // #0D192E Navy
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              bold: true,
              fontSize: 10,
              foregroundColor: { red: 0.95, green: 0.77, blue: 0.25 }, // P22 Gold
            },
            padding: { top: 6, bottom: 6, left: 8, right: 8 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)',
      },
    });

    // C. Set Text Wrap to CLIP for the entire sheet (especially Col H Extracted Card Text)
    requests.push({
      repeatCell: {
        range: {
          sheetId: leadsSheetId,
          startRowIndex: 1,
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
          },
        },
        fields: 'userEnteredFormat(wrapStrategy,verticalAlignment,textFormat)',
      },
    });

    // D. Column Widths
    const leadsColWidths = [
      { col: 0, width: 160 }, // Timestamp
      { col: 1, width: 140 }, // Staff Rep
      { col: 2, width: 180 }, // Client Name
      { col: 3, width: 220 }, // Agency / Prime
      { col: 4, width: 210 }, // Work Email
      { col: 5, width: 140 }, // Phone
      { col: 6, width: 220 }, // Scope / Interest
      { col: 7, width: 260 }, // Extracted OCR (Clipped)
      { col: 8, width: 160 }, // Card Photo
      { col: 9, width: 140 }, // Intake Source
      { col: 10, width: 160 }, // Lead Status Dropdown
    ];

    leadsColWidths.forEach(({ col, width }) => {
      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId: leadsSheetId,
            dimension: 'COLUMNS',
            startIndex: col,
            endIndex: col + 1,
          },
          properties: { pixelSize: width },
          fields: 'pixelSize',
        },
      });
    });

    // E. Data Validation Dropdown for Column K (Lead Status)
    requests.push({
      setDataValidation: {
        range: {
          sheetId: leadsSheetId,
          startRowIndex: 1,
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
    });
  }

  // ==========================================================
  // 2. FORMAT SHEET1 (Raw Telemetry)
  // ==========================================================
  if (sheetMap['Sheet1'] !== undefined) {
    const rawSheetId = sheetMap['Sheet1'];
    console.log('[*] Formatting Sheet1 (sheetId: ' + rawSheetId + ')...');

    // A. Freeze Row 1
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: rawSheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    // B. Header Row Styling
    requests.push({
      repeatCell: {
        range: {
          sheetId: rawSheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 8,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.08, green: 0.13, blue: 0.24 }, // Dark Navy
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: {
              bold: true,
              fontSize: 10,
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    });

    // C. Set Text Wrap to CLIP on raw telemetry
    requests.push({
      repeatCell: {
        range: {
          sheetId: rawSheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: 0,
          endColumnIndex: 8,
        },
        cell: {
          userEnteredFormat: {
            wrapStrategy: 'CLIP',
            verticalAlignment: 'MIDDLE',
            textFormat: { fontSize: 9 },
          },
        },
        fields: 'userEnteredFormat(wrapStrategy,verticalAlignment,textFormat)',
      },
    });

    // D. Column Widths for Sheet1
    const rawColWidths = [
      { col: 0, width: 170 }, // Timestamp
      { col: 1, width: 120 }, // Rep
      { col: 2, width: 160 }, // Event
      { col: 3, width: 140 }, // Device
      { col: 4, width: 140 }, // Source
      { col: 5, width: 140 }, // IP
      { col: 6, width: 240 }, // User Agent
      { col: 7, width: 160 }, // Referrer
    ];
    rawColWidths.forEach(({ col, width }) => {
      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId: rawSheetId,
            dimension: 'COLUMNS',
            startIndex: col,
            endIndex: col + 1,
          },
          properties: { pixelSize: width },
          fields: 'pixelSize',
        },
      });
    });
  }

  // ==========================================================
  // 3. FORMAT DASHBOARD TAB & ADD CHARTS
  // ==========================================================
  if (sheetMap['Dashboard'] !== undefined) {
    const dashboardSheetId = sheetMap['Dashboard'];
    console.log('[*] Enhancing Dashboard tab (sheetId: ' + dashboardSheetId + ')...');

    // Update numbers & percentages format
    requests.push({
      repeatCell: {
        range: {
          sheetId: dashboardSheetId,
          startRowIndex: 2,
          endRowIndex: 20,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: 'NUMBER', pattern: '#,##0' },
            horizontalAlignment: 'RIGHT',
          },
        },
        fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
      },
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId: dashboardSheetId,
          startRowIndex: 2,
          endRowIndex: 20,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: 'PERCENT', pattern: '0.0%' },
            horizontalAlignment: 'RIGHT',
          },
        },
        fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
      },
    });

    // Set Column Widths for Dashboard
    const dashColWidths = [
      { col: 0, width: 280 }, // Metric Name
      { col: 1, width: 140 }, // Count
      { col: 2, width: 140 }, // % of Total
      { col: 3, width: 280 }, // Benchmark / Notes
    ];
    dashColWidths.forEach(({ col, width }) => {
      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId: dashboardSheetId,
            dimension: 'COLUMNS',
            startIndex: col,
            endIndex: col + 1,
          },
          properties: { pixelSize: width },
          fields: 'pixelSize',
        },
      });
    });

    // Add Embedded Chart 1: Donut Chart - Rep Distribution
    requests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Rep Activity Distribution',
            pieChart: {
              legendPosition: 'RIGHT_LEGEND',
              pieHole: 0.45, // Donut style
              domain: {
                sourceRange: {
                  sources: [
                    {
                      sheetId: dashboardSheetId,
                      startRowIndex: 15,
                      endRowIndex: 20,
                      startColumnIndex: 0,
                      endColumnIndex: 1,
                    },
                  ],
                },
              },
              series: {
                sourceRange: {
                  sources: [
                    {
                      sheetId: dashboardSheetId,
                      startRowIndex: 15,
                      endRowIndex: 20,
                      startColumnIndex: 1,
                      endColumnIndex: 2,
                    },
                  ],
                },
              },
            },
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: dashboardSheetId,
                rowIndex: 1,
                columnIndex: 5,
              },
              offsetXPixels: 10,
              offsetYPixels: 10,
              widthPixels: 460,
              heightPixels: 300,
            },
          },
        },
      },
    });

    // Add Embedded Chart 2: Column Chart - Key Conversions
    requests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Key Conversion Interactions',
            basicChart: {
              chartType: 'COLUMN',
              legendPosition: 'NO_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Interaction Type' },
                { position: 'LEFT_AXIS', title: 'Total Actions' },
              ],
              domains: [
                {
                  domain: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: dashboardSheetId,
                          startRowIndex: 8,
                          endRowIndex: 13,
                          startColumnIndex: 0,
                          endColumnIndex: 1,
                        },
                      ],
                    },
                  },
                },
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: dashboardSheetId,
                          startRowIndex: 8,
                          endRowIndex: 13,
                          startColumnIndex: 1,
                          endColumnIndex: 2,
                        },
                      ],
                    },
                  },
                  targetAxis: 'LEFT_AXIS',
                },
              ],
            },
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: dashboardSheetId,
                rowIndex: 15,
                columnIndex: 5,
              },
              offsetXPixels: 10,
              offsetYPixels: 10,
              widthPixels: 460,
              heightPixels: 300,
            },
          },
        },
      },
    });
  }

  // Execute all batch requests
  console.log('[*] Executing ' + requests.length + ' styling and chart requests...');
  const batchRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: { requests },
  });

  console.log('[✓] Google Sheet successfully styled with executive aesthetics!');
  console.log('    Spreadsheet Link: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID);
}

main().catch(err => {
  console.error('[!] Error executing sheet formatting:', err.message);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
