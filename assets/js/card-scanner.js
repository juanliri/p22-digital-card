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
  let ocrImageDataUrl = null;

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
        enqueueOfflineLead(sanitized);
        return { ok: false, status: res.status, queued: true };
      }
    } catch (err) {
      console.warn('[P22-Lead] Network dispatch deferred to offline storage:', err.message);
      try { enqueueOfflineLead(sanitized); } catch (e) {}
      return { ok: false, offline: true, queued: true, error: err.message };
    }
  };

  // Offline submission queue (localStorage) - flushed automatically when connectivity returns
  function enqueueOfflineLead(lead) {
    const q = JSON.parse(localStorage.getItem('p22_offline_queue') || '[]');
    q.push(lead);
    localStorage.setItem('p22_offline_queue', JSON.stringify(q));
  }

  window.p22FlushOfflineQueue = async function () {
    try {
      const q = JSON.parse(localStorage.getItem('p22_offline_queue') || '[]');
      if (!q.length || navigator.onLine === false) return { count: 0 };
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: q }),
      });
      if (res.ok) {
        localStorage.removeItem('p22_offline_queue');
        return { ok: true, count: q.length };
      }
    } catch (e) { /* retry on next trigger */ }
    return { ok: false };
  };
  window.addEventListener('online', () => window.p22FlushOfflineQueue());
  window.addEventListener('load', () => setTimeout(() => window.p22FlushOfflineQueue(), 3000));

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

  // Pre-process canvas image for OCR contrast and generate optimized payloads
  function preprocessImage(img, maxWidth = 1600) {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxWidth) {
      if (width > height) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxWidth) / height);
        height = maxWidth;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // 1. High-res pre-processed image with contrast boost & grayscale for OCR (~250-400KB)
    const contrastCanvas = preprocessCardImage(canvas);
    ocrImageDataUrl = contrastCanvas.toDataURL('image/jpeg', 0.85);

    // 2. Compact natural-color thumbnail for lead record / local storage / preview
    const thumbCanvas = document.createElement('canvas');
    const thumbWidth = 360;
    const thumbHeight = Math.round((height * thumbWidth) / width);
    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
    capturedImageDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
    window.p22LastScannedPhoto = capturedImageDataUrl;

    return contrastCanvas;
  }

  // Canvas grayscale + contrast stretch to improve Tesseract accuracy under glare / dim light
  function preprocessCardImage(srcCanvas) {
    const out = document.createElement('canvas');
    out.width = srcCanvas.width;
    out.height = srcCanvas.height;
    const ctx = out.getContext('2d');
    ctx.drawImage(srcCanvas, 0, 0);
    try {
      const img = ctx.getImageData(0, 0, out.width, out.height);
      const d = img.data;
      let min = 255, max = 0;
      for (let i = 0; i < d.length; i += 4) {
        const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        d[i] = d[i + 1] = d[i + 2] = g;
        if (g < min) min = g;
        if (g > max) max = g;
      }
      const range = Math.max(1, max - min);
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.min(255, Math.max(0, ((d[i] - min) / range) * 255));
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      ctx.putImageData(img, 0, 0);
    } catch (e) {
      console.warn('[!] preprocessCardImage fallback to raw canvas:', e);
      return srcCanvas;
    }
    return out;
  }
  window.preprocessCardImage = preprocessCardImage;

  // JSON schema validation for extraction outputs (AI or OCR) - never trust raw model output
  function validateExtraction(d) {
    const str = v => (typeof v === 'string' ? v.trim() : '');
    const out = {
      name: str(d && d.name),
      agency: str(d && d.agency),
      title: str(d && d.title),
      email: str(d && d.email).toLowerCase(),
      phone: str(d && d.phone),
      website: str(d && d.website),
      notes: str((d && (d.notes || d.raw_text || d.raw_ocr)) || ''),
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(out.email)) out.email = '';
    if (out.phone.replace(/\D/g, '').length < 7) out.phone = '';
    out.name = out.name.slice(0, 80);
    out.agency = out.agency.slice(0, 120);
    out.notes = out.notes.slice(0, 1200);
    return out;
  }

  // Regex Heuristics to parse Business Card text
  function parseCardText(rawText) {
    const lines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 1);

    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    // Tolerant: accepts icons/labels/odd separators ('T. (555) 019-2834', '555·019·2834', '555 019 2834')
    const phoneRegex = /(?:\+?1[\s.\-·•]*)?\(?([0-9]{3})\)?[\s.\-·•]*([0-9]{3})[\s.\-·•]*([0-9]{4})/i;

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
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md hidden transition-all duration-300 overflow-y-auto';
    modal.innerHTML = `
      <div class="relative w-full max-w-md rounded-3xl bg-slate-900 border border-p22gold/50 shadow-2xl p-5 sm:p-6 text-white space-y-4 my-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-p22gold/20 text-p22gold flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div>
              <h3 class="text-sm font-montserrat font-bold text-white">Card &amp; Badge Scanner</h3>
              <p class="text-[10px] text-slate-400">Snap a card or badge to add the contact</p>
            </div>
          </div>
          <button type="button" onclick="closeCardScannerModal()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition" aria-label="Close Scanner">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Accessible, WebKit-compliant Native File Inputs (kept in DOM with zero display:none) -->
        <input type="file" id="cardScannerCameraInput" accept="image/*" capture="environment" class="sr-only" style="position:fixed;top:-1000px;left:-1000px;opacity:0;" onchange="handleCardImageSelected(event)">
        <input type="file" id="cardScannerGalleryInput" accept="image/*" class="sr-only" style="position:fixed;top:-1000px;left:-1000px;opacity:0;" onchange="handleCardImageSelected(event)">

        <!-- Initial Action Area with Dual Native Labels for 100% Apple Safari & Mobile Compatibility -->
        <div id="scannerUploadState" class="space-y-3">
          <!-- Primary Action: Snap Photo Directly (Native Camera) -->
          <label for="cardScannerCameraInput" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-95 text-white font-montserrat font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transition select-none btn-bounce">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
            <span>📷 Take Photo with Camera</span>
          </label>

          <!-- Secondary Action: Choose Existing Image from Photos / Files -->
          <label for="cardScannerGalleryInput" class="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 border border-white/20 font-montserrat font-semibold text-xs flex items-center justify-center gap-2.5 cursor-pointer transition select-none">
            <svg class="w-4 h-4 text-p22gold shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>📁 Upload from Photos / Files</span>
          </label>

          <p class="text-[10px] text-center text-slate-400">Position the business card or conference badge flat with good lighting.</p>
        </div>

        <!-- Processing State -->
        <div id="scannerProcessingState" class="hidden text-center py-6 space-y-3">
          <div class="inline-block animate-spin w-8 h-8 border-3 border-p22gold border-t-transparent rounded-full"></div>
          <p class="text-xs font-bold text-white" id="scannerProgressText">Reading the card...</p>
          <p class="text-[10px] text-slate-400">This only takes a few seconds.</p>
        </div>

        <!-- Scoped High-Contrast Style Injection (Prevents iOS Safari / Autofill White-on-White) -->
        <style>
          #p22CardScannerModal input,
          #p22CardScannerModal textarea {
            background-color: #0B132B !important;
            color: #FFFFFF !important;
            -webkit-text-fill-color: #FFFFFF !important;
            border: 1px solid rgba(255, 255, 255, 0.22) !important;
          }
          #p22CardScannerModal input:focus,
          #p22CardScannerModal textarea:focus {
            border-color: #C9A227 !important;
            outline: none !important;
            box-shadow: 0 0 0 2px rgba(201, 162, 39, 0.4) !important;
            background-color: #0E1A38 !important;
          }
          #p22CardScannerModal input:-webkit-autofill,
          #p22CardScannerModal input:-webkit-autofill:hover,
          #p22CardScannerModal input:-webkit-autofill:focus,
          #p22CardScannerModal textarea:-webkit-autofill {
            -webkit-text-fill-color: #FFFFFF !important;
            -webkit-box-shadow: 0 0 0px 1000px #0B132B inset !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }
          #p22CardScannerModal input::placeholder,
          #p22CardScannerModal textarea::placeholder {
            color: #94A3B8 !important;
            opacity: 1 !important;
          }
        </style>

        <!-- Review & Submit Form -->
        <form id="scannerReviewForm" onsubmit="handleScannerFormSubmit(event)" class="hidden space-y-2.5">
          <div id="scannerImagePreviewWrap" class="relative rounded-xl overflow-hidden max-h-36 border border-white/15 hidden mb-2 shadow-inner">
            <img id="scannerImagePreview" class="w-full h-full object-cover">
          </div>
          <div>
            <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Attendee / Contact Name *</label>
            <input type="text" id="scanName" required style="background-color:#0B132B!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;" class="w-full px-3 py-2 rounded-xl text-white text-xs">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Agency / Company *</label>
              <input type="text" id="scanAgency" required style="background-color:#0B132B!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;" class="w-full px-3 py-2 rounded-xl text-white text-xs">
            </div>
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Work Email</label>
              <input type="email" id="scanEmail" style="background-color:#0B132B!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;" class="w-full px-3 py-2 rounded-xl text-white text-xs">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Phone Number</label>
              <input type="tel" id="scanPhone" style="background-color:#0B132B!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;" class="w-full px-3 py-2 rounded-xl text-white text-xs">
            </div>
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Company Website</label>
              <input type="text" id="scanWebsite" placeholder="e.g. www.domain.com" style="background-color:#0B132B!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;" class="w-full px-3 py-2 rounded-xl text-white text-xs">
            </div>
          </div>
          <div>
            <label class="block text-[10.5px] font-semibold text-slate-300 mb-0.5">Title / Notes</label>
            <textarea id="scanNotes" rows="2" style="background-color:#0B132B!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;" class="w-full px-3 py-2 rounded-xl text-white text-xs font-mono"></textarea>
          </div>

          <div class="pt-2 flex items-center gap-2">
            <button type="submit" id="scanSubmitBtn" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-montserrat font-bold text-xs hover:brightness-110 active:scale-95 transition shadow">
              <span>Save Contact →</span>
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
          <h4 class="font-montserrat font-bold text-white text-sm">Contact Saved!</h4>
          <p class="text-xs text-emerald-200/90">Thank you. Your details have been shared with P-22 Corp.</p>
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
    if (context === 'inline' && typeof revealStep2Exchange === 'function') {
      revealStep2Exchange(true);
    }
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
    const camInput = document.getElementById('cardScannerCameraInput');
    const galInput = document.getElementById('cardScannerGalleryInput');
    if (upload) upload.classList.remove('hidden');
    if (proc) proc.classList.add('hidden');
    if (form) form.classList.add('hidden');
    if (succ) succ.classList.add('hidden');
    if (camInput) camInput.value = '';
    if (galInput) galInput.value = '';
    capturedImageDataUrl = null;
    ocrImageDataUrl = null;
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
    if (progText) progText.textContent = 'Preparing your photo...';

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const processedCanvas = preprocessImage(img);

        const imgPreview = document.getElementById('scannerImagePreview');
        const imgWrap = document.getElementById('scannerImagePreviewWrap');
        if (imgPreview && (capturedImageDataUrl || ocrImageDataUrl)) {
          imgPreview.src = capturedImageDataUrl || ocrImageDataUrl;
          if (imgWrap) imgWrap.classList.remove('hidden');
        }

        if (progText) progText.textContent = 'Reading the card...';

        (async function () {
          // 1. Try Cloud AI Vision first
          let aiSuccess = false;
          try {
            const aiRes = await fetch('/api/ocr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: ocrImageDataUrl || capturedImageDataUrl }),
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              if (aiData.ok && aiData.data) {
                const d = validateExtraction(aiData.data);
                document.getElementById('scanName').value = d.name || '';
                document.getElementById('scanAgency').value = d.agency || '';
                document.getElementById('scanEmail').value = d.email || '';
                document.getElementById('scanPhone').value = d.phone || '';
                if (document.getElementById('scanWebsite')) {
                  document.getElementById('scanWebsite').value = d.website || '';
                }
                document.getElementById('scanNotes').value = (d.title ? d.title + '\n' : '') + (d.notes || d.raw_text || 'Scanned Card');
                aiSuccess = true;
              }
            }
          } catch (e) {
            console.warn('[!] AI Vision call error:', e);
          }

          // 2. If AI vision was not active or fell back, run on-device neural Tesseract with safety timeout
          if (!aiSuccess) {
            if (progText) progText.textContent = 'Still reading the card...';

            let tesseractHandled = false;
            // 8-second safety fallback: never leave user stuck on spinner
            const fallbackTimeout = setTimeout(() => {
              if (!tesseractHandled) {
                tesseractHandled = true;
                if (proc) proc.classList.add('hidden');
                const form = document.getElementById('scannerReviewForm');
                if (form) form.classList.remove('hidden');
              }
            }, 8000);

            loadTesseract(async function () {
              let rawText = '';
              if (window.Tesseract) {
                try {
                  const res = await window.Tesseract.recognize(preprocessCardImage(processedCanvas), 'eng');
                  rawText = res.data.text || '';
                } catch (err) {
                  console.warn('[!] Tesseract OCR recognition error:', err);
                }
              }

              if (!tesseractHandled) {
                tesseractHandled = true;
                clearTimeout(fallbackTimeout);
                const parsed = validateExtraction(parseCardText(rawText));

                document.getElementById('scanName').value = parsed.name || '';
                document.getElementById('scanAgency').value = parsed.agency || '';
                document.getElementById('scanEmail').value = parsed.email || '';
                document.getElementById('scanPhone').value = parsed.phone || '';
                document.getElementById('scanNotes').value = parsed.notes || 'Scanned Card';

                if (proc) proc.classList.add('hidden');
                const form = document.getElementById('scannerReviewForm');
                if (form) form.classList.remove('hidden');
              }
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
      interest: 'Expo Business Card / Badge Scan',
      source: 'Card / Badge Scan',
    };

    // If on a staff profile or badge, attach rep
    if (typeof currentRep !== 'undefined' && typeof TEAM_DATA !== 'undefined' && TEAM_DATA[currentRep]) {
      leadData.rep_name = TEAM_DATA[currentRep].name;
      leadData.rep_slug = currentRep;
    } else if (typeof activeRep !== 'undefined' && activeRep) {
      leadData.rep_name = activeRep.name;
      leadData.rep_slug = activeRep.slug;
    } else if (typeof window.activeRep !== 'undefined' && window.activeRep) {
      leadData.rep_name = window.activeRep.name;
      leadData.rep_slug = window.activeRep.slug;
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
  // QR fallback: Html5Qrcode, back camera by default; parses vCard / MECARD / plain URL
  window.startQrFallbackScan = function () {
    const hostId = 'p22QrFallbackHost';
    let host = document.getElementById(hostId);
    if (!host) {
      host = document.createElement('div');
      host.id = hostId;
      host.style.cssText = 'width:100%;margin-top:8px;border-radius:12px;overflow:hidden;';
      const upload = document.getElementById('scannerUploadState');
      if (upload) upload.appendChild(host);
    }
    const run = function () {
      const qr = new window.Html5Qrcode(hostId);
      qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, function (text) {
        qr.stop().catch(function () {});
        const f = { name: '', agency: '', email: '', phone: '', website: '', notes: text };
        const g = function (re) { const m = text.match(re); return m ? m[1].trim() : ''; };
        if (/BEGIN:VCARD/i.test(text)) {
          f.name = g(/^FN:(.+)$/im); f.agency = g(/^ORG:(.+)$/im);
          f.email = g(/EMAIL[^:]*:(.+)$/im); f.phone = g(/TEL[^:]*:(.+)$/im); f.website = g(/URL[^:]*:(.+)$/im);
        } else if (/^MECARD:/i.test(text)) {
          f.name = g(/N:([^;]+)/i).replace(',', ' '); f.email = g(/EMAIL:([^;]+)/i); f.phone = g(/TEL:([^;]+)/i); f.agency = g(/ORG:([^;]+)/i);
        } else if (/^https?:\/\//i.test(text)) { f.website = text; }
        const v = validateExtraction(f);
        document.getElementById('scanName').value = v.name;
        document.getElementById('scanAgency').value = v.agency;
        document.getElementById('scanEmail').value = v.email;
        document.getElementById('scanPhone').value = v.phone;
        if (document.getElementById('scanWebsite')) document.getElementById('scanWebsite').value = v.website;
        document.getElementById('scanNotes').value = v.notes;
        document.getElementById('scannerUploadState').classList.add('hidden');
        document.getElementById('scannerReviewForm').classList.remove('hidden');
      }, function () {}).catch(function (err) { console.warn('[!] QR camera unavailable:', err); });
    };
    if (window.Html5Qrcode) return run();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    s.onload = run;
    document.head.appendChild(s);
  };

  // Inject QR fallback button next to the card capture inputs
  const _origEnsure = ensureScannerModal;
  ensureScannerModal = function () {
    const m = _origEnsure();
    if (!m.querySelector('#p22QrBtn')) {
      const up = m.querySelector('#scannerUploadState');
      if (up) {
        const b = document.createElement('button');
        b.type = 'button'; b.id = 'p22QrBtn';
        b.className = 'w-full py-3 px-4 rounded-2xl bg-white/5 border border-white/15 text-slate-200 text-xs font-bold';
        b.textContent = '🔳 Scan QR Code Instead';
        b.onclick = window.startQrFallbackScan;
        up.appendChild(b);
      }
    }
    return m;
  };
})();
