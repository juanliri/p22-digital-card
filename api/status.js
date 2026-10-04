/**
 * P-22 Digital Card - 360 Stack Health Endpoint
 * /api/status
 *
 * Checks every dependency in parallel with short timeouts. Never returns secret values,
 * only booleans / latency / HTTP status.
 */
const https = require('https');

function ping(url, { method = 'GET', headers = {}, timeout = 5000 } = {}) {
  const started = Date.now();
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request(
        { hostname: u.hostname, path: u.pathname + u.search, method, headers: { 'User-Agent': 'p22-status/1.0', ...headers } },
        (res) => {
          let body = '';
          res.on('data', (c) => { if (body.length < 20000) body += c; });
          res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, ms: Date.now() - started, body }));
        }
      );
      req.on('error', (e) => resolve({ ok: false, status: 0, ms: Date.now() - started, error: e.message }));
      req.setTimeout(timeout, () => req.destroy(new Error('timeout')));
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 0, ms: 0, error: e.message });
    }
  });
}

async function statuspage(name, url) {
  const r = await ping(url);
  let indicator = 'unknown';
  try { indicator = JSON.parse(r.body).status.indicator; } catch (e) {}
  return { name, group: 'Platform Providers', ok: r.ok && indicator === 'none', detail: indicator, ms: r.ms };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const env = (k) => !!process.env[k];
  const host = req.headers.host || 'card.p22corp.com';
  const base = `https://${host}`;

  const [
    site, pedro, eduardo, marleni, sw, manifest, pass, vcf,
    vercelSt, githubSt, cloudflareSt, resendSt,
    gemini, wallet, wix, mirror,
  ] = await Promise.all([
    ping(`${base}/`),
    ping(`${base}/pedro`),
    ping(`${base}/eduardo`),
    ping(`${base}/marleni`),
    ping(`${base}/sw.js`),
    ping(`${base}/manifest.json`),
    ping(`${base}/assets/passes/eduardo.pkpass`, { method: 'HEAD' }),
    ping(`${base}/assets/vcf/eduardo.vcf`, { method: 'HEAD' }),
    statuspage('Vercel', 'https://www.vercel-status.com/api/v2/status.json'),
    statuspage('GitHub', 'https://www.githubstatus.com/api/v2/status.json'),
    statuspage('Cloudflare', 'https://www.cloudflarestatus.com/api/v2/status.json'),
    statuspage('Resend', 'https://resend-status.com/api/v2/status.json'),
    ping('https://generativelanguage.googleapis.com/'),
    ping('https://api.walletwallet.dev/'),
    process.env.WIX_SITE_URL ? ping(process.env.WIX_SITE_URL) : Promise.resolve(null),
    process.env.MIRROR_URL ? ping(process.env.MIRROR_URL) : Promise.resolve(null),
  ]);

  const row = (name, group, r, extra = {}) => ({ name, group, ok: !!(r && r.ok), detail: r ? `HTTP ${r.status}` : 'not configured', ms: r ? r.ms : null, ...extra });

  const checks = [
    row('Public site (/)', 'Live Site', site),
    row('Pedro card', 'Live Site', pedro),
    row('Eduardo card', 'Live Site', eduardo),
    row('Marleni card', 'Live Site', marleni),
    row('Service worker', 'Live Site', sw),
    row('PWA manifest', 'Live Site', manifest),
    row('Apple Wallet pass', 'Live Site', pass),
    row('vCard file', 'Live Site', vcf),
    vercelSt, githubSt, cloudflareSt, resendSt,
    row('Gemini Vision API', 'Integrations', gemini, { ok: !!gemini && gemini.status > 0 }),
    row('WalletWallet API', 'Integrations', wallet, { ok: !!wallet && wallet.status > 0 }),
    row('Wix site', 'Integrations', wix),
    row('Failover mirror', 'Integrations', mirror),
    { name: 'GEMINI_API_KEY', group: 'Config', ok: env('GEMINI_API_KEY') || env('GOOGLE_AI_KEY'), detail: 'env var' },
    { name: 'GOOGLE_SERVICE_KEY (Sheets/Drive)', group: 'Config', ok: env('GOOGLE_SERVICE_KEY'), detail: 'env var' },
    { name: 'WIX_WEBHOOK_URL / WIX_API_KEY', group: 'Config', ok: env('WIX_WEBHOOK_URL') || env('WIX_API_KEY'), detail: 'env var' },
    { name: 'RESEND_API_KEY / NOTIFICATION_WEBHOOK', group: 'Config', ok: env('RESEND_API_KEY') || env('NOTIFICATION_WEBHOOK'), detail: 'env var' },
    { name: 'GOOGLE_ADMIN_EMAIL (Drive delegation)', group: 'Config', ok: env('GOOGLE_ADMIN_EMAIL'), detail: 'env var' },
  ];

  const failing = checks.filter((c) => !c.ok);
  const critical = checks.filter((c) => c.group === 'Live Site' && !c.ok).length;
  res.status(200).json({
    ok: critical === 0,
    overall: critical > 0 ? 'DOWN' : failing.length ? 'DEGRADED' : 'OPERATIONAL',
    checkedAt: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'local',
    deployment: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : 'n/a',
    summary: { total: checks.length, passing: checks.length - failing.length, failing: failing.length },
    checks,
  });
};
