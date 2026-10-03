# P-22 CORP — TACTICAL LUXURY DIGITAL CARD
## Full-Stack Architecture Blueprint, System Specification & Elevation Roadmap

**Product**: P-22 Corp Digital Identity & Federal Contracting Card  
**Engine**: Vanilla Hardware-Accelerated Web Stack (0 Dependencies)  
**Target Performance Budget**: < 1.0s FCP, 60fps / 120fps ProMotion Rendering, < 150KB Total Page Weight  
**Version Target**: v3.0 "Titanium Edition"  

---

## 1. System Architecture & Tech Stack Matrix

To guarantee instantaneous loading in low-connectivity defense expo halls and convention basements, the platform is strictly engineered with **zero external NPM/JavaScript dependencies**. 

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT VIEWPORT / BROWSER                        │
├────────────────────────────────────────────────────────────────────────┤
│  [Visual Engine]         [Tactile Physics]       [Conversion Workflows] │
│  • CSS Glassmorphism     • PointerEvent Matrix   • 2-Way Contact Swap   │
│  • Specular Sheen Layer  • Gyroscope Parallax    • Full-Screen Expo QR  │
│  • Hairline Gold Borders • Spring Damping Easing • 1-Tap CAGE/UEI Copy  │
├────────────────────────────────────────────────────────────────────────┤
│                       NATIVE HARDWARE INTEGRATION                      │
│  • Web Vibration API (Haptic Feedback)                                  │
│  • DeviceOrientation API (Physical Phone Tilt)                         │
│  • Service Worker Cache API (Offline Expo Shield)                      │
│  • Web Share API & Clipboard API                                        │
├────────────────────────────────────────────────────────────────────────┤
│                      DIGITAL WALLET & ASSET LAYER                       │
│  • Apple Wallet PassKit (.pkpass) via RFC-Compliant MIME Streams       │
│  • Native Contacts vCard (.vcf) with Inline Base64 Headshot            │
│  • Capability Statement PDF (Inline Stream + Offline Cache)             │
├────────────────────────────────────────────────────────────────────────┤
│                        EDGE INFRASTRUCTURE (VERCEL)                     │
│  • Clean URLs Router (No .html Extensions)                             │
│  • Hardened Security Headers (nosniff, SAMEORIGIN, strict-referrer)    │
│  • Global AnyCast CDN Caching & Gzip/Brotli Compression                │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Matrix & Justification

| Layer | Selected Technology | Alternative Rejected | Justification |
| :--- | :--- | :--- | :--- |
| **Styling & Physics** | CSS3 GPU Transforms + CSS Vars | Three.js / GSAP (400KB+) | 0KB penalty, native 120Hz smooth scrolling, zero battery drain. |
| **Glass Refraction** | `backdrop-filter: blur(28px) saturate(190%)` | Canvas Filter Overlays | Native hardware acceleration on iOS WebKit and Android Chromium. |
| **Haptics** | `navigator.vibrate([10, 30, 15])` | Sound files / WebAudio | Completely silent, authentic native Apple Taptic feedback simulation. |
| **Offline Engine** | Service Worker `Cache-First` Strategy | IndexedDB Heavy Wrappers | Lightweight cache of fonts, headshots, and stylesheets (< 50 lines). |
| **Lead Protection** | RFC 4180 CSV + DDE Escape (`'`) | Unsanitized Exports | Immunity against Excel/Sheets macro injections from attendee inputs. |

---

## 2. Design System: "Tactical Defense Luxury"

The visual language marries **Apple’s visionOS spatial fluidity** with the **high-precision authority of US Defense & Aerospace Contracting**.

### A. Color Tokens
```css
:root {
  /* Stealth Foundations */
  --bg-space: #07090e;
  --bg-obsidian: #0b0f17;
  --bg-card-glass: rgba(13, 19, 33, 0.72);
  --bg-card-border: rgba(212, 175, 55, 0.22);
  
  /* Tactical Champagne Gold Accents */
  --gold-primary: #d4af37;
  --gold-specular: #f5e29f;
  --gold-glow: rgba(212, 175, 55, 0.15);
  --gold-hairline: linear-gradient(135deg, rgba(212,175,55,0.45) 0%, rgba(255,255,255,0.06) 50%, rgba(212,175,55,0.18) 100%);
  
  /* Status Signals */
  --status-active: #10b981; /* Command Center Active */
  --status-active-glow: rgba(16, 185, 129, 0.35);
  
  /* Typography */
  --font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}
```

### B. Spatial Glass & Refraction Specifications
* **Ballistic Glass Blur**: `backdrop-filter: blur(28px) saturate(190%); -webkit-backdrop-filter: blur(28px) saturate(190%);`
* **Dynamic Specular Highlight**: Radial gradient mapped dynamically via `--mouse-x` and `--mouse-y` percentages, set to `mix-blend-mode: overlay` at 22% maximum luminosity.
* **3D Perspective Rig**: The card container sets `perspective: 1200px; transform-style: preserve-3d;`. The card rotates up to $\pm 12^\circ$ on X and Y axes, returning to baseline with an Apple-style damped inertial curve.

---

## 3. High-Converting UX & Workflow Architecture

```
[Attendee Scans Physical Card or QR]
                  │
                  ▼
┌─────────────────────────────────────────┐
│     P-22 Executive Card Loads (<1.0s)   │
│   (3D Liquid Card Tilt + Dallas Clock)  │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│ Attendee Taps   │ │ Attendee Taps   │
│ "Save Contact"  │ │ "Apple Wallet"  │
└────────┬────────┘ └────────┬────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
┌─────────────────────────────────────────┐
│  TRIGGER 2-WAY CONTACT EXCHANGE SHEET   │
│  "Contact Saved to Device! Drop your    │
│   card with Pedro in 1 tap."            │
├─────────────────────────────────────────┤
│  [Full Name]                            │
│  [Work Email / Mobile]                  │
│  [Agency / Organization]                │
│  [ ] Request Capability Statement       │
│  [ SEND BACK CONTACT INFO ]             │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│  • Instant Local Encrypted DB Save      │
│  • Instant Confirmation Haptic Tick     │
│  • Offline Sync Queue (if offline)      │
└─────────────────────────────────────────┘
```

---

## 4. Phased Implementation Roadmap & Decision Matrix

We have divided the 20 enhancements into four clean, modular phases. You can approve the complete rollout or select individual phases.

### Phase 1: Visual Physics & The "Apple Card" Look
* **Scope**:
  1. Interactive 3D Perspective Tilt on pointer move & finger drag.
  2. Mobile Gyroscope Parallax integration (`deviceorientation`).
  3. Dynamic Liquid Specular Sheen (follows finger/tilt).
  4. 0.5px Refractive Champagne Gold Hairline Borders.
  5. Multi-layer `preserve-3d` element stacking (portrait floats above card base).
* **Expected Outcome**: Instant "wow" factor when the card opens on any device.

### Phase 2: Defense Contracting Authority & Micro-Accents
* **Scope**:
  1. Live Dallas HQ Command Center Status Clock (CST real-time pulse).
  2. 1-Tap Quick-Copy micro badges for CAGE Code (`9X3D1`) and UEI (`M5K6JN8P2B74`) with checkmark feedback.
  3. Tactical aerospace reticle coordinates etched in card corners.
  4. Web Vibration API integration for micro-haptics on button taps.
* **Expected Outcome**: Sharp, unmistakable Tier-1 Defense Contractor presentation.

### Phase 3: High-Velocity Expo Lead Conversion
* **Scope**:
  1. 2-Way Contact Exchange bottom sheet that prompts the attendee to drop their contact when they save yours.
  2. Full-screen High-Contrast QR Code modal for rapid booth scanning.
  3. In-page Capability Statement interactive slide-out previewer.
  4. Division quick-switcher chips (Tactical Logistics & Federal Bids previews).
* **Expected Outcome**: Transforms passive card views into qualified procurement leads.

### Phase 4: Production Sync & Mirror Hardening
* **Scope**:
  1. Propagate all approved enhancements to all 5 individual mirrors (`pedro.html`, `eduardo.html`, `marleni.html`, `bids.html`, `logistics.html`).
  2. Update `sw.js` cache manifest to version `v3.0`.
  3. Run comprehensive responsive audit across all viewports.
  4. Push to GitHub `main` and verify live edge deployment on Vercel.

---

## 5. Architectural Decision Gates for User Approval

Before code execution, please review and confirm your preferred configuration:

| Decision Gate | Option A (Recommended) | Option B |
| :--- | :--- | :--- |
| **1. 3D Tilt Intensity** | **Subtle Executive ($\pm 10^\circ$)**: Elegant, understated, smooth Apple Card feel. | **Dynamic Pronounced ($\pm 18^\circ$)**: Bold, dramatic 3D perspective. |
| **2. Mobile Gyroscope** | **Automatic Motion**: Card tilts in real-time as the phone is moved in hand. | **Touch Only**: Card only tilts when dragged by finger (no orientation API). |
| **3. Contact Lead Exchange** | **Auto-Slide Up**: Sheet prompts attendee to drop their card after saving yours. | **Passive Bottom Section**: Keep contact form at the bottom of the card. |
| **4. Division Navigation** | **Interactive Chips**: Switch between Pedro, Bids, and Logistics within the card. | **Strictly Isolated**: Each card remains 100% independent without cross-links. |
