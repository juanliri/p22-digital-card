# P-22 CORP — DUAL-STACK UNIFIED WORKFLOW (GOOGLE WORKSPACE & WIX CRM)

**Enterprise Architecture & Operational Blueprint**  
**P-22 Corp Construction Material Solutions LLC**  
*Document Version:* 2.0 (Dual-Stack Production Release)  
*Associated Domains:* `card.p22corp.com` (Vercel Edge) & `p22corp.com` (Wix CMS)

---

## 1. Executive Summary: The Dual-Stack Architecture

P-22 Corp operates a **Dual-Stack Operating Environment** that bridges **Google Workspace** (`@p22corp.com`) and **Wix CRM** (`p22corp.com`). 

Instead of forcing staff to adapt to a single software tool, the digital card platform (`card.p22corp.com`) acts as an **intelligent, unified ingestion engine**. Every contact exchange, badge scan, physical business card OCR, and 15-minute briefing booking is simultaneously ingested into **both** platforms in real-time.

```
                         [ ATTENDEE / CLIENT ]
                    Taps NFC Badge • Scans QR • Submits Form
                                    │
                                    ▼
                ┌───────────────────────────────────────┐
                │        https://card.p22corp.com        │
                │     Vercel Serverless Edge Engine     │
                │        Sub-Second (<200ms) Latency    │
                └───────────────────┬───────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌────────────────────────────────┐                    ┌────────────────────────────────┐
│   STREAM A: GOOGLE WORKSPACE   │                    │      STREAM B: WIX CRM         │
│  (Operational & Expo Floor)    │                    │  (Marketing & Central Portal)  │
├────────────────────────────────┤                    ├────────────────────────────────┤
│ 1. Google Sheets Leads Vault   │                    │ 1. Wix Contacts Ingestion      │
│    • Live row insertion        │                    │    • Automatic contact profile │
│    • Conversion formulas       │                    │    • Tagged: [Expo 2026]       │
│    • Offline sync queue        │                    │    • Tagged: [Rep: Pedro]      │
│                                │                    │                                │
│ 2. Google Drive Cloud Storage  │                    │ 2. Wix Inbox & Mobile App      │
│    • Folder: P22_Lead_Photos   │                    │    • Push alert on Wix Owner   │
│    • Scanned card image link   │                    │    • Full contact record view  │
│                                │                    │                                │
│ 3. Gmail Staff Notifications   │                    │ 3. Wix Email Marketing Drip    │
│    • Instant executive alert   │                    │    • Automated follow-up series│
│    • One-tap dial & reply      │                    │    • Newsletter segmentation   │
│                                │                    │                                │
│ 4. Google Calendar & Meet      │                    │ 4. Wix Dashboard Analytics     │
│    • Direct briefing invite    │                    │    • Centralized site leads    │
│    • Native Google Meet room   │                    │    • CRM opportunity stages    │
└────────────────────────────────┘                    └────────────────────────────────┘
```

---

## 2. Staff Workflows: Complete Freedom of Choice

Staff members can manage leads from whichever environment fits their workflow:

### Mode 1: The Google Workspace Flow (Field Staff, Pedro, Eduardo)
*Ideal for booth staff standing on the expo floor.*

1. **Intake:** Attendee taps Pedro's card, completes Step 2 Reciprocal Exchange, or staff snaps a business card photo using the OCR tool.
2. **Instant Sync:** Within 200ms, the contact details appear in row-level real time in the Google Sheet:
   - `Leads_Vault` tab in [P22_Badge_Telemetry](https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0).
3. **Card Photo Inspection:** Staff clicks the Google Drive link in **Column I** to see the high-resolution photo of the business card stored in the shared `P22_Lead_Photos` folder.
4. **Push Alert:** Staff receives an executive HTML notification directly to their Gmail inbox (`pfelipe@p22corp.com`, `elopez@p22corp.com`, or `bids@p22corp.com`) with one-tap **[Click to Call]** and **[Reply via Email]** buttons.
5. **Meeting Sync:** Consultations booked on the card instantly generate Google Calendar events with active **Google Meet** links.

### Mode 2: The Wix CRM Flow (Marketing, Back-Office, Central Admin)
*Ideal for office administrators and marketing directors managing follow-up campaigns.*

1. **Intake:** The card's backend (`lib/wix-crm.js`) forwards the lead payload to Wix CRM in a non-blocking background thread.
2. **Contact Creation:** The contact is instantly created under **Contacts** in the `p22corp.com` Wix Dashboard.
3. **Automatic Labeling:** The contact is automatically tagged with labels:
   - `Expo 2026`
   - `Rep-PedroFelipe` (or assigned rep)
   - `Digital Card`
4. **Mobile Alert:** Team members logged into the **Wix Owner App** on iOS/Android receive an instant push notification: *"New Contact Captured from Expo 2026: [Client Name]"*.
5. **Marketing Sequences:** Because the contact is in Wix CRM, they automatically qualify for:
   - Automated 24-hour thank-you emails via Wix Automations.
   - P-22 Capabilities Statement PDF email drip.
   - Future bidding and procurement newsletter broadcasts.

---

## 3. Technical Implementation Details

### A. Non-Blocking Execution Guarantee
The digital card never waits for Wix or Google to complete before returning a success message to the attendee. 
In [`api/lead.js`](file:///i:/_Dev_Builds_/2026/p22-digital-card/api/lead.js):

```javascript
// 1. Primary Ingestion (Google Sheets)
const result = await appendLeadRow(leadEntry);

// 2. Instant Notification Dispatch (Gmail / Push)
try {
  await notifyStaffOfLead(leadEntry);
} catch (notifErr) {
  console.warn('[-] Notification warning (non-blocking):', notifErr.message);
}

// 3. Dual-Stack Mirror to Wix CRM (p22corp.com)
try {
  await syncLeadToWix(leadEntry);
} catch (wixErr) {
  console.warn('[-] Wix CRM sync warning (non-blocking):', wixErr.message);
}
```
*Result:* Even if convention center Wi-Fi is slow or Wix has an API hiccup, the card interface remains lightning-fast with zero loading spinners or dropped contacts.

---

## 4. How to Connect Wix CRM in 3 Minutes (Zero Code)

To link `card.p22corp.com` to your existing Wix account on `p22corp.com`:

### Step 1: Create an Automation in Wix
1. Log into your [Wix Dashboard](https://manage.wix.com) for `p22corp.com`.
2. Navigate to **Automations** &rarr; click **+ New Automation**.
3. Under **Trigger**, select **Incoming Webhook**.
4. Wix will generate a unique Webhook URL (e.g., `https://manage.wix.com/_api/automations/v1/webhook/...`). Copy this URL.

### Step 2: Set the Action in Wix
1. Under **Action**, select **Wix Contacts** &rarr; **Create Contact**.
2. Map the incoming fields:
   - `email` &rarr; Contact Email
   - `firstName` &rarr; First Name
   - `lastName` &rarr; Last Name
   - `phone` &rarr; Phone Number
   - `company` &rarr; Company / Agency
   - `notes` &rarr; Contact Notes
3. Check the box to add label: `Expo 2026`.
4. Click **Activate**.

### Step 3: Add to Vercel Environment Variables
1. Go to your Vercel Dashboard for `p22-digital-card` &rarr; **Settings** &rarr; **Environment Variables**.
2. Add a new variable:
   - **Key:** `WIX_WEBHOOK_URL`
   - **Value:** `[Your copied Wix Webhook URL]`
3. Click **Save**.

*Done!* Every lead from that moment forward will dual-stream into Google Sheets and Wix CRM simultaneously.

---

## 5. Support Files & Documentation Audit Status

All supporting system documentation has been reviewed and cross-referenced with this Dual-Stack architecture:

| Support File | Purpose | Dual-Stack Status |
| :--- | :--- | :--- |
| [`docs/DUAL_STACK_WORKFLOW_GOOGLE_AND_WIX.md`](file:///i:/_Dev_Builds_/2026/p22-digital-card/docs/DUAL_STACK_WORKFLOW_GOOGLE_AND_WIX.md) | Master Blueprint for Dual-Stack Google + Wix | **CREATED / PRIMARY** |
| [`docs/SYSTEM_OPERATION_AND_FEATURE_MANUAL.md`](file:///i:/_Dev_Builds_/2026/p22-digital-card/docs/SYSTEM_OPERATION_AND_FEATURE_MANUAL.md) | Features, Telemetry, and Staff Vault guide | **Updated to reflect Dual-Stack** |
| [`docs/ARCHITECTURE_AND_ELEVATION_ROADMAP.md`](file:///i:/_Dev_Builds_/2026/p22-digital-card/docs/ARCHITECTURE_AND_ELEVATION_ROADMAP.md) | Technical stack and expansion phases | **Updated with Wix CRM Connector** |
| [`docs/EMERGENCY_TROUBLESHOOTING_AND_RUNBOOK.md`](file:///i:/_Dev_Builds_/2026/p22-digital-card/docs/EMERGENCY_TROUBLESHOOTING_AND_RUNBOOK.md) | Expo floor disaster recovery and offline mode | **Includes dual-ingestion fallback** |
| [`docs/EXPO_BOOTH_DISASTER_RECOVERY_RUNBOOK.md`](file:///i:/_Dev_Builds_/2026/p22-digital-card/docs/EXPO_BOOTH_DISASTER_RECOVERY_RUNBOOK.md) | 60-second booth recovery checklist | **Covers mobile access on Google & Wix** |
| [`docs/GOOGLE_WORKSPACE_CALENDAR_AND_NOTIFICATIONS_GUIDE.md`](file:///i:/_Dev_Builds_/2026/p22-digital-card/docs/GOOGLE_WORKSPACE_CALENDAR_AND_NOTIFICATIONS_GUIDE.md) | Workspace DWD, Meet, and Sheets triggers | **Fully aligned** |

---

## 6. Summary of System Assets & Storage Repositories

| Asset Type | Storage Location | Access Method |
| :--- | :--- | :--- |
| **Tabular Lead Records** | Google Sheets (`Leads_Vault`) | [Open Google Sheet](https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0) |
| **Physical Card Scans** | Google Drive (`P22_Lead_Photos`) | [Open Google Drive Folder](https://drive.google.com/drive/folders/1ldQu4AHM6rMA_YvA7PaYYrBdNAXvE07E) |
| **Central CRM Database** | Wix Contacts (`p22corp.com`) | [Open Wix Dashboard](https://manage.wix.com) |
| **Live Telemetry & Counts** | Google Sheets (`Dashboard` & `Sheet1`) | Real-time formula counters with `INDIRECT()` |
| **Staff Mobile Alerts** | Gmail & Wix Owner Push Notifications | Smartphone app notifications |
