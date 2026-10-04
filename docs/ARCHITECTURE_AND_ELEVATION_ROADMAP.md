# P-22 CORP — TACTICAL DEFENSE LUXURY DIGITAL CARD
## Full-Stack Architecture Blueprint, System Specification & Gap Resolution Roadmap

**Product**: P-22 Corp Digital Identity & Federal Contracting Card  
**Engine**: Vanilla Hardware-Accelerated Web Stack (0 Client Runtime Dependencies)  
**Target Performance Budget**: < 0.8s FCP, 60fps / 120fps ProMotion Rendering, < 150KB Total Page Weight  
**Version**: v3.3 "Titanium Production Edition"  
**SAM.gov Identity**: CAGE Code `169D8` | UEI `X3HUQZ66P6N3` | SBA Small Business Certified  
**Live Production URL**: `https://card.p22corp.com` (Custom domain: `https://card.p22corp.com`)  

---

## 1. Executive Summary & Critical Context Resolution

This document formalizes the production-grade architectural baseline for P-22 Corp’s digital identity cards, addressing all pre-10:00 AM planning gaps, technical browser blockers, and real-world federal trade-show UX constraints.

### Key Architectural Resolutions:
1. **SAM.gov Identification (Fatal Error Eliminated):**
   * *Old Blueprint Draft Error:* Contained placeholder identifiers (`9X3D1` and `M5K6JN8P2B74`).
   * *Production Reality:* Permanently locked to verified SAM.gov credentials: **CAGE: `169D8`** and **UEI: `X3HUQZ66P6N3`**.
2. **Apple Wallet & Google Wallet Signing Architecture (Pass2U vs. WalletWallet):**
   * *Pass2U Flaws:* 10-device limit on free tier, intrusive consumer ads, and interstitial redirects for non-native browsers.
   * *WalletWallet API Integration:* 1,000 passes/month with real cryptographic signing (Apple WWDR CA chain + Google Wallet JWT issuer).
   * *Permanent Vercel Edge Hosting:* We mint cryptographically signed `.pkpass` binaries via API and commit them directly to `assets/passes/*.pkpass`. This achieves **unlimited downloads at $0 cost with zero third-party ads**.
3. **iOS WebKit Hardware Constraints (Zero Trade-Show Friction):**
   * *Gyroscope (`DeviceOrientation`):* iOS 13+ Safari blocks motion sensors behind a jarring system modal. We utilize **Touch / PointerEvent physics** on mobile, avoiding permission prompts that raise red flags for federal contracting officers.
   * *Haptics (`navigator.vibrate`):* WebKit on iOS does not support the Vibration API. Haptics gracefully execute on Android Chromium while maintaining clean visual micro-interactions on iPhone.
4. **Zero-PIN Staff ID Studio vs. Protected Setup:**
   * Separated public-facing staff badges (`/badge`) from internal expo lead management (`/setup`), ensuring zero barrier to entry when staff add badges to their home screens or Apple Wallets.

---

## 2. Digital Wallet Pass Lifecycle & Account Cancellation Rules

### The Core Architectural Question:
> *"If passes are generated with the API key instead of one download file, will they be deleted from attendees' phones if the account is ever cancelled?"*

### The Technical Reality:

| Scenario / Platform | What Happens if WalletWallet Account is Cancelled or Trial Lapses? |
| :--- | :--- |
| **Passes Already Saved to Apple Wallet** | **NEVER DELETED.** The signed `.pkpass` bundle is stored locally in the iPhone Secure Enclave and Apple Watch storage. An external SaaS cannot delete a pass from a phone unless it remains active and intentionally pushes an APNs invalidation payload (`DELETE /api/passes/<serial>`). If the account lapses, the pass simply becomes a permanent, static offline card in the holder's Apple Wallet. |
| **Passes Already Saved to Google Wallet** | **REMAINS IN GOOGLE WALLET.** The pass object is bound to the user's Google account. Unless actively marked expired via Google Wallet REST API, the card remains viewable in Google Wallet. |
| **Direct SaaS Hosted Links (`api.walletwallet.dev/p/...`)** | **STOPS WORKING.** If you rely solely on the third-party hosted URL, future clicks will return HTTP 404 or an account inactive error once the subscription terminates. |
| **P-22 Hybrid Edge Solution (`assets/passes/*.pkpass`)** | **100% UNTOUCHED & UNLIMITED.** Because we download the cryptographically signed `.pkpass` binaries and host them on Vercel's global CDN, new attendees download the genuine Apple-signed file directly from P-22 servers. **It works indefinitely, with zero monthly limits, zero API calls per download, zero ads, and zero ongoing SaaS costs.** |

---

## 3. System Architecture & Component Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT VIEWPORT / BROWSER                        │
├────────────────────────────────────────────────────────────────────────┤
│  [Visual Engine]         [Tactile Physics]       [Conversion Workflows] │
│  • CSS Glassmorphism     • PointerEvent Matrix   • 2-Way Contact Swap   │
│  • Specular Sheen Layer  • Touch Drag Bounds     • Full-Screen Expo QR  │
│  • Hairline Gold Borders • 0.2s Spring Easing    • 1-Tap CAGE/UEI Copy  │
├────────────────────────────────────────────────────────────────────────┤
│                       NATIVE HARDWARE INTEGRATION                      │
│  • Web Share API (Direct vCard .vcf Injection)                         │
│  • Touch Event Coordinates (No iOS Gyroscope Permission Modals)        │
│  • Service Worker Cache API (v3.2 Titanium Offline Expo Shield)        │
│  • Clipboard API with Visual & Haptic Confirmation                     │
├────────────────────────────────────────────────────────────────────────┤
│                      DIGITAL WALLET & ASSET LAYER                       │
│  • Apple Wallet PassKit: Pre-Minted Signed .pkpass on Vercel CDN       │
│  • Google Wallet: Signed Direct JWT Save URLs                          │
│  • Native Contacts: RFC 2426 vCard (.vcf) with Inline Base64 Photo     │
│  • Capability Statement PDF: Offline Cached via Service Worker         │
├────────────────────────────────────────────────────────────────────────┤
│                        EDGE INFRASTRUCTURE (VERCEL)                     │
│  • Clean URLs Router (/pedro, /eduardo, /marleni, /bids, /badge)       │
│  • Strict Security Headers (nosniff, SAMEORIGIN, strict-referrer)      │
│  • Immutable Asset Caching (Cache-Control: 31536000s for static assets)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Roster Data & Verification Matrix

All staff profiles are calibrated 1:1 against the live corporate domain (`https://www.p22corp.com`):

| Slug | Staff Member & Title | CAGE / UEI | Direct Contact | Official 1:1 Portrait | Signed .pkpass Serial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pedro` | **Pedro Felipe \| PMP**<br>Managing Director & Power Systems Lead | `169D8`<br>`X3HUQZ66P6N3` | `1-945-218-5896`<br>`pfelipe@p22corp.com` | `assets/staff/pedro-official-1x1.png` | `8c756230-8f2e-44b4-8a63-308c8fc2c140` |
| `eduardo` | **Eduardo Lopez**<br>Electrical Sales Manager & OEM Logistics SME | `169D8`<br>`X3HUQZ66P6N3` | `1-945-218-5896`<br>`sales@p22corp.com` | `assets/staff/eduardo-official-1x1.png` | `56b035bf-14e4-4679-81a3-749a26baf46b` |
| `marleni` | **Marleni Méndez**<br>Finance Officer & DCAA Compliance Lead | `169D8`<br>`X3HUQZ66P6N3` | `1-945-218-5896`<br>`accounting@p22corp.com` | `assets/staff/marleni-official-1x1.png` | `50005e25-26ba-446f-86c3-e16a3450d967` |
| `bids` | **Government Procurement Desk**<br>24-Hour Rapid RFQ & Solicitation Unit | `169D8`<br>`X3HUQZ66P6N3` | `1-888-722-2675`<br>`bids@p22corp.com` | `assets/staff/bids-official-1x1.png` | `79cca1ec-88a4-4cc2-b6de-d71d8bfa71e4` |
| `logistics` | **Dallas Logistics Hub**<br>Centralized Fleet Dispatch & Staging | `169D8`<br>`X3HUQZ66P6N3` | `1-888-722-2675`<br>`logistics@p22corp.com` | `assets/staff/logistics-official-1x1.png` | `b2ffe06f-6008-4ed5-ae04-4d7992772d03` |

---

## 5. Technical Decision Gates Audit & Final Consensus

| Decision Gate | Selected Configuration | Implementation Justification |
| :--- | :--- | :--- |
| **1. 3D Tilt Dynamics** | **Subtle Executive ($\pm 10^\circ$)** | Maintains high legibility of technical specs, CAGE codes, and tap targets across mobile viewports. |
| **2. Mobile Gyroscope** | **Touch Only (No DeviceOrientation)** | Eliminates iOS Safari's native sensor permission prompt. Avoids alarming security-conscious government procurement officers. |
| **3. Lead Capture Flow** | **Inline Fast-Track + Post-Save Modal** | Allows attendees to immediately request RFQ docs or drop their contact card right after saving the rep's vCard. |
| **4. Division Navigation** | **Strictly Isolated Cards + Dedicated Badge Studio** | When an agency representative scans Eduardo's card, they see Eduardo. Cross-corridor switching is cleanly organized in the dedicated Staff Badge Studio (`/badge`). |
| **5. Wallet Infrastructure** | **WalletWallet API Mint + Static CDN Edge** | Eliminates Pass2U 10-user cap and ad banners. Guarantees permanent, unmetered Apple Wallet and Google Wallet access at $0 ongoing cost. |

---

## 6. Implementation Status & Production Verification

- [x] **Verified SAM.gov Identifiers:** Hardcoded `169D8` and `X3HUQZ66P6N3` across all cards, views, and vCards.
- [x] **1:1 High-Resolution Avatars:** 800x800 square portraits generated for Pedro, Eduardo, and Marleni; clean gold medallion for Procurement Desk.
- [x] **Official PassKit Bundles:** All 5 `.pkpass` files cryptographically signed via WalletWallet and stored in `assets/passes/`.
- [x] **Google Wallet JWT Links:** Added direct `googleSaveUrl` records into `team.json`.
- [x] **Standalone Staff Badge Studio:** Live at `/badge` with zero PIN requirement, dynamic in-badge QR pass, and live Dallas CST authenticity clock.
- [x] **1-Click PWA Installation:** Intercepts `beforeinstallprompt` on Android/Chrome/Edge and triggers an interactive native guide on iOS Safari.
- [x] **Offline Service Worker (`sw.js`):** Bumped to v3.2 Titanium with pre-caching of all 1:1 staff assets, lockscreens, and capability statement PDFs.
- [x] **Production Deployment:** Live on Vercel AnyCast CDN with verified HTTP 200 responses.
