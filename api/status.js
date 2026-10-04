/**
 * P-22 Digital Card - 360 Stack Health Endpoint
 * /api/status
 *
 * Checks every real dependency in parallel with short timeouts. Never returns secret values,
 * only booleans / latency / HTTP status.
 * Stack: Google Workspace, Vercel, Wix CRM, WalletWallet, Gemini Vision API, GitHub.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Auto-load .env in development / local node runtimes if present
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
} catch (e) {}

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
  return { name, group: 'Platform Providers', ok: r.ok && (indicator === 'none' || indicator === 'minor'), detail: indicator === 'none' ? 'All Systems Operational' : indicator, ms: r.ms };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const env = (k) => !!process.env[k];
  const host = req.headers?.host || 'card.p22corp.com';
  const base = `https://${host}`;

  const hasGoogleCreds = fs.existsSync(path.join(__dirname, '..', 'credentials', 'google-sa.json')) || env('GOOGLE_SERVICE_KEY');

  const [
    site, pedro, eduardo, marleni, sw, manifest, pass, vcf,
    vercelSt, githubSt,
    gemini, wallet, wixSite, wixApi, mirror,
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
    ping('https://generativelanguage.googleapis.com/'),
    ping('https://api.walletwallet.dev/'),
    ping('https://www.p22corp.com/'),
    process.env.WIX_API_KEY && process.env.WIX_SITE_ID
      ? ping('https://www.wixapis.com/contacts/v4/contacts?paging.limit=1', {
          headers: {
            Authorization: process.env.WIX_API_KEY,
            'wix-site-id': process.env.WIX_SITE_ID,
          },
        })
      : Promise.resolve(null),
    ping(process.env.MIRROR_URL || 'https://p22-digital-card.vercel.app/'),
  ]);

  const row = (name, group, r, extra = {}) => ({
    name,
    group,
    ok: !!(r && r.ok),
    detail: r ? `HTTP ${r.status}` : 'not configured',
    ms: r ? r.ms : null,
    ...extra,
  });

  const checks = [
    // 1. Live Site
    row('Public site (/)', 'Live Site', site),
    row('Pedro card', 'Live Site', pedro),
    row('Eduardo card', 'Live Site', eduardo),
    row('Marleni card', 'Live Site', marleni),
    row('Service worker', 'Live Site', sw),
    row('PWA manifest', 'Live Site', manifest),
    row('Apple Wallet pass', 'Live Site', pass),
    row('vCard file', 'Live Site', vcf),

    // 2. Platform Providers (Cleaned: Vercel & GitHub only, no Resend or Cloudflare)
    vercelSt,
    githubSt,

    // 3. Integrations
    row('Gemini Vision API', 'Integrations', gemini, { ok: !!gemini && gemini.status > 0 }),
    row('WalletWallet API', 'Integrations', wallet, { ok: !!wallet && wallet.status > 0 }),
    row('Wix Main Site (p22corp.com)', 'Integrations', wixSite, { ok: !!wixSite && wixSite.status >= 200 && wixSite.status < 400 }),
    row('Wix CRM Contacts API', 'Integrations', wixApi, { ok: !!wixApi && wixApi.status === 200, detail: wixApi ? `HTTP ${wixApi.status} Connected` : 'not configured' }),
    row('Failover mirror', 'Integrations', mirror, { ok: !!mirror && mirror.status > 0 }),

    // 4. Config & Keys
    { name: 'GEMINI_API_KEY', group: 'Config', ok: env('GEMINI_API_KEY') || env('GOOGLE_AI_KEY'), detail: 'Google AI Vision key' },
    { name: 'GOOGLE_SERVICE_KEY (Sheets/Drive)', group: 'Config', ok: hasGoogleCreds, detail: 'Service Account JWT' },
    { name: 'GOOGLE_SHEET_ID (Leads Vault)', group: 'Config', ok: env('GOOGLE_SHEET_ID'), detail: 'Spreadsheet ID' },
    { name: 'GOOGLE_DRIVE_FOLDER_ID', group: 'Config', ok: env('GOOGLE_DRIVE_FOLDER_ID'), detail: 'Folder ID' },
    { name: 'WIX_SITE_ID & WIX_API_KEY', group: 'Config', ok: env('WIX_API_KEY') && env('WIX_SITE_ID'), detail: 'Wix Headless Auth' },
  ];

  const failing = checks.filter((c) => !c.ok);
  const critical = checks.filter((c) => c.group === 'Live Site' && !c.ok).length;

  res.status(200).json({
    ok: critical === 0,
    overall: critical > 0 ? 'DOWN' : failing.length ? 'DEGRADED' : 'OPERATIONAL',
    checkedAt: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'local',
    deployment: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : 'production',
    summary: { total: checks.length, passing: checks.length - failing.length, failing: failing.length },
    checks,
  });
};
