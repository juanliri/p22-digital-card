/**
 * P-22 Badge Telemetry - Google Sheets Client
 * Handles server-side telemetry logging directly to Google Sheets API.
 * ZERO frontend key exposure. ZERO cookies (OMB M-10-22 / NIST SP 800-171 AU-2 compliant).
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

let sheetsInstance = null;

/**
 * Obtain authenticated Google Sheets client using Service Account credentials.
 */
function getSheetsClient() {
  if (sheetsInstance) {
    return sheetsInstance;
  }

  let credentials = null;

  // 1. Try environment variable (Production on Vercel)
  if (process.env.GOOGLE_SERVICE_KEY) {
    try {
      const raw = process.env.GOOGLE_SERVICE_KEY.trim();
      credentials = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      console.error('[!] Failed to parse GOOGLE_SERVICE_KEY from environment:', err.message);
    }
  }

  // 2. Fallback to local credentials file (Development)
  if (!credentials) {
    const keyPath = path.join(process.cwd(), 'credentials', 'google-sa.json');
    if (fs.existsSync(keyPath)) {
      try {
        credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      } catch (err) {
        console.error('[!] Failed to read local credentials file:', err.message);
      }
    }
  }

  if (!credentials) {
    console.warn('[!] No Google Service Account credentials available.');
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsInstance = google.sheets({ version: 'v4', auth });
  return sheetsInstance;
}

/**
 * Ensure headers exist on the sheet.
 */
async function initSheetHeaders(spreadsheetId) {
  const sheets = getSheetsClient();
  if (!sheets || !spreadsheetId) return;

  const headers = ['Timestamp', 'Rep', 'Event', 'Platform', 'Source', 'Details'];
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:F1',
    });
    if (!existing.data.values || existing.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:F1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [headers] },
      });
      console.log('[+] Initialized sheet headers');
    }
  } catch (err) {
    console.error('[-] Error checking/initializing headers:', err.message);
  }
}

const DEFAULT_SPREADSHEET_ID = '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';

function getSpreadsheetId(override) {
  if (override) return override;
  if (process.env.GOOGLE_SHEET_ID) return process.env.GOOGLE_SHEET_ID;
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GOOGLE_SHEET_ID=["']?([^"'\r\n]+)/);
      if (match) return match[1];
    }
  } catch (e) {}
  return DEFAULT_SPREADSHEET_ID;
}

/**
 * Append a telemetry row to the active Google Sheet.
 * @param {Object} entry
 * @param {string} entry.timestamp - ISO 8601 string
 * @param {string} entry.rep - 'pedro' | 'eduardo' | 'marleni' | 'bids' | 'logistics' | 'system'
 * @param {string} entry.event - 'badge_view' | 'dial' | 'email' | 'vcard_saved' | 'wallet_install' | etc.
 * @param {string} entry.platform - 'iOS' | 'Android' | 'Desktop'
 * @param {string} entry.source - 'nfc' | 'expo_qr' | 'email_sig' | 'direct'
 * @param {string|object} entry.details - Extra metadata (transient, zero PII)
 * @param {string} [entry.spreadsheetId] - Optional override for GOOGLE_SHEET_ID
 */
async function appendTelemetryRow(entry) {
  const spreadsheetId = getSpreadsheetId(entry.spreadsheetId);
  if (!spreadsheetId) {
    console.warn('[!] GOOGLE_SHEET_ID is not configured. Telemetry skipped.');
    return { success: false, reason: 'missing_spreadsheet_id' };
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    console.warn('[!] Google Sheets client unavailable. Telemetry skipped.');
    return { success: false, reason: 'missing_credentials' };
  }

  const timestamp = entry.timestamp || new Date().toISOString();
  const rep = (entry.rep || 'unknown').toLowerCase();
  const event = entry.event || 'view';
  const platform = entry.platform || 'unknown';
  const source = entry.source || 'direct';
  const details = typeof entry.details === 'object' ? JSON.stringify(entry.details) : String(entry.details || '');

  const row = [timestamp, rep, event, platform, source, details];

  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row],
      },
    });

    return {
      success: true,
      updatedRange: res.data.updates ? res.data.updates.updatedRange : null,
      updatedRows: res.data.updates ? res.data.updates.updatedRows : 1,
    };
  } catch (err) {
    console.error('[-] Error appending to Google Sheets:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Append an attendee / expo lead to the 'Leads_Vault' tab.
 * @param {Object} lead
 * @param {string} lead.timestamp
 * @param {string} lead.rep
 * @param {string} lead.client_name
 * @param {string} lead.client_agency
 * @param {string} lead.client_email
 * @param {string} lead.client_phone
 * @param {string} lead.interest
 * @param {string} lead.notes - OCR text or staff notes
 * @param {string} lead.photo_url - Thumbnail or attachment status
 * @param {string} lead.source - 'Step 2 Reciprocal Exchange' | 'Card Scan / OCR' | etc.
 */
async function appendLeadRow(lead) {
  const spreadsheetId = getSpreadsheetId(lead.spreadsheetId);
  if (!spreadsheetId) {
    console.warn('[!] GOOGLE_SHEET_ID is not configured. Lead append skipped.');
    return { success: false, reason: 'missing_spreadsheet_id' };
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    console.warn('[!] Google Sheets client unavailable. Lead append skipped.');
    return { success: false, reason: 'missing_credentials' };
  }

  const timestamp = lead.timestamp || new Date().toISOString();
  const rep = lead.rep_name || lead.rep || 'General Staff';
  const name = lead.client_name || lead.name || '';
  const agencyRaw = lead.client_agency || lead.agency || '';
  const website = lead.client_website || lead.website || '';
  const agency = website ? `${agencyRaw} (${website})` : agencyRaw;
  const email = lead.client_email || lead.email || '';
  let phone = lead.client_phone || lead.phone || '';
  if (typeof phone === 'string' && (phone.startsWith('+') || phone.startsWith('='))) {
    phone = "'" + phone;
  }
  const scope = lead.interest || lead.scope || 'Digital Card Exchange';
  let notes = lead.notes || lead.extracted_text || lead.raw_ocr || '';
  if (website && !notes.includes(website)) {
    notes = `[Website: ${website}]\n${notes}`.trim();
  }
  let photo = lead.photo_url || lead.card_photo || '';
  if (photo && photo.startsWith('http')) {
    photo = `=IMAGE("${photo}")`;
  } else if (photo && photo.startsWith('data:image')) {
    photo = 'Attached Card (Embedded Thumbnail)';
  } else if (!photo) {
    photo = 'N/A';
  }
  const source = lead.source || 'Public Digital Card';

  const row = [timestamp, rep, name, agency, email, phone, scope, notes, photo, source];

  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Leads_Vault!A:J',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row],
      },
    });

    return {
      success: true,
      updatedRange: res.data.updates ? res.data.updates.updatedRange : null,
      updatedRows: res.data.updates ? res.data.updates.updatedRows : 1,
    };
  } catch (err) {
    console.error('[-] Error appending lead to Leads_Vault:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getSheetsClient,
  initSheetHeaders,
  appendTelemetryRow,
  appendLeadRow,
};

