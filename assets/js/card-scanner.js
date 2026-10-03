/**
 * P-22 Corp Digital Card - Business Card & Badge OCR Scanner
 * Extracts contact information (Name, Agency, Email, Phone, Raw Notes)
 * from physical cards or expo badges using HTML5 Canvas & on-demand Tesseract OCR.
 * Automatically pushes captured leads to Google Sheets 'Leads_Vault' tab.
 */

(function () {
  'use strict';

  // In-memory state
  let isTesseractLoading = false;
  let tesseractLoaded = false;
  let activeScanContext = 'inline'; // 'inline' | 'setup' | 'modal'
  let capturedImageDataUrl = null;

  // Global submission helper for all P-22 frontends
  window.p22SubmitLead = async function (leadData) {
    try {
      const sanitized = {
        timestamp: leadData.timestamp || new Date().toISOString(),
        rep_name: leadData.rep_name || leadData.rep || (typeof currentRep !== 'undefined' && typeof TEAM_DATA !== 'undefined' && TEAM_DATA[currentRep] ? TEAM_DATA[currentRep].name : 'Pedro Felipe'),
        client_name: leadData.client_name || leadData.name || '',
        client_agency: leadData.client_agency || leadData.agency || '',
        client_website: leadData.client_website || leadData.website || '',
        client_email: leadData.client_email || leadData.email || '',
        client_phone: leadData.client_phone || leadData.phone || '',
        interest: leadData.interest || leadData.scope || 'Procurement & Logistics Coordination',
        notes: leadData.notes || leadData.extracted_text || leadData.raw_ocr || '',
        photo_url: leadData.photo_url || leadData.card_photo || capturedImageDataUrl || window.p22LastScannedPhoto || '',
        source: leadData.source || 'Digital Card Exchange',
      };

      // 1. Offline resilient local backup
      try {
        const stored = JSON.parse(localStorage.getItem('p22_leads') || '[]');
        // Check duplicate by email or name
        const exists = stored.some(
          item =>
            (sanitized.client_email && item.client_email === sanitized.client_email) ||
            (sanitized.client_name && item.client_name === sanitized.client_name && item.client_agency === sanitized.client_agency)
        );
        if (!exists) {
          stored.unshift(sanitized);
          localStorage.setItem('p22_leads', JSON.stringify(stored));
          localStorage.setItem('p22_expo_leads', JSON.stringify(stored));
        }
      } catch (err) {
        console.warn('[P22-Lead] LocalStorage save warning:', err);
      }

      // 2. Dispatch to /api/lead (Serverless edge lead capture)
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      });

      if (res.ok) {
        const json = await res.json();
        console.log('[+] Lead successfully recorded:', json);
        return { ok: true, data: json };
      } else {
        console.warn('[-] /api/lead returned non-200:', res.status);
        return { ok: false, status: res.status };
      }
    } catch (err) {
      console.warn('[P22-Lead] Network dispatch deferred to offline storage:', err.message);
      return { ok: false, offline: true, error: err.message };
    }
  };

  // Sync all local leads that may have been saved while offline
  window.p22SyncOfflineLeads = async function () {
    try {
      const stored = JSON.parse(localStorage.getItem('p22_leads') || '[]');
      if (!stored.length) return { count: 0, message: 'No stored leads to sync.' };

      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: stored }),
      });

      if (res.ok) {
        const json = await res.json();
        return { ok: true, count: json.count || stored.length };
      }
      return { ok: false };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Dynamically load Tesseract.js on demand
  function loadTesseract(callback) {
    if (window.Tesseract) {
      tesseractLoaded = true;
      if (callback) callback();
      return;
    }
    if (isTesseractLoading) {
      const check = setInterval(() => {
        if (window.Tesseract) {
          clearInterval(check);
          tesseractLoaded = true;
          if (callback) callback();
        }
      }, 100);
      return;
    }

    isTesseractLoading = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => {
      tesseractLoaded = true;
      isTesseractLoading = false;
      if (callback) callback();
    };
    script.onerror = () => {
      isTesseractLoading = false;
      console.warn('[!] Failed to load Tesseract.js from CDN. Using fallback heuristic parser.');
      if (callback) callback();
    };
    document.head.appendChild(script);
  }

  // Pre-process canvas image for OCR contrast
  function preprocessImage(img, maxWidth = 1200) {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // Get thumbnail for lead record
    const thumbCanvas = document.createElement('canvas');
    const thumbWidth = 320;
    const thumbHeight = Math.round((height * thumbWidth) / width);
    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
    capturedImageDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);
    window.p22LastScannedPhoto = capturedImageDataUrl;

    return canvas;
  }

  // Regex Heuristics to parse Business Card text
  function parseCardText(rawText) {
    const lines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 1);

    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/i;

    let email = '';
    let phone = '';
    let agency = '';
    let name = '';

    for (const line of lines) {
      if (!email) {
        const m = line.match(emailRegex);
        if (m) email = m[1].toLowerCase();
      }
      if (!phone) {
        const m = line.match(phoneRegex);
        if (m) phone = m[0];
      }
    }

    // Filter candidate lines for Company / Agency
    const agencyKeywords = ['inc', 'llc', 'corp', 'agency', 'dept', 'department', 'command', 'dla', 'usace', 'navfac', 'group', 'services', 'logistics', 'solutions', 'technologies', 'contracting', 'command'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (agencyKeywords.some(kw => lower.includes(kw)) && !line.includes('@')) {
        agency = line;
        break;
      }
    }

    // Name detection: line with 2-4 capitalized words that is not agency or email
    for (const line of lines) {
      if (line === agency || line.includes('@') || line.match(phoneRegex) || line.length > 35) continue;
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && /^[A-Z][a-zA-Z.'-]+$/.test(words[0])) {
        name = line;
        break;
      }
    }

    // Fallbacks
    if (!name && lines.length > 0 && lines[0] !== agency) name = lines[0];
    if (!agency && lines.length > 1) agency = lines[1];

    return {
      name,
      agency,
      email,
      phone,
      raw_ocr: rawText.slice(0, 800),
    };
  }

  // Create UI Modal for Card Scanner
  function ensureScannerModal() {
    let modal = document.getElementById('p22CardScannerModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'p22CardScannerModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md hidden transition-all duration-300';
    modal.innerHTML = `
      <div class="relative w-full max-w-md rounded-3xl bg-slate-900 border border-p22gold/40 shadow-2xl p-6 text-white space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-p22gold/20 text-p22gold flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div>
              <h3 class="text-sm font-montserrat font-bold text-white">Physical Card &amp; Badge Scanner</h3>
              <p class="text-[10px] text-slate-400">Instant AI Contact &amp; Badge Recognition</p>
            </div>
          </div>
          <button type="button" onclick="closeCardScannerModal()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Hidden File Input for Camera / File Pick -->
        <input type="file" id="cardScannerFileInput" accept="image/*" capture="environment" class="hidden" onchange="handleCardImageSelected(event)">

        <!-- Initial Action Area -->
        <div id="scannerUploadState" class="space-y-3">
          <div onclick="document.getElementById('cardScannerFileInput').click()" class="cursor-pointer border-2 border-dashed border-white/20 hover:border-p22gold rounded-2xl p-6 text-center hover:bg-white/5 transition group space-y-2">
            <div class="w-12 h-12 rounded-full bg-white/5 group-hover:bg-p22gold/20 text-p22gold mx-auto flex items-center justify-center transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <p class="text-xs font-bold text-white group-hover:text-p22gold transition">Tap to Snap Photo or Choose File</p>
            <p class="text-[10.5px] text-slate-400">Position the business card or conference badge flat with good lighting.</p>
          </div>
        </div>

        <!-- Processing State -->
        <div id="scannerProcessingState" class="hidden text-center py-6 space-y-3">
          <div class="inline-block animate-spin w-8 h-8 border-3 border-p22gold border-t-transparent rounded-full"></div>
          <p class="text-xs font-bold text-white" id="scannerProgressText">Extracting Contact Credentials...</p>
          <p class="text-[10px] text-slate-400">Processing credentials with AI Vision &amp; OCR.</p>
        </div>

        <!-- Review & Submit Form -->
        <form id="scannerReviewForm" onsubmit="handleScannerFormSubmit(event)" class="hidden space-y-2.5">
          <div id="scannerImagePreviewWrap" class="relative rounded-xl overflow-hidden max-h-32 border border-white/10 hidden mb-2">
            <img id="scannerImagePreview" class="w-full h-full object-cover">
          </div>
          <div>
            <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Attendee / Contact Name *</label>
            <input type="text" id="scanName" required class="w-full px-3 py-2 rounded-xl glass-input text-white text-xs">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Agency / Company *</label>
              <input type="text" id="scanAgency" required class="w-full px-3 py-2 rounded-xl glass-input text-white text-xs">
            </div>
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Work Email</label>
              <input type="email" id="scanEmail" class="w-full px-3 py-2 rounded-xl glass-input text-white text-xs">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Phone Number</label>
              <input type="tel" id="scanPhone" class="w-full px-3 py-2 rounded-xl glass-input text-white text-xs">
            </div>
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Company Website</label>
              <input type="text" id="scanWebsite" placeholder="e.g. www.domain.com" class="w-full px-3 py-2 rounded-xl glass-input text-white text-xs">
            </div>
          </div>
          <div>
            <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Title / Scope / Procurement Notes</label>
            <textarea id="scanNotes" rows="2" class="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"></textarea>
          </div>

          <div class="pt-2 flex items-center gap-2">
            <button type="submit" id="scanSubmitBtn" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-montserrat font-bold text-xs hover:brightness-110 active:scale-95 transition shadow">
              <span>Confirm &amp; Connect Contact &rarr;</span>
            </button>
            <button type="button" onclick="resetCardScanner()" class="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition">
              Retake
            </button>
          </div>
        </form>

        <!-- Success Message -->
        <div id="scannerSuccessCard" class="hidden text-center py-4 space-y-2">
          <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 mx-auto flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h4 class="font-montserrat font-bold text-white text-sm">Contact Successfully Connected!</h4>
          <p class="text-xs text-emerald-200/90">Your credentials have been securely registered with P-22 Corp.</p>
          <div class="pt-2">
            <button type="button" onclick="closeCardScannerModal()" class="py-2 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition">
              Done
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  // Trigger Scanner Modal
  window.triggerCardScan = function (context = 'inline') {
    activeScanContext = context;
    const modal = ensureScannerModal();
    resetCardScanner();
    modal.classList.remove('hidden');
    // Preload Tesseract in background
    loadTesseract();
  };

  window.closeCardScannerModal = function () {
    const modal = document.getElementById('p22CardScannerModal');
    if (modal) modal.classList.add('hidden');
  };

  window.resetCardScanner = function () {
    const upload = document.getElementById('scannerUploadState');
    const proc = document.getElementById('scannerProcessingState');
    const form = document.getElementById('scannerReviewForm');
    const succ = document.getElementById('scannerSuccessCard');
    const fileInput = document.getElementById('cardScannerFileInput');
    if (upload) upload.classList.remove('hidden');
    if (proc) proc.classList.add('hidden');
    if (form) form.classList.add('hidden');
    if (succ) succ.classList.add('hidden');
    if (fileInput) fileInput.value = '';
    capturedImageDataUrl = null;
  };

  // Handle Image Chosen
  window.handleCardImageSelected = function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const upload = document.getElementById('scannerUploadState');
    const proc = document.getElementById('scannerProcessingState');
    const progText = document.getElementById('scannerProgressText');
    if (upload) upload.classList.add('hidden');
    if (proc) proc.classList.remove('hidden');
    if (progText) progText.textContent = 'Loading OCR Engine & Image...';

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const processedCanvas = preprocessImage(img);

        const imgPreview = document.getElementById('scannerImagePreview');
        const imgWrap = document.getElementById('scannerImagePreviewWrap');
        if (imgPreview && capturedImageDataUrl) {
          imgPreview.src = capturedImageDataUrl;
          if (imgWrap) imgWrap.classList.remove('hidden');
        }

        if (progText) progText.textContent = 'Transcribing Card with AI & Neural OCR...';

        (async function () {
          // 1. Try Cloud AI Vision first
          let aiSuccess = false;
          try {
            const aiRes = await fetch('/api/ocr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: capturedImageDataUrl || event.target.result }),
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              if (aiData.ok && aiData.data) {
                const d = aiData.data;
                document.getElementById('scanName').value = d.name || '';
                document.getElementById('scanAgency').value = d.agency || '';
                document.getElementById('scanEmail').value = d.email || '';
                document.getElementById('scanPhone').value = d.phone || '';
                if (document.getElementById('scanWebsite')) {
                  document.getElementById('scanWebsite').value = d.website || '';
                }
                document.getElementById('scanNotes').value = (d.title ? d.title + '\n' : '') + (d.notes || d.raw_text || 'AI Transcribed Card');
                aiSuccess = true;
              }
            }
          } catch (e) {
            console.warn('[!] AI Vision call error:', e);
          }

          // 2. If AI vision was not active or fell back, run on-device neural Tesseract
          if (!aiSuccess) {
            if (progText) progText.textContent = 'Running On-Device Neural OCR...';
            loadTesseract(async function () {
              let rawText = '';
              if (window.Tesseract) {
                try {
                  const res = await window.Tesseract.recognize(processedCanvas, 'eng');
                  rawText = res.data.text || '';
                } catch (err) {
                  console.warn('[!] Tesseract OCR recognition failed:', err);
                }
              }

              const parsed = parseCardText(rawText);

              document.getElementById('scanName').value = parsed.name || '';
              document.getElementById('scanAgency').value = parsed.agency || '';
              document.getElementById('scanEmail').value = parsed.email || '';
              document.getElementById('scanPhone').value = parsed.phone || '';
              document.getElementById('scanNotes').value = parsed.raw_ocr || 'Scanned Card';

              if (proc) proc.classList.add('hidden');
              const form = document.getElementById('scannerReviewForm');
              if (form) form.classList.remove('hidden');
            });
            return;
          }

          if (proc) proc.classList.add('hidden');
          const form = document.getElementById('scannerReviewForm');
          if (form) form.classList.remove('hidden');
        })();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle Submission from Scanner Form
  window.handleScannerFormSubmit = async function (e) {
    if (e) e.preventDefault();
    const submitBtn = document.getElementById('scanSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering & Connecting...';
    }

    const scanWebEl = document.getElementById('scanWebsite');
    const leadData = {
      timestamp: new Date().toISOString(),
      client_name: document.getElementById('scanName').value.trim(),
      client_agency: document.getElementById('scanAgency').value.trim(),
      client_email: document.getElementById('scanEmail').value.trim(),
      client_phone: document.getElementById('scanPhone').value.trim(),
      client_website: scanWebEl ? scanWebEl.value.trim() : '',
      notes: document.getElementById('scanNotes').value.trim(),
      photo_url: capturedImageDataUrl || window.p22LastScannedPhoto || 'Attached Thumbnail',
      interest: 'Expo Business Card / Badge OCR Intake',
      source: 'Physical Card / Badge OCR Scan',
    };

    // If on a staff profile, attach rep
    if (typeof currentRep !== 'undefined' && typeof TEAM_DATA !== 'undefined' && TEAM_DATA[currentRep]) {
      leadData.rep_name = TEAM_DATA[currentRep].name;
      leadData.rep_slug = currentRep;
    }

    // Submit
    await window.p22SubmitLead(leadData);

    // If context was inline on public card, also populate inline inputs
    if (activeScanContext === 'inline') {
      const inlineName = document.getElementById('inlineName');
      const inlineAgency = document.getElementById('inlineAgency');
      const inlineEmail = document.getElementById('inlineEmail');
      const inlinePhone = document.getElementById('inlinePhone');
      const inlineWebsite = document.getElementById('inlineWebsite');
      if (inlineName) inlineName.value = leadData.client_name;
      if (inlineAgency) inlineAgency.value = leadData.client_agency;
      if (inlineEmail) inlineEmail.value = leadData.client_email;
      if (inlinePhone) inlinePhone.value = leadData.client_phone;
      if (inlineWebsite && leadData.client_website) inlineWebsite.value = leadData.client_website;

      const previewWrap = document.getElementById('inlineScannedCardPreview');
      const previewThumb = document.getElementById('inlineScannedCardThumb');
      if (previewWrap && previewThumb && (capturedImageDataUrl || window.p22LastScannedPhoto)) {
        previewThumb.src = capturedImageDataUrl || window.p22LastScannedPhoto;
        previewWrap.classList.remove('hidden');
      }
    }

    // If in setup hub, re-render leads table
    if (typeof renderLeadsTable === 'function') {
      renderLeadsTable();
    }

    const form = document.getElementById('scannerReviewForm');
    const succ = document.getElementById('scannerSuccessCard');
    if (form) form.classList.add('hidden');
    if (succ) succ.classList.remove('hidden');
  };
})();
