/**
 * P-22 CORP — Live Google Sheets & Telemetry Backup Engine
 * 
 * Fetches all tabs from the master Google Sheet (1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0):
 * - Sheet1 (Scan Telemetry)
 * - Leads_Vault (Attendee Contacts & Card References)
 * - Consultations (15-Minute Briefings)
 * - Dashboard (Calculated KPIs)
 * 
 * Exports:
 * 1. Complete raw JSON dump: backups/live-sheets-backup-<timestamp>.json
 * 2. Dedicated CSV files for each tab: backups/csv/<timestamp>/<tab_name>.csv
 * 3. Mirrors all backups to secondary drive F: (if connected)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';
const KEY_FILE = path.join(__dirname, '..', 'credentials', 'google-sa.json');
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');
const F_DRIVE_BACKUP = 'F:\\P22-Digital-Card-Backup\\backups';

async function runLiveBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  console.log('================================================================');
  console.log(` P-22 CORP — LIVE GOOGLE SHEETS BACKUP [${new Date().toLocaleString()}]`);
  console.log('================================================================\n');

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const csvDir = path.join(BACKUPS_DIR, 'csv', timestamp);
  fs.mkdirSync(csvDir, { recursive: true });

  console.log('[*] Authenticating with Google Sheets API...');
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log(`[*] Fetching spreadsheet metadata for ID: ${SPREADSHEET_ID}...`);
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = (meta.data.sheets || []).map(s => s.properties.title);
  console.log(`[+] Discovered ${sheetNames.length} tabs: ${sheetNames.join(', ')}`);

  const fullArchive = {
    backup_timestamp: new Date().toISOString(),
    spreadsheet_id: SPREADSHEET_ID,
    tabs: {}
  };

  for (const title of sheetNames) {
    console.log(`[*] Downloading tab: "${title}"...`);
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${title}!A1:Z5000`,
      });

      const rows = res.data.values || [];
      fullArchive.tabs[title] = {
        rowCount: rows.length,
        data: rows
      };

      // Export CSV
      const csvLines = rows.map(r => 
        r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      );
      const csvPath = path.join(csvDir, `${title}.csv`);
      fs.writeFileSync(csvPath, csvLines.join('\r\n'), 'utf8');
      console.log(`    -> Saved CSV: ${path.relative(process.cwd(), csvPath)} (${rows.length} rows)`);

    } catch (tabErr) {
      console.warn(`[-] Error downloading tab ${title}:`, tabErr.message);
      fullArchive.tabs[title] = { error: tabErr.message };
    }
  }

  // Save Full JSON
  const jsonPath = path.join(BACKUPS_DIR, `live-sheets-backup-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(fullArchive, null, 2), 'utf8');
  console.log(`\n[+] Master JSON Snapshot saved: ${path.relative(process.cwd(), jsonPath)}`);

  // Mirror to Drive F: if available
  try {
    if (fs.existsSync('F:\\')) {
      console.log(`[*] Mirroring backup to F: drive (${F_DRIVE_BACKUP})...`);
      if (!fs.existsSync(F_DRIVE_BACKUP)) {
        fs.mkdirSync(F_DRIVE_BACKUP, { recursive: true });
      }
      try {
        execSync(`robocopy "${BACKUPS_DIR}" "${F_DRIVE_BACKUP}" /MIR /R:1 /W:1`, { stdio: 'ignore' });
        console.log('[+] Dual-drive mirror complete on F: drive.');
      } catch (rErr) {
        if (typeof rErr.status === 'number' && rErr.status <= 7) {
          console.log(`[+] Dual-drive mirror complete on F: drive (Robocopy status: ${rErr.status}).`);
        } else {
          console.warn('[!] Note on mirror copy:', rErr.message);
        }
      }
    } else {
      console.log('[!] Drive F: not detected. Local backup saved safely.');
    }
  } catch (mirrorErr) {
    console.warn('[!] Note on mirror copy:', mirrorErr.message);
  }

  console.log('\n================================================================');
  console.log(' BACKUP COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
}

runLiveBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
