/**
 * Patch remaining profile HTML files with Card Scanner & Leads_Vault sync:
 * - marleni.html
 * - bids.html
 * - logistics.html
 * - index.html
 */

const fs = require('fs');
const path = require('path');

const files = ['marleni.html', 'bids.html', 'logistics.html', 'index.html'];

const scanBarHtml = `                  <!-- 📷 Quick Scan Physical Business Card / Badge -->
                  <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-base">📷</span>
                      <div>
                        <p class="text-[11px] font-bold text-white leading-tight">Or Scan Physical Card / Badge</p>
                        <p class="text-[9.5px] text-slate-400">Snap a photo to auto-extract details</p>
                      </div>
                    </div>
                    <button type="button" onclick="triggerCardScan('inline')" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold font-montserrat flex items-center gap-1 transition">
                      <span>Scan Card</span>
                    </button>
                  </div>

                  <div class="relative flex py-0.5 items-center">
                    <div class="flex-grow border-t border-white/10"></div>
                    <span class="flex-shrink mx-2 text-[9.5px] text-slate-400 font-mono">OR ENTER DETAILS</span>
                    <div class="flex-grow border-t border-white/10"></div>
                  </div>

                  <form id="inlineLeadForm"`;

for (const filename of files) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add card-scanner.js script tag if missing
  if (!content.includes('/assets/js/card-scanner.js')) {
    content = content.replace(
      '<script defer src="/assets/js/telemetry.js"></script>',
      '<script defer src="/assets/js/telemetry.js"></script>\n  <script defer src="/assets/js/card-scanner.js"></script>'
    );
  }

  // 2. Add scan bar before inlineLeadForm if missing
  if (!content.includes('triggerCardScan(\'inline\')')) {
    content = content.replace(
      '<form id="inlineLeadForm"',
      scanBarHtml
    );
  }

  // 3. Hook up handleInlineLeadSubmit
  if (!content.includes('// Automatically sync to Google Sheets Leads_Vault tab\n      if (window.p22SubmitLead) {\n        window.p22SubmitLead(lead);\n      }')) {
    content = content.replace(
      `localStorage.setItem('p22_expo_leads', JSON.stringify(existing));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }`,
      `localStorage.setItem('p22_expo_leads', JSON.stringify(existing));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      // Automatically sync to Google Sheets Leads_Vault tab
      if (window.p22SubmitLead) {
        window.p22SubmitLead(lead);
      }`
    );
  }

  // 4. Hook up rfqForm
  if (content.includes("localStorage.setItem('p22_leads', JSON.stringify(stored));\n      } catch (err) {\n        console.warn('LocalStorage save failed', err);\n      }\n\n      try {\n        if (!MAKE_WEBHOOK_URL.includes")) {
    content = content.replace(
      `localStorage.setItem('p22_leads', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      try {
        if (!MAKE_WEBHOOK_URL.includes`,
      `localStorage.setItem('p22_leads', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      // Automatically sync to Google Sheets Leads_Vault tab
      if (window.p22SubmitLead) {
        window.p22SubmitLead(leadData);
      }

      try {
        if (!MAKE_WEBHOOK_URL.includes`
    );
  }

  // 5. Hook up exchForm
  if (content.includes("localStorage.setItem('p22_leads', JSON.stringify(stored));\n        } catch (err) {\n          console.warn('LocalStorage save failed', err);\n        }\n\n        const submitBtn = document.getElementById('exchSubmitBtn');")) {
    content = content.replace(
      `localStorage.setItem('p22_leads', JSON.stringify(stored));
        } catch (err) {
          console.warn('LocalStorage save failed', err);
        }

        const submitBtn = document.getElementById('exchSubmitBtn');`,
      `localStorage.setItem('p22_leads', JSON.stringify(stored));
        } catch (err) {
          console.warn('LocalStorage save failed', err);
        }

        // Automatically sync to Google Sheets Leads_Vault tab
        if (window.p22SubmitLead) {
          window.p22SubmitLead(lead);
        }

        const submitBtn = document.getElementById('exchSubmitBtn');`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[+] Patched ${filename}`);
}
