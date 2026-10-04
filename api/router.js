/**
 * P-22 Edge Exchange Router - /api/router
 * Inspects incoming visitor, detects platform, logs NIST AU-2 event to Google Sheets,
 * and executes instantaneous 302 Redirect.
 * ZERO frontend key exposure. ZERO cookies.
 */

const { appendTelemetryRow } = require('../lib/google-sheets');

const PASS_MAP = {
  pedro: {
    apple: '/assets/passes/pedro-felipe.pkpass',
    card: '/pedro',
  },
  eduardo: {
    apple: '/assets/passes/eduardo-lopez.pkpass',
    card: '/eduardo',
  },
  marleni: {
    apple: '/assets/passes/marleni-mendez.pkpass',
    card: '/marleni',
  },
  bids: {
    apple: '/assets/passes/bids-p22.pkpass',
    card: '/bids',
  },
  logistics: {
    apple: '/assets/passes/logistics-p22.pkpass',
    card: '/logistics',
  },
  juan: {
    apple: '/assets/passes/pedro-felipe.pkpass',
    card: '/badge?rep=pedro',
  },
  jliriano: {
    apple: '/assets/passes/pedro-felipe.pkpass',
    card: '/badge?rep=pedro',
  },
};

function detectPlatform(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  if (/macintosh|mac os x/.test(ua)) return 'macOS';
  if (/windows/.test(ua)) return 'Windows';
  return 'Desktop';
}

module.exports = async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const platform = detectPlatform(userAgent);

  const rawRep = (req.query.rep || 'pedro').toLowerCase().trim();
  const rep = PASS_MAP[rawRep] ? rawRep : 'pedro';
  const source = req.query.source || req.query.src || (req.query.nfc === '1' ? 'nfc' : 'expo_qr');
  const destType = req.query.dest || 'card'; // 'card' | 'wallet'

  // Asynchronously append to Google Sheets Telemetry
  try {
    await appendTelemetryRow({
      timestamp: new Date().toISOString(),
      rep,
      event: destType === 'wallet' ? 'wallet_redirect' : 'badge_scan',
      platform,
      source,
      details: {
        userAgent: userAgent.slice(0, 120),
        dest: destType,
      },
    });
  } catch (err) {
    console.error('[-] Telemetry router log failed:', err.message);
  }

  // Determine Redirect Target
  let redirectUrl = (PASS_MAP[rep] && PASS_MAP[rep].card) ? PASS_MAP[rep].card : `/${rep}`;

  if (destType === 'wallet') {
    if (platform === 'iOS') {
      redirectUrl = PASS_MAP[rep].apple;
    } else {
      // Android / Desktop default to card or setup
      redirectUrl = `${redirectUrl}#wallet`;
    }
  }

  // Instantaneous 302 Redirect
  res.writeHead(302, {
    Location: redirectUrl,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  return res.end();
};
