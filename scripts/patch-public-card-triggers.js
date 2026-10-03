const fs = require('fs');
const path = require('path');

const FILES = ['pedro.html', 'eduardo.html', 'marleni.html', 'logistics.html', 'bids.html', 'index.html'];
const ROOT = path.resolve('.');

const OLD_TRIGGER_PATTERN = /<!-- STEP 2 INVITATION TRIGGER[\s\S]*?id="step2TriggerBar"[\s\S]*?<\/div>/;

FILES.forEach(filename => {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract rep first name
  let repName = 'Staff';
  const nameMatch = content.match(/<h1 id="staffName"[^>]*>([^<]+)<\/h1>/);
  if (nameMatch) {
    repName = nameMatch[1].trim().split(' ')[0];
  }

  const newTriggerHtml = `<!-- STEP 2 INVITATION TRIGGER WITH DIRECT SCAN SHORTCUT -->
              <div id="step2TriggerBar" class="pt-3 border-t border-white/10 text-left grid grid-cols-1 sm:grid-cols-2 gap-2" style="transform: translateZ(14px);">
                <!-- 1. Expand Reciprocal Form -->
                <button type="button" onclick="revealStep2Exchange(true)" 
                        class="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-p22blue/25 via-sky-500/15 to-p22navy/40 hover:from-p22blue/35 hover:to-sky-500/25 border border-sky-400/30 text-white transition flex items-center justify-between group active:scale-98 shadow-md">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-p22gold/20 text-p22gold flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </div>
                    <div class="text-left min-w-0">
                      <span class="text-[9.5px] font-bold text-p22gold uppercase tracking-wider block">Step 2: Connect</span>
                      <p class="text-xs font-montserrat font-bold text-white truncate">
                        Share with ${repName} &rarr;
                      </p>
                    </div>
                  </div>
                  <span class="text-xs text-sky-300 font-semibold group-hover:translate-x-0.5 transition">&darr;</span>
                </button>

                <!-- 2. Direct Camera OCR Scan Shortcut -->
                <button type="button" onclick="triggerCardScan('inline')" 
                        class="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-slate-900 hover:from-emerald-500/35 hover:to-teal-500/30 border border-emerald-400/40 text-white transition flex items-center justify-between group active:scale-98 shadow-md">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
                    </div>
                    <div class="text-left min-w-0">
                      <span class="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider block">Instant OCR</span>
                      <p class="text-xs font-montserrat font-bold text-white truncate">
                        Scan Card (Camera)
                      </p>
                    </div>
                  </div>
                  <span class="text-[11px] text-emerald-300 font-mono font-bold pr-1">📷</span>
                </button>
              </div>`;

  if (OLD_TRIGGER_PATTERN.test(content)) {
    content = content.replace(OLD_TRIGGER_PATTERN, newTriggerHtml);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[UPDATED] Upgraded trigger bar with instant scan shortcut in: ${filename}`);
  } else {
    console.log(`[-] Pattern not found in: ${filename}`);
  }
});
