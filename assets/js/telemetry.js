/**
 * P-22 Badge Telemetry Client
 * Sends cookieless, privacy-preserving event beacons to /api/track.
 * Compliant with NIST SP 800-171 AU-2 & OMB M-10-22 (Zero Cookies, Zero PII).
 */

(function () {
  'use strict';

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
    if (params.get('nfc') === '1' || params.get('source') === 'nfc') return 'nfc';
    if (params.get('qr') === '1' || params.get('source') === 'expo_qr') return 'expo_qr';
    if (params.get('sig') === '1' || params.get('source') === 'email_sig') return 'email_sig';
    return params.get('source') || 'direct';
  }

  window.p22Track = function (event, details, customRep) {
    try {
      const rep = customRep || getActiveRep();
      const source = getTrafficSource();
      const payload = {
        rep,
        event: event || 'view',
        source,
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

  // Auto-track initial page view
  document.addEventListener('DOMContentLoaded', function () {
    window.p22Track('page_view', { title: document.title });

    // Delegated click listener for key actions
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';

      if (href.startsWith('tel:')) {
        window.p22Track('dial', { phone: href.replace('tel:', '') });
      } else if (href.startsWith('mailto:')) {
        window.p22Track('email', { email: href.replace('mailto:', '') });
      } else if (href.includes('.vcf') || target.id === 'saveContactBtn' || target.classList.contains('save-contact-btn')) {
        window.p22Track('vcard_saved', { href });
      } else if (href.includes('.pkpass') || target.classList.contains('wallet-btn')) {
        window.p22Track('wallet_install', { type: 'apple_pkpass' });
      } else if (target.id === 'qrZoomBtn' || target.closest('#qrModal') || target.classList.contains('qr-zoom-trigger')) {
        window.p22Track('qr_zoom', {});
      }
    });
  });
})();
