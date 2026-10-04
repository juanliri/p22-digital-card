# P-22 CORP — SYSTEM OPERATION & FEATURE MANUAL
**Document Version:** 4.0.0 (Production Release)  
**Security Classification:** CUI / Defense Procurement Internal Operation  
**CAGE Code:** `169D8` | **UEI:** `X3HUQZ66P6N3`  
**System Target:** P-22 Digital Card, Staff Badge PWA & Executive Setup Studio  
**Live Production URL:** `https://card.p22corp.com`

---

## 1. System Overview & Architecture

The P-22 Corp Digital Identity & Contractor Engagement Suite is a dual-tier progressive web platform designed specifically for government contracting, defense logistics, and infrastructure procurement expos (e.g., AUSA, SAME, NDIA, DLA Industry Days).

### Core Components
1. **Public Digital Cards (`/pedro`, `/eduardo`, `/marleni`, `/logistics`, `/bids`)**: High-converting mobile-first web cards for clients, contracting officers, and prime partners.
2. **Staff Phone Badges (`/badge`, `/badge/[rep]`)**: 100% viewport-optimized, offline-capable PWA badges featuring SAM.gov verified tokens, direct pass saving, expo QR modals, and in-field OCR business card scanners.
3. **Executive Pre-Expo Setup Studio (`/setup`)**: 4-tab identity workstation for badge installation, digital wallet pass provisioning (Apple & Google), offline failsafe lockscreens, Apple Watch photo clock faces, Zoom virtual backgrounds, 1-click email signatures, and live Google Sheets telemetry.
4. **Backend Edge Telemetry & Leads Vault (`/api/track`, `/api/lead`, `/api/router`, `/api/ocr`)**: NIST SP 800-171 AU-2 / OMB M-10-22 compliant zero-cookie telemetry router streaming analytics and business card OCR captures directly into Google Sheets.

---

## 2. Staff Roles & Representative Perspectives

The platform supports 5 standardized organizational identities, each mapped to specific CAGE/UEI federal contracting profiles:

| Representative Slug | Official Name | Title / Organizational Scope | Primary Email | Direct Line |
|---|---|---|---|---|
| **`pedro`** | Pedro Felipe | Managing Director & Federal Contract Lead | `pfelipe@p22corp.com` | `1-945-218-5896` |
| **`eduardo`** | Eduardo López | Director of Commercial Sales & Material Supply | `elopez@p22corp.com` | `1-945-218-5896` |
| **`marleni`** | Marleni Méndez | Director of Finance & Contract Compliance | `mmendez@p22corp.com` | `1-888-722-2675` |
| **`bids`** | Government Procurement Desk | Federal Procurement & Rapid RFQ Desk | `bids@p22corp.com` | `1-888-722-2675` |
| **`logistics`** | Dallas Logistics Hub | Central Material Staging & Fleet Logistics | `logistics@p22corp.com` | `1-888-722-2675` |

---

## 3. Public Digital Card Features (`/pedro`, `/eduardo`, etc.)

Every public card delivers an interactive federal capability experience:
- **Verified Federal Plaque**: Live indicators for CAGE `169D8`, SAM.gov Registered, FAR/DFARS Compliant, TAA Certified.
- **Fast-Track Procurement Actions**:
  - **Save Contact (`.vcf`)**: Instant RFC 2426 vCard 3.0 download containing full company details, base64 embedded official portrait, and direct dials.
  - **Add to Apple Wallet (`.pkpass`)**: Downloads a signed cryptographic pass for offline access.
  - **Save to Google Wallet**: Direct Google Pay pass issuer deep-link.
  - **Download Capability Statement (`.pdf`)**: Serves `P22-Capability-Statement-Official.pdf` (NAICS 423320, 423390, 423720, 238210).
- **Embedded In-Field Business Card OCR Scanner**:
  - Tapping **`[📷 Snap Business Card]`** opens an in-browser camera/file intake.
  - Automatically transcribes name, agency, email, phone, and notes using on-device neural Tesseract OCR and Cloud AI Vision fallback.
  - Submits structured lead data directly into Google Sheets `Leads_Vault` tab.
- **Fast-Track RFQ Modal**: Submits procurement requests directly to staff email and Google Sheets.

---

## 4. Staff Digital Badges (`/badge`, `/badge/[rep]`)

Designed specifically for crowded expo floors where mobile connectivity is degraded:
- **100% Viewport-Locked (`100dvh`)**: The entire badge fits on phone screens without scrolling.
- **Action Grid**:
  1. **`[Save Pass]`**: One-tap trigger that triggers native Web Share API (Android) or native vCard preview with instructional guidance toast (iOS).
  2. **`[Display QR]`**: Fullscreen high-contrast QR modal allowing clients to scan and open the representative's public card instantly.
  3. **`[📷 Scan Card]`**: Instant camera shortcut allowing staff to photograph a client's paper business card or conference badge directly from their personal badge screen without opening `/setup`.
- **Compact Secondary Navigation**:
  - Secondary tools are folded into a pill dropdown: `[⚙️ Staff Tools & Portal Links ▾]`.
  - Links: `Staff Setup Studio`, `Public Digital Card`, `p22corp.com`, `Capability Line Card`.
- **PWA Offline Failsafe**: Registered with Service Worker (`/sw.js`) so the badge remains fully functional even in airplane mode.

---

## 5. Pre-Expo Setup & Asset Studio (`/setup`)

The executive workspace is structured into a streamlined 4-tab interface:

### Tab 1: Passes & Contacts (`#setupTabContent-passes`)
- **Apple Wallet (.pkpass)**: Downloads personalized `.pkpass` file with live barcode and push updates.
- **Google Wallet**: 1-click Google Pay Pass issuance via signed JWT.
- **Physical NFC Card Programming Guide**: Instructions for flashing NTAG213/215/216 chips with the edge redirect URL `https://card.p22corp.com/r/[rep]`.

### Tab 2: Digital Visuals (`#setupTabContent-visuals`)
- **Offline Failsafe Lock Screen (9:16 Canvas)**: 8K composited blueprint wallpaper with high-contrast QR plaque. If expo Wi-Fi fails completely, staff can display their lock screen for instant scans.
- **Apple Watch Photo Clock Face**: 1:1 canvas generating a dedicated watch dial wallpaper with scannable QR code.
- **1080p Zoom & Teams Virtual Background**: High-resolution video conference background with branded P-22 styling and personal corner QR code.

### Tab 3: Email Signature (`#setupTabContent-signature`)
- **1-Click Rich HTML Signature**: Formatted according to corporate defense contractor standards. Pre-rendered live preview.
- Includes CAGE `169D8`, UEI `X3HUQZ66P6N3`, direct phone, email, and clickable buttons to the Digital Card and Capability Statement.
- **DWD Push Status**: Indicates Google Workspace Domain-Wide Delegation sync status.

### Tab 4: Telemetry & Vault (`#setupTabContent-telemetry`)
- **Live Google Sheets Analytics Hub**: Real-time KPI dashboard link and test telemetry beacon trigger.
- **Expo Lead Capture Vault**: Local browser cache + live sync of all collected expo leads.
- **Actions**:
  - `[Scan Card (OCR)]`: Launch OCR camera scanner.
  - `[Sync All to Sheet]`: Push offline-queued leads to Google Sheets.
  - `[Download (.CSV)]`: Export lead database in RFC 4180 CSV format.
  - `[Clear]`: Reset local table cache.

---

## 6. Live Google Sheets Telemetry & Leads Vault

All client interactions stream to Google Spreadsheet ID:  
`1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0`

### Sheet 1: Raw Audit Stream (`Sheet1`)
- **Headers**: `Timestamp (UTC)`, `Representative`, `Event Type`, `Traffic Source`, `Device / OS`, `Action Details`, `Client IP Hash`, `Session Identifier`.
- **Compliance**: OMB M-10-22 / NIST SP 800-171 AU-2 compliant (zero cookies, zero tracking pixels from third-party advertising networks).

### Sheet 2: Executive Leads Vault (`Leads_Vault`)
- **Headers**:
  1. `Timestamp (UTC)`
  2. `Staff Rep`
  3. `Client / Lead Name`
  4. `Agency / Prime Contractor`
  5. `Work Email`
  6. `Phone`
  7. `Procurement Scope / Interest`
  8. `Extracted Card Text / Notes`

### Sheet 3: KPI Dashboard (`Dashboard`)
- Calculated metrics: Total Page Views, Contact Downloads, Wallet Installs, RFQ Submissions, and Rep Breakdown.
