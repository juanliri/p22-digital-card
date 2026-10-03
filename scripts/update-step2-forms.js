const fs = require('fs');
const path = require('path');

const files = [
  'pedro.html',
  'eduardo.html',
  'marleni.html',
  'bids.html',
  'logistics.html',
  'index.html'
];

const scannedPreviewHtml = `
                  <!-- Scanned Card Preview (Shows if photo was captured via scanner) -->
                  <div id="inlineScannedCardPreview" class="hidden p-2.5 rounded-xl bg-white/5 border border-p22gold/50 flex items-center justify-between gap-3 animate-fade-in">
                    <div class="flex items-center gap-2.5 overflow-hidden">
                      <img id="inlineScannedCardThumb" class="w-12 h-8 rounded-lg object-cover border border-white/20 shadow">
                      <div class="min-w-0">
                        <p class="text-[11px] font-bold text-white flex items-center gap-1">
                          <span class="text-emerald-400">✓</span> Card Photo Captured
                        </p>
                        <p class="text-[9.5px] text-slate-400 truncate">Embedded with lead exchange</p>
                      </div>
                    </div>
                    <button type="button" onclick="triggerCardScan('inline')" class="text-[10.5px] text-p22gold font-bold hover:underline shrink-0">Retake</button>
                  </div>`;

const phoneAndWebsiteGridHtml = `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5" for="inlinePhone">Direct Phone (Optional)</label>
                        <input type="tel" id="inlinePhone" autocomplete="tel" placeholder="(512) 555-0199"
                               class="w-full px-3 py-2.5 rounded-xl glass-input text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-p22gold transition">
                      </div>
                      <div>
                        <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5" for="inlineWebsite">Company Website (Optional)</label>
                        <input type="text" id="inlineWebsite" placeholder="e.g. www.turnerconstruction.com"
                               class="w-full px-3 py-2.5 rounded-xl glass-input text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-p22gold transition">
                      </div>
                    </div>`;

files.forEach(filename => {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[!] Skipping ${filename} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Scanned Preview right above <form id="inlineLeadForm" if not already present
  if (!content.includes('inlineScannedCardPreview')) {
    content = content.replace(
      /(<form id="inlineLeadForm"[^>]*>)/i,
      `${scannedPreviewHtml}\n\n                  $1`
    );
  }

  // 2. Replace the single inlinePhone block with the 2-column phone & website grid
  if (!content.includes('id="inlineWebsite"')) {
    const singlePhonePattern = /<div>\s*<label[^>]*for="inlinePhone"[^>]*>[\s\S]*?<\/label>\s*<input[^>]*id="inlinePhone"[^>]*>\s*<\/div>/i;
    if (singlePhonePattern.test(content)) {
      content = content.replace(singlePhonePattern, phoneAndWebsiteGridHtml.trim());
    }
  }

  // 3. Update handleInlineLeadSubmit to read inlineWebsite and photo_url
  if (content.includes('function handleInlineLeadSubmit')) {
    // Check if rawWebsite is read
    if (!content.includes('rawWebsite')) {
      content = content.replace(
        /(const rawPhone = \(document\.getElementById\('inlinePhone'\)\?\.value \|\| ''\)\.trim\(\) \|\| 'N\/A';)/,
        `$1\n      const rawWebsite = (document.getElementById('inlineWebsite')?.value || '').trim();`
      );
    }

    // Check if client_website and photo_url are in lead object
    if (!content.includes('client_website:')) {
      content = content.replace(
        /(client_phone: sanitizeLeadInput\(rawPhone\),)/,
        `$1\n        client_website: sanitizeLeadInput(rawWebsite),\n        photo_url: window.p22LastScannedPhoto || '',`
      );
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[+] Successfully updated Step 2 form & lead submission in ${filename}`);
});
