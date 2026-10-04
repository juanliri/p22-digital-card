# Vercel Limits, Failover and 5-Minute Fixes

> Verify current numbers at https://vercel.com/docs/limits and your project's **Settings → Usage**. Vercel changes plan limits periodically; the values below are what I know and should be re-checked.

## 1. Can the account "deactivate" or stop the build?

| Scenario | What happens | Prevention |
|---|---|---|
| **Hobby plan is non-commercial only** | Vercel's Fair Use terms say Hobby is for personal, non-commercial use. A business site (P-22 Corp) can be paused or flagged. **This is the biggest risk.** | Move the project to **Vercel Pro (~$20/user/mo)**. Your team is `todobuild-apps`, so confirm it is a Pro team. |
| Free-tier usage exceeded (bandwidth, function invocations, CPU time) | Deployments/functions can be blocked or paused until the usage window resets (~30 days). Static assets may keep serving, APIs may not. | Watch **Settings → Usage**. Set a **Spend Management** alert (Pro). Keep images compressed (`.pkpass` files are 1-3 MB each). |
| Deployment rate limit (about 100 deployments/day on Hobby) | `vercel --prod` fails with a rate-limit error. Production keeps serving the last good build. | Batch changes. Do not loop deploys in scripts. |
| Function timeout (10-60s depending on plan) | `/api/ocr` and `/api/lead` return 504. | OCR already falls back to on-device Tesseract. Leads are queued in `localStorage` and flushed on reconnect. |
| Failed build | **Old production stays live.** A failed build never takes the site down. | Always run `node --check` on JS before deploying. |
| Env var removed or key rotated | APIs degrade silently. Cards still load. | `/status` shows every key as present/missing. |
| Domain / DNS problem | Site unreachable though Vercel is healthy. | Mirror below. Keep DNS TTL low (300s). |
| Billing/payment failure (Pro) | Account can be restricted. | Keep a valid card and a billing email you read. |

### What does NOT go down when Vercel is down
- Cards already installed as a PWA keep opening (service worker cache `p22-cache-v4.0`).
- Leads captured offline stay in `localStorage` (`p22_offline_queue`) and send automatically when the API returns.
- Wallet passes already saved on phones keep working.

## 2. Automatic backup mirror (already in repo)
`.github/workflows/mirror-and-uptime.yml`:
1. **Every push to `main`** publishes a static copy to **GitHub Pages**: `https://juanliri.github.io/p22-digital-card/`
2. **Every 10 minutes** a watchdog probes `https://card.p22corp.com/eduardo` 3 times. If it fails, it opens a GitHub issue labelled `incident` (GitHub emails you).

**One-time setup (2 min):** GitHub repo → Settings → Pages → Source = **GitHub Actions**. Then Settings → Notifications → enable email for issues.

The mirror is static: cards, badges, vCards, wallet passes and QR all work. Lead forms queue offline until the primary API is back.

### Optional second mirror (Cloudflare Pages, free)
Cloudflare dashboard → Workers & Pages → Create → Connect to Git → pick the repo → build command empty, output dir `/`. Add `MIRROR_URL` in Vercel env to show it on `/status`.

## 3. 5-minute fixes

| Symptom | Fix |
|---|---|
| Site shows old content | Hard refresh. Cache name in `sw.js` was bumped to `v4.0`; bump again on every deploy that changes assets. |
| `vercel --prod` fails | `npx vercel whoami` → `npx vercel link` → retry. Check https://www.vercel-status.com. |
| Production down, Vercel healthy | Vercel → Project → Deployments → find last green deploy → **⋯ → Promote to Production** (instant rollback). |
| Domain not resolving | Vercel → Settings → Domains → check `card.p22corp.com` shows **Valid**. Temporary link: `https://p22-digital-card-*.vercel.app`. |
| Leads not reaching Sheet | `/status` → Config. Check `GOOGLE_SERVICE_KEY`; share Sheet with the service account email as Editor. |
| Card photos not saving to Drive | Check `GOOGLE_ADMIN_EMAIL` and folder sharing (service accounts have 0 quota; Drive uses delegation). |
| OCR returns empty | Gemini quota. Scanner falls back to Tesseract automatically; check `GEMINI_API_KEY` in `/status`. |
| Wix CRM not receiving | `WIX_WEBHOOK_URL` must be set; test with `curl -X POST <url> -d '{}'`. |
| Email alerts missing | `RESEND_API_KEY` or `NOTIFICATION_WEBHOOK` missing; check spam for sender domain. |
| Badge photo broken | Photos now fall back to embedded base64, then `/favicon.png`. Run `python scripts/lock-in-badge-photos.py`. |
| Wrong phone anywhere | Edit `build_vcf.py` → `python build_vcf.py` → `python scripts/sync-cards-team-data.py` → `python scripts/sync-badge-team-data.py` → `python scripts/audit-team-data.py`. |

## 4. Monitoring
- **Live dashboard:** `https://card.p22corp.com/status` (auto-refresh 30s) backed by `/api/status`.
- **External uptime (free, independent of Vercel):** add `https://card.p22corp.com/api/status` to UptimeRobot or Better Stack with email/SMS alerts. This catches total outages when the dashboard itself cannot load.
- Keep the mirror URL bookmarked on staff phones.

## 5. Where all data lives
| Data | Location |
|---|---|
| Leads (primary) | Google Sheet `Leads_Vault` tab: https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0 |
| Card photos | Google Drive shared folder (via `lib/google-drive.js`), URL stored in the `photo_url` column |
| Wix CRM mirror | Wix Dashboard → Contacts (tags: `Expo 2026`, `Rep-<Name>`); also Wix Automations log |
| Server logs | Vercel → Project → **Logs** (functions `/api/lead`, `/api/ocr`) |
| Email notifications | Sent from `lib/notifications.js` to staff inboxes (`pfelipe@`, `elopez@`, `mmendez@`, `bids@`, `logistics@p22corp.com`) |
| Local backups | `backups/` (Sheets JSON + CSV), `vault/p22-secrets-vault.enc` |
| On-device pending leads | Browser `localStorage`: `p22_leads`, `p22_offline_queue` |
