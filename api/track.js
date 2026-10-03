/**
 * Telemetry Tracking Endpoint - /api/track
 * Receives frontend beacons, taps, and downloads.
 * Appends audit entries to Google Sheets via Service Account.
 * NIST AU-2 / OMB M-10-22 Compliant: Zero Cookies, Zero PII.
 */

const { appendTelemetryRow } = require('../lib/google-sheets');

// 1x1 transparent GIF buffer for pixel tracking fallbacks
const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function detectPlatform(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  if (/macintosh|mac os x/.test(ua)) return 'macOS';
  if (/windows/.test(ua)) return 'Windows';
  if (/linux/.test(ua)) return 'Linux';
  return 'Other';
}

module.exports = async function handler(req, res) {
  // Enable CORS for all frontends
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let payload = {};

    if (req.method === 'POST') {
      if (typeof req.body === 'string') {
        try {
          payload = JSON.parse(req.body);
        } catch {
          payload = { raw: req.body };
        }
      } else if (req.body && typeof req.body === 'object') {
        payload = req.body;
      }
    } else if (req.method === 'GET') {
      payload = req.query || {};
    }

    const userAgent = req.headers['user-agent'] || '';
    const platform = payload.platform || detectPlatform(userAgent);
    const rep = (payload.rep || req.query.rep || 'general').toLowerCase();
    const event = payload.event || req.query.event || 'page_view';
    const source = payload.source || req.query.source || 'direct';
    const details = payload.details || req.query.details || '';

    // Asynchronously log to Google Sheets
    await appendTelemetryRow({
      timestamp: new Date().toISOString(),
      rep,
      event,
      platform,
      source,
      details,
    });

    if (req.query.pixel === '1') {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.status(200).send(PIXEL_GIF);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[-] Error handling tracking beacon:', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
