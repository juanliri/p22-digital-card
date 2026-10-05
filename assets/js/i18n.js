/**
 * P-22 CORP — Bilingual (EN / ES) Client-Side Localization Engine
 * Instant language switching for expo attendees (English / Español).
 * Zero page refresh, zero external dependencies, 100% offline-ready.
 */

(function () {
  'use strict';

  const DICTIONARY = {
    es: {
      // Top Bar & Global
      'Federal Defense & Commercial Supply': 'Suministro Federal y Comercial',
      'Federal Defense &amp; Commercial Supply': 'Suministro Federal y Comercial',
      'Share': 'Compartir',
      'SAM.GOV ACTIVE': 'ACTIVO EN SAM.GOV',

      // Actions
      'Save Contact to Phone': 'Guardar Contacto en el Teléfono',
      'Save Contact to Phone (.vcf)': 'Guardar Contacto en el Teléfono (.vcf)',
      'One tap to save to your contacts': 'Un toque para guardar en tus contactos',
      'Save to Apple': 'Guardar en Apple',
      'Save to Google': 'Guardar en Google',
      'Call': 'Llamar',
      'Email': 'Correo',
      'Message': 'Mensaje',
      'SMS / Text': 'SMS / Texto',
      'WhatsApp': 'WhatsApp',

      // Bios & Titles
      'Managing Director & Federal Contract Lead': 'Director General y Líder de Contratos Federales',
      'Director of Commercial Sales & Material Supply': 'Director de Ventas Comerciales y Suministro de Materiales',
      'Director of Finance & Contract Compliance': 'Directora de Finanzas y Cumplimiento de Contratos',
      'Federal Procurement & Rapid RFQ Desk': 'Mesa de Adquisiciones Federales y Cotizaciones Rápidas',
      'Central Material Staging & Fleet Logistics': 'Centro de Logística de Flotas y Almacenamiento Central',
      
      'Executive lead for federal procurement, prime contractor partnerships, and commercial supply agreements. Oversees end-to-end contracting packages, rapid RFQ turnarounds, and nationwide infrastructure fulfillment.': 'Líder ejecutivo para adquisiciones federales, asociaciones con contratistas principales y acuerdos de suministro comercial. Supervisa paquetes de contratación de principio a fin, tiempos de respuesta rápidos para cotizaciones y cumplimiento de infraestructura a nivel nacional.',
      'Directs commercial supply sales, manufacturer allocation, and prime vendor networks. Focuses on competitive project pricing, guaranteed delivery schedules, and dedicated account support.': 'Dirige las ventas de suministro comercial, asignación de fabricantes y redes de proveedores principales. Se enfoca en precios competitivos para proyectos, cronogramas de entrega garantizados y soporte de cuentas dedicado.',
      'Oversees corporate financial operations, federal billing compliance, and prime contract accounting. Ensures rapid vendor onboarding, transparent invoicing, and prompt contract closeouts.': 'Supervisa operaciones financieras corporativas, cumplimiento de facturación federal y contabilidad de contratos principales. Garantiza la integración rápida de proveedores, facturación transparente y cierres rápidos de contratos.',
      'Centralized bidding desk delivering 24-hour takeoff reviews, competitive pricing, and certified procurement packages for federal primes and government buyers nationwide.': 'Mesa centralizada de licitaciones que ofrece revisiones de presupuestos en 24 horas, precios competitivos y paquetes de adquisición certificados para contratistas federales principales y compradores gubernamentales a nivel nacional.',
      'Strategic Dallas-Fort Worth staging and warehousing facility providing expedited freight, secure material holding, and guaranteed on-time site delivery nationwide.': 'Instalación estratégica de almacenamiento en Dallas-Fort Worth que proporciona carga acelerada, retención segura de materiales y entrega puntual garantizada en el sitio a nivel nacional.',

      'Dallas-Fort Worth HQ • Nationwide Response': 'Sede en Dallas-Fort Worth • Cobertura Nacional',
      'Dallas Sales Office • DFW Logistics Hub': 'Oficina de Ventas en Dallas • Centro Logístico DFW',
      'Dallas Corporate Office • DFW Hub': 'Oficina Corporativa en Dallas • Centro DFW',
      'Dallas Logistics Hub • 24/7 Rapid Response Desk': 'Centro Logístico en Dallas • Mesa de Respuesta Rápida 24/7',
      'Dallas Logistics Hub • DFW Staging Facility': 'Centro Logístico en Dallas • Instalación de Almacenamiento DFW',

      // Buttons Step 1
      'Book 15-Min Briefing with Pedro': 'Agendar Sesión de 15 Min. con Pedro',
      'Book 15-Min Briefing with Eduardo': 'Agendar Sesión de 15 Min. con Eduardo',
      'Book 15-Min Briefing with Marleni': 'Agendar Sesión de 15 Min. con Marleni',
      'Book 15-Min Briefing with Procurement Desk': 'Agendar Sesión de 15 Min. con Adquisiciones',
      'Book 15-Min Briefing with Logistics Hub': 'Agendar Sesión de 15 Min. con Logística',
      'Calendar →': 'Calendario →',

      // Step 2 Trigger
      'Step 2 • Connect': 'Paso 2 • Conectar',
      '24-Hr Response': 'Respuesta en 24h',
      'Share Your Details': 'Comparte tus Datos',
      'Share Your Details with Pedro:': 'Comparte tus Datos con Pedro:',
      'Share Your Details with Eduardo:': 'Comparte tus Datos con Eduardo:',
      'Share Your Details with Marleni:': 'Comparte tus Datos con Marleni:',
      'Share Your Details with Procurement Desk:': 'Comparte tus Datos con Adquisiciones:',
      'Share Your Details with Logistics Hub:': 'Comparte tus Datos con Logística:',
      'Scan Their Card': 'Escanear su Tarjeta',
      'Type Details ↓': 'Ingresar Detalles ↓',

      // Step 2 Exchange
      'Final Step': 'Paso Final',
      'Action Saved ✓': 'Acción Guardada ✓',
      'Exchange Details with Pedro': 'Intercambiar Detalles con Pedro',
      'Exchange Details with Eduardo': 'Intercambiar Detalles con Eduardo',
      'Exchange Details with Marleni': 'Intercambiar Detalles con Marleni',
      'Exchange Details with Procurement Desk': 'Intercambiar Detalles con Adquisiciones',
      'Exchange Details with Logistics Hub': 'Intercambiar Detalles con Logística',
      "Share your company details and we'll follow up within 24 hours with our Capability Statement.": "Comparte los datos de tu empresa y te contactaremos en menos de 24 horas con nuestra Declaración de Capacidades.",
      'Card Photo Captured': 'Foto de Tarjeta Capturada',
      'Embedded with lead exchange': 'Adjunta al intercambio de contacto',
      'Retake': 'Volver a tomar',

      // Forms Label & Inputs
      'Your Full Name *': 'Nombre Completo *',
      'e.g. Col. Marcus Vance / John Smith': 'Ej. Juan Pérez / Director de Compras',
      'Agency / Prime / Company *': 'Agencia / Contratista / Empresa *',
      'e.g. USACE / TxDOT / Prime': 'Ej. USACE / TxDOT / Contratista',
      'Work Email *': 'Correo del Trabajo *',
      'name@agency.gov': 'nombre@agencia.gov',
      'Direct Phone (Optional)': 'Teléfono Directo (Opcional)',
      '(512) 555-0199': '(512) 555-0199',
      'Company Website (Optional)': 'Sitio Web de la Empresa (Opcional)',
      'e.g. www.turnerconstruction.com': 'Ej. www.turnerconstruction.com',
      'Send My Contact to Pedro →': 'Enviar mi Contacto a Pedro →',
      'Send My Contact to Eduardo →': 'Enviar mi Contacto a Eduardo →',
      'Send My Contact to Marleni →': 'Enviar mi Contacto a Marleni →',
      'Send My Contact to Procurement Desk →': 'Enviar mi Contacto a Adquisiciones →',
      'Send My Contact to Logistics Hub →': 'Enviar mi Contacto a Logística →',
      'Contact Exchanged Successfully!': '¡Contacto Intercambiado Exitosamente!',
      'Thanks! We will be in touch shortly.': '¡Gracias! Nos pondremos en contacto a la brevedad.',

      // Right Panel
      'Mobile Card & QR Pass': 'Tarjeta Móvil y Pase QR',
      'Instant Scan': 'Escaneo Instantáneo',
      'Scan with your phone camera to save my contact': 'Escanea con la cámara del teléfono para guardar mi contacto',
      'Our Capabilities': 'Nuestras Capacidades',
      'Capability Statement & Company Overview': 'Declaración de Capacidad y Resumen de la Empresa',
      'Web Portal →': 'Portal Web →',
      'Official Capability Statement': 'Declaración Oficial de Capacidad',
      'Who we are, what we supply, how to reach us': 'Quiénes somos, qué suministramos, cómo contactarnos',
      'Quick Preview': 'Vista Previa Rápida',
      'View Document': 'Ver Documento',
      'Corporate Project & Supply Overview': 'Resumen Corporativo de Proyectos y Suministros',
      'Dallas Warehousing • OEM Supply Lines': 'Almacenamiento en Dallas • Líneas OEM',
      'View Detailed Supply Matrix & Agency Readiness': 'Ver Matriz Detallada de Suministro y Capacidades',
      'Division 26 Electrical': 'División 26 Eléctrico',
      'Transformers, switchgear, distribution wire & conduit': 'Transformadores, aparellaje, cable de distribución y conductos',
      'MRO & Facility Supplies': 'MRO y Suministros de Instalaciones',
      'Rapid facility replenishment, safety gear & tooling': 'Reabastecimiento rápido, equipo de seguridad y herramientas',
      'Logistics Mobilization': 'Movilización Logística',
      'Central Dallas hub, overnight freight & project staging': 'Centro logístico en Dallas, flete y almacenamiento de proyectos',
      'Fast Takeoff Reviews': 'Revisiones Rápidas de Presupuestos',
      '24-hour quote turnaround for contractors': 'Cotizaciones en 24 horas para contratistas',
      'Who We Work With': 'Con Quién Trabajamos',
      'USACE Project Bids': 'Proyectos USACE',
      'TxDOT Rapid Staging': 'Almacenamiento TxDOT',
      'VA Medical Centers': 'Centros Médicos VA',
      'Federal & Public Projects': 'Proyectos Federales y Públicos',
      'DFW HQ:': 'Sede DFW:',

      // Modals
      'Book a Meeting': 'Agendar una Reunión',
      '15-Min Capabilities & RFQ Briefing': 'Sesión de Capacidades y RFQ (15 Min)',
      'Assigned Representative': 'Representante Asignado',
      'Google Workspace Verified': 'Verificado por Google Workspace',
      'Have a Google Account?': '¿Tienes cuenta de Google?',
      'Instant calendar booking & private Meet link': 'Reserva instantánea y enlace de Meet',
      'Google Calendar': 'Google Calendar',
      'Preferred Date (Mon–Fri)': 'Fecha Preferida (Lun–Vie)',
      'Time Slot (CST)': 'Horario (CST)',
      'What would you like to discuss?': '¿Qué le gustaría discutir?',
      'Rapid RFQ Pricing & Supply Agreement': 'Precios Rápidos RFQ y Acuerdo de Suministro',
      'Concrete, Cement & Aggregate Materials': 'Concreto, Cemento y Agregados',
      'DFW Logistics Fleet & Turnkey Freight': 'Flota Logística DFW y Flete Llave en Mano',
      'Federal & Defense Sourcing (CAGE: 169D8)': 'Abastecimiento Federal y Defensa',
      'Subcontractor / Prime Joint Venture': 'Asociación de Contratista / Subcontratista',
      'Confirm 15-Min Consultation': 'Confirmar Consulta de 15 Minutos',
      'Briefing Confirmed!': '¡Sesión Confirmada!',
      'Your 15-minute capabilities briefing has been locked into the schedule. A calendar invitation and Google Meet video link have been dispatched.': 'Su sesión de capacidades de 15 minutos ha sido confirmada en el calendario. Se ha enviado una invitación y un enlace de video de Google Meet.',
      '📹 Video Access:': '📹 Acceso de Video:',
      'Unique Meet Link Dispatched via Calendar': 'Enlace de Meet único enviado a través del calendario',
      '👤 Assigned Rep:': '👤 Rep. Asignado:',
      '📅 Add to Google Calendar': '📅 Añadir a Google Calendar',
      '📅 Add to Apple / Outlook Calendar': '📅 Añadir al Calendario Apple / Outlook',
      'Done • Close': 'Listo • Cerrar',

      // Share Modal & PDF Modal
      'Share Digital Card': 'Compartir Tarjeta Digital',
      'Copy Link to Clipboard': 'Copiar Enlace al Portapapeles',
      'Enlarge for Expo Scanner': 'Ampliar para Escáner de Expo',
      'Capability Statement': 'Declaración de Capacidades',
      'Official Federal Capability Statement • CAGE: 169D8 | UEI: X3HUQZ66P6N3. Core Division 26 electrical takeoff specs & staging assets.': 'Declaración Oficial de Capacidades Federales • CAGE: 169D8 | UEI: X3HUQZ66P6N3. Especificaciones eléctricas principales División 26 y activos de almacenamiento.',
      'View Fullscreen in Browser': 'Ver Pantalla Completa en Navegador',
      'Exchange Contact': 'Intercambiar Contacto',
      'Exchange Contact Info': 'Intercambiar Contacto'
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
    
    // Setup observer for dynamic elements like modals
    setupMutationObserver();
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

    // 1. Translate Standard Text Elements
    const elements = document.querySelectorAll('button, a, span, p, h1, h2, h3, h4, h5, h6, label, div, figcaption, option');
    elements.forEach(el => {
      // Store original text if not already stored
      if (!el.hasAttribute('data-orig-en')) {
        // Skip elements with deep children (we only want leaf nodes or simple wrappers like SVG + SPAN)
        if (el.children.length > 2 && el.tagName !== 'OPTION') return; 

        // If it contains only text or exactly one span with text
        let textNode = el;
        
        let textContent = '';
        if (el.children.length === 0) {
            textContent = el.textContent.replace(/\s+/g, ' ').trim();
        } else {
            // Find text content disregarding SVG or spans
            Array.from(el.childNodes).forEach(node => {
                if(node.nodeType === 3 && node.textContent.trim().length > 0) {
                   textContent = node.textContent.replace(/\s+/g, ' ').trim();
                }
            });
            if(!textContent && el.querySelector('span')) {
               textContent = el.querySelector('span').textContent.replace(/\s+/g, ' ').trim();
            }
        }

        if (textContent && DICTIONARY.es[textContent]) {
          el.setAttribute('data-orig-en', textContent);
        }
      }

      const orig = el.getAttribute('data-orig-en');
      if (orig) {
        if (lang === 'es' && dict[orig]) {
            replaceTextOrChild(el, orig, dict[orig]);
        } else if (lang === 'en') {
            replaceTextOrChild(el, DICTIONARY.es[orig] || 'something else', orig); // Go back to original
        }
      }
    });

    // 2. Translate Input Placeholders
    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach(input => {
      if (!input.hasAttribute('data-orig-en-placeholder')) {
        const placeholderText = input.getAttribute('placeholder').trim();
        if (DICTIONARY.es[placeholderText]) {
          input.setAttribute('data-orig-en-placeholder', placeholderText);
        }
      }

      const origPlaceholder = input.getAttribute('data-orig-en-placeholder');
      if (origPlaceholder) {
        if (lang === 'es' && dict[origPlaceholder]) {
          input.setAttribute('placeholder', dict[origPlaceholder]);
        } else if (lang === 'en') {
          input.setAttribute('placeholder', origPlaceholder);
        }
      }
    });
  }

  // Helper to replace text without destroying SVGs
  function replaceTextOrChild(el, orig, newText) {
    if (el.children.length === 0) {
        el.textContent = newText;
        return;
    }
    // If it has children, search for the child node containing the text
    const span = el.querySelector('span');
    if (span) {
        let sText = span.textContent.replace(/\s+/g, ' ').trim();
        if (sText === orig || sText === DICTIONARY.es[orig] || sText === DICTIONARY.es[newText] || sText === newText) {
            span.textContent = newText;
            return;
        }
    }
    
    // Direct text node search
    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === 3) {
            let nText = node.textContent.replace(/\s+/g, ' ').trim();
            if (nText === orig || nText === DICTIONARY.es[orig] || nText === newText || (DICTIONARY.es[newText] && nText === DICTIONARY.es[newText])) {
                node.textContent = newText;
                return;
            }
        }
    }
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

  // Handle dynamic DOM changes (like modals opening and showing new text)
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldReapply = true;
        } else if (mutation.type === 'attributes' && mutation.attributeName !== 'data-orig-en' && mutation.attributeName !== 'data-orig-en-placeholder' && mutation.attributeName !== 'placeholder' && mutation.attributeName !== 'class' && mutation.attributeName !== 'style' && mutation.attributeName !== 'lang') {
            shouldReapply = true;
        }
      });
      if (shouldReapply) {
        if(window._i18nTimeout) clearTimeout(window._i18nTimeout);
        window._i18nTimeout = setTimeout(() => {
            applyLanguage(currentLang);
        }, 50);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'] 
    });
  }

  window.p22SetLanguage = function(lang) {
    if (lang === 'es' || lang === 'en') {
      currentLang = lang;
      localStorage.setItem('p22_lang', lang);
      applyLanguage(currentLang);
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
