/**
 * P-22 Badge Telemetry & User Journey Tracker
 * Sends cookieless, privacy-preserving event beacons to /api/track.
 * Groups visitor actions by session ID (sid) and IP.
 * Tracks ALL button interactions, links, downloads, and lead submissions.
 * Compliant with NIST SP 800-171 AU-2 & OMB M-10-22.
 */

(function () {
  'use strict';

  function getSessionId() {
    try {
      let sid = sessionStorage.getItem('p22_sid');
      if (!sid) {
        sid = 'usr_' + Math.random().toString(36).substring(2, 7) + Date.now().toString(36).slice(-4);
        sessionStorage.setItem('p22_sid', sid);
      }
      return sid;
    } catch (e) {
      return 'usr_anon';
    }
  }

  function getActiveRep() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('pedro')) return 'pedro';
    if (path.includes('eduardo')) return 'eduardo';
    if (path.includes('marleni')) return 'marleni';
    if (path.includes('bids')) return 'bids';
    if (path.includes('logistics')) return 'logistics';
    const params = new URLSearchParams(window.location.search);
    if (params.get('rep')) return params.get('rep').toLowerCase();
    return 'general';
  }

  function getTrafficSource() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('nfc') === '1' || params.get('source') === 'nfc' || params.get('src') === 'nfc') return 'nfc';
    if (params.get('qr') === '1' || params.get('source') === 'expo_qr' || params.get('src') === 'expo_qr') return 'expo_qr';
    if (params.get('sig') === '1' || params.get('source') === 'email_sig' || params.get('src') === 'email_sig') return 'email_sig';
    return params.get('source') || params.get('src') || 'direct';
  }

  window.p22Track = function (event, details, customRep) {
    try {
      const rep = customRep || getActiveRep();
      const source = getTrafficSource();
      const sid = getSessionId();

      const payload = {
        rep,
        event: event || 'view',
        source,
        sid,
        details: details || {},
        timestamp: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        const blob = new Blob([dataStr], { type: 'application/json' });
        navigator.sendBeacon('/api/track', blob);
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: dataStr,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {
      // Telemetry must never throw or break UI
    }
  };

  // Global Lead Ingestion Helper
  window.p22SubmitLead = async function (leadData) {
    try {
      const sanitized = {
        timestamp: leadData.timestamp || new Date().toISOString(),
        rep_name:
          leadData.rep_name ||
          leadData.rep ||
          (typeof currentRep !== 'undefined' && typeof TEAM_DATA !== 'undefined' && TEAM_DATA[currentRep]
            ? TEAM_DATA[currentRep].name
            : 'General Staff'),
        client_name: leadData.client_name || leadData.name || '',
        client_agency: leadData.client_agency || leadData.agency || '',
        client_email: leadData.client_email || leadData.email || '',
        client_phone: leadData.client_phone || leadData.phone || '',
        interest: leadData.interest || leadData.scope || 'Procurement & Logistics Coordination',
        notes: leadData.notes || leadData.extracted_text || leadData.raw_ocr || '',
        photo_url: leadData.photo_url || leadData.card_photo || '',
        source: leadData.source || 'Digital Card Exchange',
        sid: getSessionId(),
      };

      // 1. Offline storage
      try {
        const stored = JSON.parse(localStorage.getItem('p22_leads') || '[]');
        stored.unshift(sanitized);
        localStorage.setItem('p22_leads', JSON.stringify(stored));
        localStorage.setItem('p22_expo_leads', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      // 2. Also log a telemetry event into Sheet1 tied to this user session
      window.p22Track('lead_submitted', {
        name: sanitized.client_name,
        agency: sanitized.client_agency,
        email: sanitized.client_email,
        source: sanitized.source,
      });

      // 3. Dispatch to /api/lead (Leads_Vault)
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      });

      const json = await res.json();
      console.log('[+] Lead archived to Leads_Vault:', json);
      return json;
    } catch (err) {
      console.warn('Lead submit deferred to offline:', err.message);
      try {
        const q = JSON.parse(localStorage.getItem('p22_offline_queue') || '[]');
        q.push(sanitized);
        localStorage.setItem('p22_offline_queue', JSON.stringify(q));
      } catch (e) {}
      return { ok: false, offline: true, queued: true, error: err.message };
    }
  };

  // Auto-track initial page view
  document.addEventListener('DOMContentLoaded', function () {
    window.p22Track('page_view', { title: document.title, url: window.location.pathname });

    // Delegated click listener for ALL key actions and buttons
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const btnText = (target.innerText || target.getAttribute('aria-label') || target.title || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 45);
      const btnId = target.id || '';

      const onclickAttr = target.getAttribute('onclick') || '';

      if (href.startsWith('tel:') || btnId === 'callAction' || onclickAttr.includes("'Call'")) {
        window.p22Track('dial', { phone: href.replace('tel:', '') || '18887222675', label: btnText || 'Call' });
      } else if (href.startsWith('mailto:') || btnId === 'emailAction' || onclickAttr.includes("'Email'")) {
        window.p22Track('email', { email: href.replace('mailto:', '').split('?')[0] || 'pfelipe@p22corp.com', label: btnText || 'Email' });
      } else if (href.startsWith('sms:') || btnId === 'smsAction' || onclickAttr.includes("'SMS'")) {
        window.p22Track('sms', { phone: href.replace('sms:', '') || '18887222675', label: btnText || 'SMS' });
      } else if (href.includes('.vcf') || btnId === 'saveContactBtn' || target.classList.contains('save-contact-btn') || onclickAttr.includes('downloadActiveVCard') || btnText.includes('Save Contact')) {
        window.p22Track('vcard_saved', { href, label: btnText || 'Save Contact' });
      } else if (href.includes('.pkpass') || btnId.includes('Wallet') || btnId === 'cardGoogleWalletBtn' || href.includes('wallet') || onclickAttr.includes('downloadActivePass') || onclickAttr.includes('GoogleWalletPass')) {
        window.p22Track('wallet_install', { label: btnText || 'Digital Wallet Pass' });
      } else if (btnId === 'qrZoomBtn' || btnId === 'qrZoomToggleBtn' || onclickAttr.includes('toggleExpoQrZoom') || target.closest('#qrModal') || target.classList.contains('qr-zoom-trigger')) {
        window.p22Track('qr_zoom', { label: btnText || 'Enlarge QR' });
      } else if (onclickAttr.includes('openConsultationModal') || btnId.includes('consultation')) {
        window.p22Track('consultation_open', { label: btnText || 'Book Consultation' });
      } else if (href.includes('.pdf') || href.includes('capability-statement')) {
        window.p22Track('pdf_view', { file: href, label: btnText || 'Capability Statement' });
      } else if (btnId.includes('step2') || target.closest('#step2TriggerBar') || onclickAttr.includes('revealStep2Exchange')) {
        window.p22Track('step2_toggle', { label: btnText || 'Exchange Contact' });
      } else if (onclickAttr.includes('triggerCardScan')) {
        window.p22Track('card_scan_trigger', { label: btnText || 'Scan Card' });
      } else if (btnId.includes('staffTab') || target.classList.contains('staff-tab-btn')) {
        window.p22Track('staff_tab_switch', { label: btnText });
      } else if (target.tagName.toLowerCase() === 'button' || (target.tagName.toLowerCase() === 'a' && href && !href.startsWith('#'))) {
        // Any other button or external link
        window.p22Track('button_click', {
          id: btnId || undefined,
          href: href || undefined,
          label: btnText || 'button',
        });
      }
    });
  });
})();
