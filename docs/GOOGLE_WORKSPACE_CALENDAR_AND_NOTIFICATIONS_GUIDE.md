# P-22 Corp: Google Workspace Appointment Schedules & Instant Staff Lead Notifications
**Document Version:** 4.1.0 (Production / Expo Live Edition)  
**Target Domain:** `https://card.p22corp.com`  
**Classification:** CUI / Internal Operations  
**Last Updated:** 2026-10-04  

This operational manual documents the production architecture and setup instructions for:
1. **15-Minute Executive Consultation Workflow (Google Workspace Appointment Schedules)**
2. **Real-time Conflict Checking & Business Hours (Mon–Fri 8:00 AM – 5:00 PM CST)**
3. **Automated Google Meet Video & US Dial-in Generation**
4. **Instant Smartphone / In-Box Lead Alerts with Embedded Business Card Photos**
5. **Google Sheets `Consultations` & `Leads_Vault` Telemetry Logging**

---

## 1. The 15-Minute Consultation Workflow

### Why Google Workspace Appointment Schedules?
- **100% Native to P-22 Corp**: Uses each representative's existing `@p22corp.com` corporate Google account.
- **Zero Additional Subscription Fees**: Included free with Google Workspace Business/Enterprise.
- **Strict Business Hours**: Enforced to Dallas HQ time (**Mon – Fri, 8:00 AM – 5:00 PM CST**).
- **Two-Way Real-Time Conflict Checking**: When a staff member has a meeting or personal block on their calendar, that time is automatically hidden. Double-booking is technically impossible.
- **Automatic Google Meet Link**: Every confirmed booking generates a unique Google Meet video room and US dial-in phone number.
- **Automated Attendance Protection**: Sends calendar invites instantly and dispatches email reminders **24 hours** and **1 hour** prior to the meeting.

---

## 2. Staff Setup: Generating Your Personal Booking Link (60 Seconds)

Each staff member (`Pedro`, `Eduardo`, `Marleni`, `Bids`, `Logistics`) performs this one-time setup:

1. Open [Google Calendar](https://calendar.google.com) on desktop while logged into your `@p22corp.com` account.
2. In the top-left, click the **+ Create** button &rarr; select **Appointment schedule**.
3. Configure the schedule:
   - **Title**: `P-22 Corp — 15-Minute Executive Briefing`
   - **Appointment duration**: `15 minutes`
   - **General availability**: `Mon – Fri`, `8:00 AM – 5:00 PM` (Central Time - Dallas)
   - **Scheduling window**: Maximum `30 days` in advance, minimum `2 hours` notice.
   - **Adjusted availability / Buffer time**: (Optional) 5–10 min buffer between calls.
   - **Conferencing**: Select **Google Meet video conferencing**.
   - **Booking form fields**:
     - *First name*, *Last name*, *Email address* (Required)
     - Add custom field: *Agency / Prime Contractor* (Required)
     - Add custom field: *Phone Number* (Required)
     - Add custom field: *Procurement Scope / Solicitations* (Optional)
   - **Reminders**: Enable **1 day before** and **1 hour before** email reminders.
4. Click **Save**.
5. Click **Share** on your newly created appointment schedule and copy your link (e.g., `https://calendar.app.google/xxxxxxxx`).
6. Paste the link into `team.json` under `appointmentScheduleUrl` for your staff profile.

> [!NOTE]
> Until a staff member generates their personal `calendar.app.google` link, the digital card automatically falls back to pre-populating Google Calendar with the rep's `@p22corp.com` email, 15-minute briefing title, and Google Meet location!

---

## 3. Instant Email Notifications for Staff with Embedded Card Photos

When an expo attendee completes **Step 2 ("Exchange Contact")** or a staff member scans their business card with the **OCR Scanner**:

### How the Notification Reaches the Staff Member
1. The lead is captured and validated by `/api/leads.js`.
2. The lead is appended directly into `Leads_Vault` in the Google Sheet:  
   [P22_Badge_Telemetry](https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0)
3. An instant email alert is dispatched to the assigned representative:
   - Pedro Felipe &rarr; `pfelipe@p22corp.com`
   - Eduardo López &rarr; `elopez@p22corp.com`
   - Marleni Méndez &rarr; `mmendez@p22corp.com`
   - Bids Division &rarr; `bids@p22corp.com`
   - Logistics Division &rarr; `logistics@p22corp.com`
   - Master BCC &rarr; `bids@p22corp.com`

### Alert Email Content & Live Image Preview
- **Subject**: `🚨 New Expo Contact: [Client Name] ([Agency/Prime]) - [Staff Rep]`
- **Body Elements**:
  - Full client name, title, agency, email, and direct phone.
  - Procurement scope & extracted business card OCR notes.
  - **Embedded High-Resolution Scanned Card Photo**: The scanned paper card or conference badge is embedded directly into the notification email table with gold bordered styling.
  - **Click-to-Call** button (launches phone dialer directly).
  - **Reply via Email** button (pre-populates subject line).
  - **Direct Staff Vault Link**: `https://card.p22corp.com/setup#vault` to open the full leads inventory.

---

## 4. Activating the Native Google Sheets Apps Script Trigger

To have the Google Sheet dispatch real emails from `@p22corp.com` at **$0 cost** with 100% deliverability:

1. Open [P22_Badge_Telemetry on Google Sheets](https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0).
2. Go to **Extensions** &rarr; **Apps Script**.
3. Open `Code.gs`, select all, and paste the code from [google-sheet-email-trigger.gs](file:///i:/_Dev_Builds_/2026/p22-digital-card/scripts/google-sheet-email-trigger.gs).
4. Click **Save** (Disk icon).
5. On the left navigation bar, click the **Triggers** icon (alarm clock) &rarr; **Add Trigger**:
   - **Choose which function to run**: `onLeadAdded`
   - **Select event source**: `From spreadsheet`
   - **Select event type**: `On change`
   - Click **Save** and grant Google Workspace permissions.

---

## 5. Google Sheets Tabs Architecture

The live Google Sheet now houses 4 purpose-built tabs:

| Tab Name | Purpose & Contents |
| :--- | :--- |
| **`Dashboard`** | Executive KPI scorecards, Donut chart of rep distribution, Column chart of conversion interactions. |
| **`Leads_Vault`** | Attendee contacts, agencies, emails, phone numbers, OCR notes, photo thumbnails, and editable Lead Status dropdowns. |
| **`Consultations`** | 15-minute briefings booked, scheduled meeting times, Google Meet URLs, and consultation status tracking (`🟢 Scheduled`, `🟡 Completed`, `🔴 Rescheduled`, etc.). |
| **`Sheet1`** | Raw telemetry log (NFC taps, QR scans, vCard downloads, dial clicks). |

---

*Verified & Deployed: October 2026 &bull; P-22 Corp Construction Material Solutions LLC*
