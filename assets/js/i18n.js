/**
 * P-22 CORP — Bilingual (EN / ES) Client-Side Localization Engine
 * Instant language switching for expo attendees (English / Español).
 * Zero page refresh, zero external dependencies, 100% offline-ready.
 */

(function () {
  'use strict';

  const DICTIONARY = {
    es: {
      'Federal Defense & Commercial Supply': 'Suministro Federal y Comercial',
      'Federal Defense &amp; Commercial Supply': 'Suministro Federal y Comercial',
      'Share': 'Compartir',
      'SAM.GOV ACTIVE': 'ACTIVO EN SAM.GOV',
      'Save Contact to Phone (.vcf)': 'Guardar Contacto en el Teléfono (.vcf)',
      '1-Tap Action • iOS: Tap "Create New Contact" at bottom • Android: Choose "Contacts"': '1 Toque • iOS: Seleccione "Crear nuevo contacto" • Android: Elija "Contactos"',
      'Apple Wallet': 'Apple Wallet',
      'Google Wallet': 'Google Wallet',
      'Call': 'Llamar',
      'Email': 'Correo',
      'Message': 'Mensaje',
      'WhatsApp': 'WhatsApp',
      'Step 2: Reciprocal Contact Exchange': 'Paso 2: Intercambiar Datos de Contacto',
      'Exchange Contact Info': 'Intercambiar Contacto',
      'Scan Card (OCR)': 'Escanear Tarjeta (OCR)',
      'Scan Physical Card / Badge': 'Escanear Tarjeta Física / Credencial',
      'Direct Phone (Optional)': 'Teléfono Directo (Opcional)',
      'Company Website (Optional)': 'Sitio Web de la Empresa (Opcional)',
      'Send Contact Information': 'Enviar Información de Contacto',
      'Lock In 15-Minute Briefing': 'Agendar Sesión Ejecutiva (15 Min)',
      'Schedule 15-Minute Briefing': 'Agendar Sesión Ejecutiva (15 Min)',
      'Briefing Confirmed!': '¡Sesión Confirmada!',
      'Add to Google Calendar': 'Agregar a Google Calendar',
      'Apple / Outlook Calendar (.ICS)': 'Calendario Outlook / Apple (.ICS)',
      'Done • Close': 'Listo • Cerrar',
      'Dallas-Fort Worth HQ • Nationwide Response': 'Sede en Dallas-Fort Worth • Cobertura Nacional',
      'Download Capability Statement (PDF)': 'Descargar Declaración de Capacidad (PDF)',
      'Capability Statement': 'Declaración de Capacidad',
      'Quick RFQ / Materials Request': 'Solicitud Rápida de Materiales / Cotización',
      'Material Hauling & Logistics': 'Transporte de Materiales y Logística',
      'Crushed Stone & Aggregates': 'Piedra Triturada y Agregados',
      'TxDOT Flexbase & Select Fill': 'Base TxDOT y Relleno Seleccionado',
    },
    en: {} // Default English
  };

  let currentLang = 'en';

  function initLanguage() {
    const saved = localStorage.getItem('p22_lang');
    if (saved === 'es' || saved === 'en') {
      currentLang = saved;
    } else {
      const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (browserLang.startsWith('es')) {
        currentLang = 'es';
      }
    }
    applyLanguage(currentLang);
    renderToggleBtn();
  }

  function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    localStorage.setItem('p22_lang', currentLang);
    applyLanguage(currentLang);
    renderToggleBtn();
  }

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    const dict = DICTIONARY[lang] || {};

    // Translate all elements with text that matches dictionary keys
    const elements = document.querySelectorAll('button, a, span, p, h1, h2, h3, h4, label');
    elements.forEach(el => {
      // Store original text if not already stored
      if (!el.hasAttribute('data-orig-en')) {
        const text = el.textContent.trim();
        if (DICTIONARY.es[text]) {
          el.setAttribute('data-orig-en', text);
        }
      }

      const orig = el.getAttribute('data-orig-en');
      if (orig) {
        if (lang === 'es' && dict[orig]) {
          // If element has only text inside
          if (el.children.length === 0) {
            el.textContent = dict[orig];
          } else {
            // Find child span or text node
            const span = el.querySelector('span');
            if (span && span.textContent.trim() === orig) {
              span.textContent = dict[orig];
            }
          }
        } else if (lang === 'en') {
          if (el.children.length === 0) {
            el.textContent = orig;
          } else {
            const span = el.querySelector('span');
            if (span) span.textContent = orig;
          }
        }
      }
    });
  }

  function renderToggleBtn() {
    let btn = document.getElementById('p22LangToggleBtn');
    if (!btn) {
      // Look for header
      const header = document.querySelector('header');
      if (header) {
        btn = document.createElement('button');
        btn.id = 'p22LangToggleBtn';
        btn.type = 'button';
        btn.onclick = toggleLanguage;
        btn.className = 'px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white active:scale-95 transition shadow text-xs font-montserrat font-bold flex items-center gap-1 shrink-0';
        // Insert right before the Share button
        const shareBtn = header.querySelector('button');
        if (shareBtn) {
          header.insertBefore(btn, shareBtn);
        } else {
          header.appendChild(btn);
        }
      }
    }
    if (btn) {
      btn.innerHTML = currentLang === 'en' 
        ? '<span class="text-sm">🇲🇽</span><span>ES</span>' 
        : '<span class="text-sm">🇺🇸</span><span>EN</span>';
      btn.title = currentLang === 'en' ? 'Cambiar a Español' : 'Switch to English';
    }
  }

  window.p22SetLanguage = function(lang) {
    if (lang === 'es' || lang === 'en') {
      currentLang = lang;
      localStorage.setItem('p22_lang', lang);
      applyLanguage(lang);
      renderToggleBtn();
    }
  };

  window.p22ToggleLanguage = toggleLanguage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
  } else {
    initLanguage();
  }
})();
