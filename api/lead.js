/**
 * P-22 Corp Digital Card - Lead Capture Vault Endpoint
 * /api/lead
 *
 * Ingests attendee contacts from:
 * 1. Public Digital Card - Step 2 Reciprocal Contact Exchange
 * 2. Public Fast-Track RFQ Form
 * 3. Physical Business Card / Badge OCR Scan Tool
 * 4. Staff Setup Hub - Expo Lead Vault Manual/Batch Intake
 *
 * Appends directly to Google Sheets 'Leads_Vault' tab.
 */

const { appendLeadRow } = require('../lib/google-sheets');
const { notifyStaffOfLead } = require('../lib/notifications');

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    let payload = {};
    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body);
      } catch (e) {
        payload = { raw: req.body };
      }
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body;
    }

    // Support both single lead object or array of leads for batch offline sync
    const leads = Array.isArray(payload.leads) ? payload.leads : [payload];
    const results = [];

    const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim() || 'unknown';

    for (const item of leads) {
      const sid = item.sid || payload.sid || 'anon';
      const baseSource = item.source || 'Digital Card Exchange';
      const leadEntry = {
        timestamp: item.timestamp || new Date().toISOString(),
        rep_name: item.rep_name || item.rep || 'General Staff',
        client_name: item.client_name || item.name || '',
        client_agency: item.client_agency || item.agency || '',
        client_website: item.client_website || item.website || '',
        client_email: item.client_email || item.email || '',
        client_phone: item.client_phone || item.phone || '',
        interest: item.interest || item.scope || 'Procurement & Logistics Coordination',
        notes: item.notes || item.extracted_text || item.raw_ocr || '',
        photo_url: item.photo_url || item.card_photo || '',
        source: `${baseSource} [IP: ${clientIp} | ${sid}]`,
      };

      // Only append if at least name, email, phone, agency, or notes are present
      if (
        leadEntry.client_name ||
        leadEntry.client_email ||
        leadEntry.client_phone ||
        leadEntry.client_agency ||
        leadEntry.notes
      ) {
        const result = await appendLeadRow(leadEntry);
        results.push(result);

        // Dispatch instant smartphone / inbox notification to assigned staff
        try {
          await notifyStaffOfLead(leadEntry);
        } catch (notifErr) {
          console.warn('[-] Notification warning (non-blocking):', notifErr.message);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      message: 'Contact successfully verified and saved.',
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[-] Error processing /api/lead:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'Failed to process lead into vault',
      details: err.message,
    });
  }
};
