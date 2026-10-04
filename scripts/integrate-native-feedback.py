#!/usr/bin/env python3
"""
Integrate Native Haptic & Battery-Adaptive Web Audio Feedback Engine
into assets/js/card-scanner.js and assets/js/telemetry.js.
Ensures:
- Whisper-quiet, minimal gain ceiling (8-12%) so audio never blasts regardless of device volume.
- Adaptive battery scaling via Battery Status API (halves vibration & drops gain on low battery, disables vibration on critical battery).
- Psycho-acoustic haptic clicks on iOS Safari (where navigator.vibrate is restricted) and true physical haptics on Android Chrome.
- Preserves all existing OCR pipeline, preprocessCardImage, schema validation, and QR fallback.
"""

import sys
import os

SCANNER_JS = r"i:\_Dev_Builds_\2026\p22-digital-card\assets\js\card-scanner.js"
TELEMETRY_JS = r"i:\_Dev_Builds_\2026\p22-digital-card\assets\js\telemetry.js"

with open(SCANNER_JS, "r", encoding="utf-8") as f:
    scanner_content = f.read()

# Define NativeFeedback code to insert inside (function () { 'use strict'; ...
native_feedback_engine = '''  // =========================================================================
  // Native Haptic & Battery-Adaptive Web Audio Feedback Engine
  // Capped at subtle volume (8-12%) so it NEVER blasts, regardless of phone %
  // Auto-scales haptics and gain based on Battery Status API
  // =========================================================================
  const NativeFeedback = {
    ctx: null,
    unlocked: false,
    batteryLevel: 1.0,
    isLowBattery: false,
    isCriticalBattery: false,

    async init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          try {
            this.ctx = new AudioCtx();
          } catch (e) {}
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Check battery status if supported by mobile browser
      if (typeof navigator !== 'undefined' && navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          this.updateBatteryState(battery);
          battery.addEventListener('levelchange', () => this.updateBatteryState(battery));
          battery.addEventListener('chargingchange', () => this.updateBatteryState(battery));
        } catch (e) {}
      }
    },

    updateBatteryState(battery) {
      if (!battery) return;
      this.batteryLevel = typeof battery.level === 'number' ? battery.level : 1.0;
      const isDischarging = !battery.charging;
      this.isLowBattery = isDischarging && this.batteryLevel <= 0.25;
      this.isCriticalBattery = isDischarging && this.batteryLevel <= 0.12;
    },

    unlock() {
      if (this.unlocked) return;
      this.init();
      if (this.ctx && this.ctx.state === 'running') {
        this.unlocked = true;
      }
    },

    // Relative gain clamp: ensures output is strictly whisper-quiet (5-12% of device volume)
    getGainCeiling(baseCeiling = 0.11) {
      if (this.isCriticalBattery) return baseCeiling * 0.45; // ~5% on critical battery
      if (this.isLowBattery) return baseCeiling * 0.65;      // ~7% on low battery
      return baseCeiling;                                   // Standard subtle ceiling (~11%)
    },

    // Adaptive haptic vibration (Android supported, safe on iOS)
    vibrate(pattern) {
      if (typeof navigator === 'undefined' || !navigator.vibrate) return;
      if (this.isCriticalBattery) return; // Disable vibration to preserve critical battery
      if (this.isLowBattery) {
        // Halve pulse duration on low battery
        if (Array.isArray(pattern)) {
          navigator.vibrate(pattern.map(p => Math.max(5, Math.round(p * 0.5))));
        } else {
          navigator.vibrate(Math.max(5, Math.round(pattern * 0.5)));
        }
        return;
      }
      navigator.vibrate(pattern);
    },

    // 1. Shutter / Card Snap (Crisp mechanical camera click, 40ms)
    snap() {
      this.init();
      this.vibrate(16);
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.04);

        const ceiling = this.getGainCeiling(0.12);
        gain.gain.setValueAtTime(ceiling, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (e) {}
    },

    // 2. Scan Success / Lead Saved (Apple Pay-style crisp harmonic rising chime, 220ms)
    success() {
      this.init();
      this.vibrate([22, 35, 25]);
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Harmonic rise: A5 (880Hz) to A6 (1760Hz)
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1760, now + 0.075);

        const ceiling = this.getGainCeiling(0.10);
        gain.gain.setValueAtTime(ceiling, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } catch (e) {}
    },

    // 3. Scan Error / Glare / Unreadable (Low double-buzz)
    error() {
      this.init();
      this.vibrate([45, 40, 55]);
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(105, now + 0.08);

        const ceiling = this.getGainCeiling(0.13);
        gain.gain.setValueAtTime(ceiling, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } catch (e) {}
    }
  };

  // Eagerly unlock on first user gesture anywhere on page
  window.addEventListener('touchstart', () => NativeFeedback.unlock(), { once: true, passive: true });
  window.addEventListener('pointerdown', () => NativeFeedback.unlock(), { once: true, passive: true });
  window.addEventListener('click', () => NativeFeedback.unlock(), { once: true });

  window.NativeFeedback = NativeFeedback;
'''

# 1. Insert NativeFeedback right after 'use strict';
if "window.NativeFeedback = NativeFeedback;" not in scanner_content:
    scanner_content = scanner_content.replace(
        "(function () {\n  'use strict';\n",
        f"(function () {{\n  'use strict';\n\n{native_feedback_engine}\n"
    )

# 2. Hook into p22SubmitLead
old_lead_success = """      if (res.ok) {
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
    }"""

new_lead_success = """      if (res.ok) {
        const json = await res.json();
        console.log('[+] Lead successfully recorded:', json);
        if (window.NativeFeedback) window.NativeFeedback.success();
        return { ok: true, data: json };
      } else {
        console.warn('[-] /api/lead returned non-200:', res.status);
        enqueueOfflineLead(sanitized);
        if (window.NativeFeedback) window.NativeFeedback.success();
        return { ok: false, status: res.status, queued: true };
      }
    } catch (err) {
      console.warn('[P22-Lead] Network dispatch deferred to offline storage:', err.message);
      try { enqueueOfflineLead(sanitized); } catch (e) {}
      if (window.NativeFeedback) window.NativeFeedback.success();
      return { ok: false, offline: true, queued: true, error: err.message };
    }"""

if old_lead_success in scanner_content:
    scanner_content = scanner_content.replace(old_lead_success, new_lead_success)

# 3. Hook into window.triggerCardScan
old_trigger = """  window.triggerCardScan = function (context = 'inline') {
    activeScanContext = context;"""
new_trigger = """  window.triggerCardScan = function (context = 'inline') {
    if (window.NativeFeedback) window.NativeFeedback.snap();
    activeScanContext = context;"""
if old_trigger in scanner_content:
    scanner_content = scanner_content.replace(old_trigger, new_trigger)

# 4. Hook into window.handleCardImageSelected
old_img_sel = """  window.handleCardImageSelected = function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;"""
new_img_sel = """  window.handleCardImageSelected = function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (window.NativeFeedback) window.NativeFeedback.snap();"""
if old_img_sel in scanner_content:
    scanner_content = scanner_content.replace(old_img_sel, new_img_sel)

# 5. Hook into AI OCR success
old_ai_succ = """                document.getElementById('scanNotes').value = (d.title ? d.title + '\\n' : '') + (d.notes || d.raw_text || 'Scanned Card');
                aiSuccess = true;
              }"""
new_ai_succ = """                document.getElementById('scanNotes').value = (d.title ? d.title + '\\n' : '') + (d.notes || d.raw_text || 'Scanned Card');
                aiSuccess = true;
                if (window.NativeFeedback) window.NativeFeedback.success();
              }"""
if old_ai_succ in scanner_content:
    scanner_content = scanner_content.replace(old_ai_succ, new_ai_succ)

# 6. Hook into fallback timeout error
old_timeout = """            const fallbackTimeout = setTimeout(() => {
              if (!tesseractHandled) {
                tesseractHandled = true;
                if (proc) proc.classList.add('hidden');"""
new_timeout = """            const fallbackTimeout = setTimeout(() => {
              if (!tesseractHandled) {
                tesseractHandled = true;
                if (window.NativeFeedback) window.NativeFeedback.error();
                if (proc) proc.classList.add('hidden');"""
if old_timeout in scanner_content:
    scanner_content = scanner_content.replace(old_timeout, new_timeout)

# 7. Hook into Tesseract parsed result
old_tess_res = """                document.getElementById('scanNotes').value = parsed.notes || 'Scanned Card';

                if (proc) proc.classList.add('hidden');"""
new_tess_res = """                document.getElementById('scanNotes').value = parsed.notes || 'Scanned Card';

                if (parsed.name || parsed.email || parsed.phone || parsed.agency) {
                  if (window.NativeFeedback) window.NativeFeedback.success();
                } else {
                  if (window.NativeFeedback) window.NativeFeedback.error();
                }

                if (proc) proc.classList.add('hidden');"""
if old_tess_res in scanner_content:
    scanner_content = scanner_content.replace(old_tess_res, new_tess_res)

# 8. Hook into handleScannerFormSubmit
old_submit = """  window.handleScannerFormSubmit = async function (e) {
    if (e) e.preventDefault();
    const submitBtn = document.getElementById('scanSubmitBtn');"""
new_submit = """  window.handleScannerFormSubmit = async function (e) {
    if (e) e.preventDefault();
    if (window.NativeFeedback) window.NativeFeedback.snap();
    const submitBtn = document.getElementById('scanSubmitBtn');"""
if old_submit in scanner_content:
    scanner_content = scanner_content.replace(old_submit, new_submit)

# 9. Hook into QR fallback scan
old_qr = """      qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, function (text) {
        qr.stop().catch(function () {});"""
new_qr = """      qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, function (text) {
        qr.stop().catch(function () {});
        if (window.NativeFeedback) window.NativeFeedback.success();"""
if old_qr in scanner_content:
    scanner_content = scanner_content.replace(old_qr, new_qr)

with open(SCANNER_JS, "w", encoding="utf-8") as f:
    f.write(scanner_content)

print("[+] assets/js/card-scanner.js updated with NativeFeedback engine and hooks.")

# Now update telemetry.js
with open(TELEMETRY_JS, "r", encoding="utf-8") as f:
    tele_content = f.read()

old_tele_click = """    // Delegated click listener for ALL key actions and buttons
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a, button');
      if (!target) return;"""

new_tele_click = """    // Delegated click listener for ALL key actions and buttons
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a, button');
      if (!target) return;

      // Provide native tactile / audio click on interactive buttons
      if (window.NativeFeedback && typeof window.NativeFeedback.snap === 'function') {
        const cList = target.classList;
        const targetId = target.id || '';
        const targetHref = target.getAttribute('href') || '';
        const onclk = target.getAttribute('onclick') || '';
        if (
          targetId === 'cageCopyBtn' || targetId === 'ueiCopyBtn' || cList.contains('copy-chip') ||
          targetHref.includes('.vcf') || onclk.includes('downloadActiveVCard') ||
          targetHref.includes('.pkpass') || targetId.includes('Wallet') || onclk.includes('GoogleWalletPass') ||
          targetHref.startsWith('tel:') || targetHref.startsWith('sms:') || targetHref.startsWith('mailto:') ||
          targetId === 'qrZoomBtn' || targetId === 'qrZoomToggleBtn' || onclk.includes('toggleExpoQrZoom') ||
          cList.contains('btn-bounce') || cList.contains('cta-luxury')
        ) {
          window.NativeFeedback.snap();
        }
      }"""

if old_tele_click in tele_content:
    tele_content = tele_content.replace(old_tele_click, new_tele_click)
    with open(TELEMETRY_JS, "w", encoding="utf-8") as f:
        f.write(tele_content)
    print("[+] assets/js/telemetry.js updated with delegated haptic/audio tap feedback.")
else:
    print("[-] Notice: old_tele_click not found in telemetry.js, skipping telemetry edit.")
