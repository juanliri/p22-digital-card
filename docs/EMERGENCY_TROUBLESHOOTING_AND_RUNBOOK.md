# P-22 CORP — EMERGENCY TROUBLESHOOTING & RUNBOOK
**Document Version:** 4.1.0 (Production / Expo Live Edition)  
**Scope:** 1:1 Technical Runbook for Expo Floor Operations, Offline Contingencies, Vercel Edge, Google Sheets DWD/OAuth, PassKit, PWA Service Worker & Neural OCR  
**Target Domain:** `https://card.p22corp.com`  
**Last Updated:** 2026-10-04  

---

## 1. Expo Floor Quick Reference: 10 Failure Scenarios & Instant Contingencies

| Scenario / Failure Mode | Root Cause | Immediate On-Floor Action & Recovery |
|---|---|---|
| **1. Zero / Degraded Cell Signal inside Convention Hall** | Heavy RF interference, basement hall or 10,000 attendees jamming cell towers. | **PWA Offline Mode**: Badge loads from local cache. **Offline Lead Buffer**: Form & Card Scanner save directly to `localStorage` (`p22_leads`). **Wallpaper QR**: Display static Lockscreen Wallpaper QR code (works 100% offline with no internet needed). |
| **2. Physical NFC Tag Fails to Pop Up on Attendee Phone** | Attendee phone screen locked, thick metal/wallet case, wrong antenna position (top of iPhone, center of Android). | **Rule 1**: Ask attendee to unlock screen. **Rule 2**: Tap top edge for iPhone, center back for Android. **Rule 3**: If no trigger within 2 seconds, immediately pivot: "Let me show you my badge QR code!" Open `badge.html` or display Apple Wallet pass. |
| **3. Attendee In-App Browser Blocks Download (`.vcf` or `.pkpass`)** | Attendee scanned QR from inside LinkedIn, Instagram, or WeChat browser instead of Safari/Chrome. | Tap **[Copy Direct Link]** or instruct: "Tap the 3 dots (...) in the top right and select 'Open in Safari' or 'Open in Chrome'". Alternatively, use **Exchange Info** modal to send contact directly to their email. |
| **4. Attendee Device Cannot Open `.vcf` (Virtual Contact Card)** | Some older Android versions display `.vcf` as raw text instead of adding to Contacts. | Use the **Exchange Info** (Step 2) form or tap **SMS Me Contact** to dispatch a direct SMS link with all numbers and links preformatted. |
| **5. Card Scanner Camera Access Denied or Dim Booth Lighting** | Safari/Chrome camera permission set to "Block", or venue hall lighting is low/glaring. | **Recovery A**: Tap lock icon in URL bar &rarr; Permissions &rarr; Camera &rarr; Allow. **Recovery B**: Use built-in photo gallery upload (`<input type="file">`) to snap photo with native camera flash. **Recovery C**: Tap "Enter Manually" — high-contrast dark form (`#0B132B` / `#FFFFFF`) allows 10-second manual entry. |
| **6. Google Sheets API Rate Limit (HTTP 429) or Temporary Outage** | Heavy burst of 100+ scans in minutes exceeding Google Cloud quotas. | **Dual Ingestion Safeguard**: The app falls back automatically to local queue. The email notification is dispatched independently via Resend/Webhook. When back online, tap **[Sync All to Sheet]** in `/setup#vault` to batch-flush. |
| **7. Staff Smartphone Battery Dies on Expo Floor** | 10+ hours on high screen brightness drains battery. | **Cross-Device Switch**: Open `https://card.p22corp.com/setup` on any colleague's phone or tablet and select the representative profile. **Physical Badge Lanyard**: Attendee scans printed badge QR code pointing permanently to `https://card.p22corp.com/[rep]`. |
| **8. Attendee Uses Microsoft Outlook / Lacks Google Account for Calendar** | Attendee corporate policy blocks Google Calendar quick-booking. | The consultation modal provides a **1-click universal `.ics` file download** compatible with Outlook, Apple Calendar, and Exchange, plus direct email dispatch to `bids@p22corp.com`. |
| **9. Stale Cached Code on Staff Smartphone** | Previous PWA service worker serving older version before launch updates. | Hard reload Safari (long-press Reload icon &rarr; Request Desktop Site) or open Settings &rarr; Safari &rarr; Advanced &rarr; Website Data &rarr; Clear `p22corp.com`. `sw.js` cache version is now `p22-cache-v3.8`. |
| **10. Custom Subdomain DNS Glitch or Edge Routing Latency** | Network anomaly on convention center Wi-Fi DNS resolvers. | Secondary edge ingress remains fully active via Vercel edge alias (`p22-digital-card.vercel.app` auto-redirects or serves assets). Full local backup exists on `F:` drive. |

---

## 2. In-Field OCR Business Card Scanner Troubleshooting

### A. Form Input Visibility & Contrast
- **Previous Issue**: Mobile browsers (especially iOS Safari with Dark Mode or autofill) previously forced white input backgrounds with white text.
- **Permanent Fix**: `assets/js/card-scanner.js` now features:
  - Scoped CSS rules forcing `background-color: #0B132B !important;` and `color: #FFFFFF !important;`.
  - Vendor prefix `-webkit-text-fill-color: #FFFFFF !important;` to neutralize Safari autofill overrides.
  - Golden focus glow (`#C9A227`) indicating active editing state.
- **Verification**: Open `https://card.p22corp.com/badge` &rarr; click **[📷 Scan Card]** &rarr; review form fields. Inputs are deep navy with crisp white typography.

### B. Business Card Photo Attachment in Notifications
- **Feature**: When a card or badge is photographed, the downsampled image (`photo_url`) is embedded directly into the HTML email notification dispatched to the assigned staff member (`pfelipe@p22corp.com`, `elopez@p22corp.com`, etc.).
- **Staff Vault Link**: The email includes a direct 1-click link to view the high-resolution photo in the live Staff Leads Vault: `https://card.p22corp.com/setup#vault`.

### C. Offline Lead Queue & Batch Sync
- If a card is scanned while the phone has zero connectivity:
  1. The card data and photo data URI are written to browser `localStorage` under `p22_leads`.
  2. A gold badge counter on the Staff Leads Vault tab displays `[X Pending Sync]`.
  3. As soon as connectivity returns, the user can click **[Sync All to Sheet]** to batch-push all queued contacts into Google Sheets.

---

## 3. Google Sheets Integration & Sanitization Verification

### A. Zero Domain Leak Guarantee
- The live Google Sheets workbook (`1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0`) has been completely sanitized.
- Every formula and hyperlink points strictly to the production subdomain: `https://card.p22corp.com`.
- Live API regex scan confirms: **0 occurrences** of legacy domains.

### B. "The caller does not have permission" (Google 403)
- Ensure the sheet is shared with the Google Cloud Service Account:
  `p22-sheets-sync@growth-engine-438902.iam.gserviceaccount.com` as **Editor**.

### C. "Unable to parse range: Leads_Vault!A1:H"
- Run the automated setup script to ensure all 4 tabs (`Dashboard`, `Leads_Vault`, `Consultations`, `Sheet1`) are present:
  ```bash
  node scripts/setup-leads-vault-tab.js
  ```

---

## 4. Digital Wallet Passes & Offline NFC Troubleshooting

### A. Apple Wallet `.pkpass`
- Served with strict MIME header `application/vnd.apple.pkpass` in `vercel.json`.
- Automatically opens in Apple Wallet app without third-party tools.
- Once added, Apple Wallet works **100% offline** with maximum screen brightness on tap.

### B. Physical NFC Programming
- Program NFC tags (NTAG213 / NTAG215) with the standard URL record:
  - Pedro: `https://card.p22corp.com/pedro`
  - Eduardo: `https://card.p22corp.com/eduardo`
  - Marleni: `https://card.p22corp.com/marleni`
  - Bids: `https://card.p22corp.com/bids`
  - Logistics: `https://card.p22corp.com/logistics`

---

## 5. Pre-Expo Morning Checklist for Booth Staff (3 Minutes)

Every representative should perform these 5 steps prior to booth opening:

1. **Verify PWA Installation**:
   - Open Safari/Chrome, navigate to `https://card.p22corp.com/badge?rep=[your_name]`.
   - Tap Share &rarr; **Add to Home Screen**.
   - Confirm the P-22 icon appears on your home screen.
2. **Download Offline Failsafe Lock Screen**:
   - Go to `https://card.p22corp.com/setup#visuals`.
   - Tap **[Generate Lockscreen]** &rarr; save image to Photos &rarr; set as Lock Screen wallpaper.
   - Test scanning it with a colleague's phone while your screen is locked.
3. **Verify Camera Permission**:
   - Open the badge PWA &rarr; tap **[📷 Scan Card]** &rarr; verify the camera viewfinder opens smoothly.
4. **Test Step 2 Contact Exchange**:
   - Submit a test lead ("Test Attendee") &rarr; confirm it appears in `/setup#vault` and Google Sheets.
5. **Set Screen Brightness & Battery Saver**:
   - Ensure screen auto-lock timeout is set to 2–5 minutes.
   - Carry a 10,000mAh external power bank at the booth.

---

## 6. Emergency Production Rollback Runbook

If any code change ever needs instant rollback during the event:

1. **Instant Rollback via Vercel CLI:**
   ```bash
   npx vercel rollback
   ```
2. **Rollback via Git Commit:**
   ```bash
   git log -n 5 --oneline
   git revert HEAD
   git push origin main
   npx vercel --prod --yes
   ```
3. **Restore from F: Drive Redundant Backup:**
   ```bash
   robocopy "F:\_Backups_\p22-digital-card-backup-20261003" "i:\_Dev_Builds_\2026\p22-digital-card" /E /XD node_modules .git .vercel /R:1 /W:1
   ```
