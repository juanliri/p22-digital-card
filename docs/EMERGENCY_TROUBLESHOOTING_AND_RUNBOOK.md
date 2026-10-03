# P-22 CORP — EMERGENCY TROUBLESHOOTING & RUNBOOK
**Document Version:** 4.0.0 (Production Release)  
**Scope:** 1:1 Technical Runbook for Vercel, Google Sheets DWD/OAuth, PassKit, PWA Service Worker & Neural OCR  
**Last Updated:** 2026-10-03

---

## Quick Reference Diagnostic Matrix

| Symptom | Probable Root Cause | Immediate Action |
|---|---|---|
| Card scan OCR does not open | Missing HTTPS or camera permissions denied | Ensure user is browsing over `https://`, grant browser camera permission |
| "Failed to sync to Google Sheet" | Google Service Account key invalid or sheet unshared | Verify `GOOGLE_SERVICE_KEY` in Vercel environment variables and share sheet with service account email |
| Apple Wallet pass won't add | Corrupted `.pkpass` MIME type or expired certificate | Check Vercel headers in `vercel.json` (`application/vnd.apple.pkpass`) |
| Google Wallet link shows "Invalid JWT" | Google Pay API Issuer ID mismatch or token clock skew | Regenerate pass JWT using `mint_walletwallet_passes.py` with valid private key |
| Visual canvases show blank or black | CORS image taint or missing base64 asset | Ensure canvas redraws use local relative paths or base64 data URIs |
| Mobile badge shows scrollbar | Browser address bar dynamic viewport mismatch | Use `100dvh` CSS unit and compact padding in `badge.html` |

---

## 1. Google Sheets Integration Troubleshooting

### A. "Error: No Google Service Account credentials available"
- **Cause:** Neither `process.env.GOOGLE_SERVICE_KEY` nor `credentials/google-sa.json` could be loaded by `lib/google-sheets.js`.
- **Diagnosis:**
  ```bash
  # Check if local credentials file exists
  node -e "const fs = require('fs'); console.log(fs.existsSync('credentials/google-sa.json'));"
  ```
- **Resolution:**
  1. On Vercel: Go to **Project Settings -> Environment Variables**. Ensure `GOOGLE_SERVICE_KEY` is set to the full JSON string of the service account key.
  2. Locally: Ensure `credentials/google-sa.json` is present in the project root.

### B. "The caller does not have permission" (Google 403)
- **Cause:** The Google Spreadsheet has not been shared with the Google Cloud Service Account email.
- **Resolution:**
  1. Open the Google Spreadsheet:  
     `https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0/edit`
  2. Click **Share** (top right).
  3. Enter the service account email:  
     `p22-sheets-sync@growth-engine-438902.iam.gserviceaccount.com` (or the `client_email` found in your credentials file).
  4. Grant role **Editor** and save.

### C. "Unable to parse range: Leads_Vault!A1:H"
- **Cause:** The tab `Leads_Vault` was deleted or renamed in Google Sheets.
- **Resolution:**
  Run the initialization script:
  ```bash
  node scripts/setup-leads-vault-tab.js
  ```

---

## 2. In-Field OCR Business Card Scanner Troubleshooting

### A. Camera Won't Launch on Mobile
- **Cause:** iOS Safari or Android Chrome blocks camera access when not served over secure HTTPS.
- **Resolution:**
  1. Verify the site is loaded via `https://` (Vercel automatically provisions SSL).
  2. On iOS: Settings -> Safari -> Camera -> Set to "Ask" or "Allow".
  3. If native camera capture fails, the scanner automatically falls back to standard file picker (`<input type="file" accept="image/*">`), allowing users to upload a photo from their photo library.

### B. "Loading OCR Engine..." Hangs
- **Cause:** Tesseract.js CDN (`cdnjs.cloudflare.com` / `cdn.jsdelivr.net`) blocked by venue firewall or slow mobile data.
- **Resolution:**
  1. The scanner automatically falls back to `/api/ocr` (Cloud AI Vision endpoint) when network conditions prevent client-side CDN download.
  2. Ensure `/api/ocr` has access to `OPENAI_API_KEY` or Google Cloud Vision API in Vercel environment variables.
  3. Preload Tesseract: `card-scanner.js` preloads the engine in the background the moment the modal is rendered.

---

## 3. Digital Wallet Passes Troubleshooting

### A. Apple Wallet `.pkpass` Download Fails on iPhone
- **Cause:** Server sends incorrect MIME type or iOS Safari treats file as binary stream.
- **Resolution:**
  Ensure `vercel.json` contains the explicit header:
  ```json
  {
    "source": "/assets/passes/(.*)",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/vnd.apple.pkpass"
      },
      {
        "key": "Content-Disposition",
        "value": "attachment; filename=$1"
      }
    ]
  }
  ```

### B. Google Wallet Deep-Link Returns 400
- **Cause:** JWT token issued with expired timestamp (`exp`), or Generic Class ID is not approved in Google Pay Business Console.
- **Resolution:**
  1. Check the issuer ID: `3388000000023083770`.
  2. Ensure the class ID `3388000000023083770.ww-canary` is set to `ACTIVE`.
  3. Run the re-minting script:
     ```bash
     python scratch/mint_walletwallet_passes.py
     ```

---

## 4. Progressive Web App (PWA) & Offline Caching

### A. Stale Badge Code Showing on Staff Phones
- **Cause:** Browser Service Worker is serving cached assets from a previous deployment.
- **Resolution:**
  1. Hard refresh: In Safari, long-press the Reload button and select "Request Desktop Website" or clear browser cache in Settings -> Safari -> Advanced -> Website Data -> Remove All.
  2. To force cache bust across all devices: Increment `CACHE_VERSION` in `/sw.js` (e.g., `p22-cache-v4.0.1`), commit and deploy.

### B. "Add to Home Screen" Banner Does Not Appear on iOS
- **Cause:** Apple iOS does not support the Chromium `BeforeInstallPromptEvent`.
- **Resolution:**
  `badge.html` contains an automatic iOS detection block:
  - When opened on iOS Safari with `?install=1`, it automatically displays a floating instruction modal explaining:  
    `Tap Share -> "Add to Home Screen"`.

---

## 5. Visual Asset Canvases (Lockscreen, Watch Face, Zoom Bg)

### A. Canvas Export Throws SecurityError (Tainted Canvas)
- **Cause:** Drawing an image from an external cross-origin domain into an HTML5 `<canvas>` without CORS headers prevents `.toDataURL()` or `.toBlob()`.
- **Resolution:**
  1. All staff portraits are stored locally under `/assets/staff/*.png`.
  2. Base64 fallback strings are embedded directly in `team.json` and `setup.html` (`photoB64`) to guarantee canvas export never touches external origins.

---

## 6. Emergency Production Rollback Runbook

If a critical deployment introduces an unexpected bug:

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
3. **Restore from F: Drive Backup:**
   ```bash
   # Mirror good backup back to workspace
   robocopy "F:\_Backups_\p22-digital-card-backup-20261003" "i:\_Dev_Builds_\2026\p22-digital-card" /E /XD node_modules .git .vercel /R:1 /W:1
   ```
