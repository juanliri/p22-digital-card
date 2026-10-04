/**
 * P-22 CORP — Wix CRM Dual-Stack Connector
 * Dispatches captured leads & consultation bookings directly into Wix CRM (p22corp.com).
 * 
 * Works alongside the Google Workspace engine so staff can manage leads from:
 * 1. Google Workspace (Google Sheets, Google Drive, Gmail, Google Calendar)
 * 2. Wix CRM (Wix Contacts, Wix Inbox, Wix Mobile App, Wix Automations)
 * 
 * Non-blocking execution ensures zero impact on card speed or expo reliability.
 */

const https = require('https');

/**
 * Split full name into first and last name
 */
function splitName(fullName) {
  if (!fullName) return { firstName: 'Attendee', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Sync lead to Wix CRM via Webhook or REST API
 */
async function syncLeadToWix(lead) {
  const webhookUrl = process.env.WIX_WEBHOOK_URL;
  const apiKey = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;

  if (!webhookUrl && !apiKey) {
    return {
      success: true,
      synced: false,
      message: 'Wix CRM sync idle (Set WIX_WEBHOOK_URL in Vercel to activate)',
    };
  }

  const { firstName, lastName } = splitName(lead.client_name || lead.name);
  const repName = lead.rep_name || lead.rep || 'General Staff';
  const agency = lead.client_agency || lead.agency || '';
  const email = lead.client_email || lead.email || '';
  const phone = lead.client_phone || lead.phone || '';
  const scope = lead.interest || lead.scope || 'Procurement & Logistics';
  const notes = lead.notes || lead.extracted_text || '';
  const photoUrl = lead.photo_url || '';

  const wixPayload = {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    company: agency,
    rep: repName,
    scope,
    notes,
    photoUrl,
    source: 'P-22 Digital Card (Expo 2026)',
    tags: ['Expo 2026', `Rep-${repName.replace(/\s+/g, '')}`, 'Digital Card'],
    timestamp: lead.timestamp || new Date().toISOString(),
  };

  // Method 1: Wix Automation Webhook (Simplest, native, zero-code inside Wix)
  if (webhookUrl) {
    try {
      const res = await postJson(webhookUrl, wixPayload);
      console.log(`[+] Successfully synced lead to Wix CRM Webhook for ${wixPayload.email || wixPayload.name}`);
      return { success: true, channel: 'wix_webhook', res };
    } catch (err) {
      console.warn('[-] Warning: Wix Webhook sync failed:', err.message);
      return { success: false, channel: 'wix_webhook', error: err.message };
    }
  }

  // Method 2: Wix Headless REST API
  if (apiKey && siteId) {
    try {
      const res = await postToWixApi(siteId, apiKey, wixPayload);
      console.log(`[+] Successfully synced lead to Wix Contacts API for ${wixPayload.email || wixPayload.name}`);
      return { success: true, channel: 'wix_api', res };
    } catch (err) {
      console.warn('[-] Warning: Wix API sync failed:', err.message);
      return { success: false, channel: 'wix_api', error: err.message };
    }
  }

  return { success: true, synced: false };
}

/**
 * Sync consultation booking to Wix CRM
 */
async function syncConsultationToWix(consult) {
  const webhookUrl = process.env.WIX_WEBHOOK_URL;
  if (!webhookUrl && !process.env.WIX_API_KEY) {
    return { success: true, synced: false };
  }

  const { firstName, lastName } = splitName(consult.client_name || consult.name);
  const repName = consult.rep_name || consult.rep || 'Pedro Felipe';

  const wixPayload = {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email: consult.client_email || consult.email || '',
    phone: consult.client_phone || consult.phone || '',
    company: consult.client_agency || consult.agency || '',
    rep: repName,
    meetingTime: consult.meeting_time || '',
    meetLink: consult.meet_link || '',
    topic: consult.topic || '15-Minute Executive Briefing',
    source: 'Executive Briefing Scheduler',
    tags: ['Expo 2026', 'Consultation Booked', `Rep-${repName.replace(/\s+/g, '')}`],
    timestamp: consult.timestamp || new Date().toISOString(),
  };

  if (webhookUrl) {
    try {
      const res = await postJson(webhookUrl, wixPayload);
      console.log(`[+] Successfully synced consultation to Wix CRM for ${wixPayload.email || wixPayload.name}`);
      return { success: true, channel: 'wix_webhook', res };
    } catch (err) {
      console.warn('[-] Warning: Wix consultation sync failed:', err.message);
      return { success: false, channel: 'wix_webhook', error: err.message };
    }
  }

  return { success: true, synced: false };
}

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const parsed = new URL(urlStr);

    const req = https.request(
      parsed,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 5000,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body });
          } else {
            reject(new Error(`Wix endpoint status ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Wix webhook request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

function postToWixApi(siteId, apiKey, contactData) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      info: {
        name: {
          first: contactData.firstName,
          last: contactData.lastName,
        },
        emails: contactData.email ? [{ email: contactData.email, tag: 'MAIN' }] : [],
        phones: contactData.phone ? [{ phone: contactData.phone, tag: 'MOBILE' }] : [],
        company: contactData.company,
        labelKeys: {
          items: ['custom.expo-2026'],
        },
      },
      allowDuplicates: true,
    });

    const req = https.request(
      'https://www.wixapis.com/contacts/v1/contacts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey,
          'wix-site-id': siteId,
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 5000,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body || '{}'));
          } else {
            reject(new Error(`Wix API status ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Wix API request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

module.exports = {
  syncLeadToWix,
  syncConsultationToWix,
};
