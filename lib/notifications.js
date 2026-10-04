/**
 * P-22 CORP — Executive Notification Dispatcher
 * Dispatches instant smartphone & desktop alerts to staff members upon:
 * 1. New Inbound Lead / Contact Exchange (Step 2 or Card Scan)
 * 2. 15-Minute Consultation / Executive Briefing Booked
 *
 * Supported delivery channels:
 * - Resend API (via process.env.RESEND_API_KEY)
 * - Google Apps Script / Custom Webhook (via process.env.NOTIFICATION_WEBHOOK)
 * - Safe fallback with full telemetry logging
 */

const https = require('https');

const STAFF_EMAILS = {
  pedro: 'pfelipe@p22corp.com',
  eduardo: 'elopez@p22corp.com',
  marleni: 'mmendez@p22corp.com',
  bids: 'bids@p22corp.com',
  logistics: 'logistics@p22corp.com',
};

const DEFAULT_ALERT_INBOX = 'bids@p22corp.com';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0';

function resolveStaffEmail(repName) {
  if (!repName) return DEFAULT_ALERT_INBOX;
  const lower = String(repName).toLowerCase();
  for (const [key, email] of Object.entries(STAFF_EMAILS)) {
    if (lower.includes(key)) return email;
  }
  return DEFAULT_ALERT_INBOX;
}

/**
 * Format executive HTML email template for new lead / exchange
 */
function buildLeadEmailHtml(lead) {
  const repName = lead.rep_name || lead.rep || 'General Staff';
  const clientName = lead.client_name || lead.name || 'Anonymous Attendee';
  const agency = lead.client_agency || lead.agency || 'Not Specified';
  const email = lead.client_email || lead.email || 'N/A';
  const phone = lead.client_phone || lead.phone || 'N/A';
  const scope = lead.interest || lead.scope || 'Procurement & Logistics Coordination';
  const notes = lead.notes || lead.extracted_text || lead.raw_ocr || 'None';
  const source = lead.source || 'Digital Card Step 2 Exchange';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Lead Captured - P-22 Corp</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #080f1d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0d192e; border: 1px solid rgba(241, 196, 15, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 30px; background: linear-gradient(135deg, #0b1526, #13223f); border-bottom: 2px solid #f1c40f;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #f1c40f; text-transform: uppercase;">P-22 CORP &bull; LEAD INTAKE VAULT</div>
              <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff;">🚨 New Contact Exchange Captured</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Alert Banner -->
    <tr>
      <td style="padding: 14px 30px; background-color: rgba(241, 196, 15, 0.08); border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #e2e8f0;">
        Assigned Representative: <strong style="color: #f1c40f;">${repName}</strong> &bull; Source: <em>${source}</em>
      </td>
    </tr>
    <!-- Lead Details -->
    <tr>
      <td style="padding: 24px 30px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size: 14px;">
          <tr>
            <td width="35%" style="color: #94a3b8; font-weight: 600;">Client / Lead:</td>
            <td style="color: #ffffff; font-weight: 700; font-size: 16px;">${clientName}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-weight: 600;">Agency / Prime:</td>
            <td style="color: #f1c40f; font-weight: 600;">${agency}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-weight: 600;">Work Email:</td>
            <td><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-weight: 600;">Direct Phone:</td>
            <td><a href="tel:${cleanPhone}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">${phone}</a></td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-weight: 600; vertical-align: top;">Procurement Scope:</td>
            <td style="color: #ffffff;">${scope}</td>
          </tr>
          ${notes && notes !== 'None' ? `
          <tr>
            <td style="color: #94a3b8; font-weight: 600; vertical-align: top;">Notes / OCR Text:</td>
            <td style="color: #cbd5e1; font-size: 12px; background-color: rgba(255,255,255,0.04); padding: 10px; border-radius: 8px; font-family: monospace;">${notes.replace(/\n/g, '<br>')}</td>
          </tr>
          ` : ''}
        </table>

        <!-- Quick Action Buttons -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
          <tr>
            ${cleanPhone && cleanPhone !== 'N/A' ? `
            <td style="padding-right: 8px;">
              <a href="tel:${cleanPhone}" style="display: block; text-align: center; background-color: #f1c40f; color: #080f1d; padding: 12px 18px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px;">📞 Click to Call</a>
            </td>
            ` : ''}
            ${email && email !== 'N/A' ? `
            <td style="padding-left: 8px;">
              <a href="mailto:${email}?subject=Follow-Up%20from%20P-22%20Corp%20-%20${encodeURIComponent(repName)}" style="display: block; text-align: center; background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; padding: 12px 18px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px;">✉️ Reply via Email</a>
            </td>
            ` : ''}
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 30px; background-color: #081120; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 11px; color: #64748b;">
        Recorded live in <a href="${SHEET_URL}" style="color: #f1c40f; text-decoration: none;">P22_Badge_Telemetry on Google Sheets</a> &bull; P-22 Corp Construction Material Solutions LLC
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Dispatch an email notification to the assigned staff member
 */
async function notifyStaffOfLead(lead) {
  const recipient = resolveStaffEmail(lead.rep_name || lead.rep);
  const clientName = lead.client_name || lead.name || 'Attendee';
  const agency = lead.client_agency || lead.agency || 'New Agency';
  const subject = `🚨 New Expo Contact: ${clientName} (${agency}) - ${lead.rep_name || 'Staff'}`;
  const html = buildLeadEmailHtml(lead);

  console.log(`[*] Dispatching lead notification to: ${recipient} | Subject: "${subject}"`);

  // Channel 1: Resend API (if configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend({
        to: recipient,
        cc: DEFAULT_ALERT_INBOX,
        subject,
        html,
      });
      return { success: true, channel: 'resend', res };
    } catch (err) {
      console.warn('[-] Resend dispatch failed:', err.message);
    }
  }

  // Channel 2: Custom Notification Webhook (Google Apps Script or Zapier/Make)
  if (process.env.NOTIFICATION_WEBHOOK) {
    try {
      const res = await sendViaWebhook(process.env.NOTIFICATION_WEBHOOK, {
        to: recipient,
        cc: DEFAULT_ALERT_INBOX,
        subject,
        html,
        lead,
      });
      return { success: true, channel: 'webhook', res };
    } catch (err) {
      console.warn('[-] Webhook dispatch failed:', err.message);
    }
  }

  // Log fallback
  return {
    success: true,
    channel: 'logged_only',
    message: `Lead recorded. To enable direct email dispatch from Vercel, set RESEND_API_KEY or use Google Sheet Apps Script trigger.`,
    recipient,
  };
}

function sendViaResend({ to, cc, subject, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: 'P-22 Lead Vault <notifications@p22corp.com>',
      to: [to],
      cc: cc && cc !== to ? [cc] : undefined,
      subject,
      html,
    });

    const req = https.request(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body || '{}'));
          } else {
            reject(new Error(`Resend API returned status ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function sendViaWebhook(webhookUrl, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const parsed = new URL(webhookUrl);

    const req = https.request(
      parsed,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve(body));
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = {
  resolveStaffEmail,
  buildLeadEmailHtml,
  notifyStaffOfLead,
};
