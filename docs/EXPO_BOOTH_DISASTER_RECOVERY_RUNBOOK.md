# P-22 CORP — EXPO BOOTH DISASTER RECOVERY & FIELD PLAYBOOK
**Field Guide for Booth Staff & Representatives**  
**Production Domain:** `https://card.p22corp.com`  
**Classification:** Defense Procurement & Expo Operations  
**Date:** October 2026 | Expo Live Launch Edition  

---

## ⚡ 10-Second Golden Rules on the Floor

1. **If the NFC tap doesn't register in 2 seconds:**  
   Don't keep tapping! Say: *"Let me flash my badge QR code!"* and double-tap your lock screen or tap **[Display QR]** on your badge screen.
2. **If cell service is dead (0 bars) in the hall:**  
   Everything still works! The badge runs offline, the static lockscreen wallpaper scans offline, and leads buffer locally on your phone.
3. **If attendee's phone won't download the vCard (.vcf):**  
   Tap **[Exchange Contact]** on their phone (or your phone) and type their name and phone/email. They'll get an automatic email copy with all details attached.
4. **If your phone battery is dying:**  
   Use any colleague's phone or tablet: open `https://card.p22corp.com/setup` and switch to your name. Your printed lanyard badge also scans 24/7.

---

## 🚨 On-Floor Emergency Triage Matrix

```
[Attendee Approaching]
       │
       ▼
 [Tap NFC Tag] ──► Fails? ──► [Show Lock Screen Wallpaper QR] (100% Offline)
       │                                     │
    Success                               Success
       │                                     │
       └──────────────────┬──────────────────┘
                          │
                          ▼
            [Attendee Opens Digital Card]
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
   [Taps "Save Contact"]     [Hands You Paper Business Card]
             │                         │
      Download Fails?                  ▼
      (In-App Browser)         [Open Badge -> Tap 📷 Scan Card]
             │                         │
             ▼                         ▼
   [Tap 3 Dots -> "Safari"]     [Snap Card Photo]
             OR                        │
   [Use Step 2 Info Exchange]          ├── AI auto-fills fields
                                       │   (High-contrast dark inputs)
                                       ▼
                                [Tap Submit Exchange]
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
                 [Online: Sent to              [Offline: Saved to
               Google Sheets & Email]        Local Phone Buffer]
                                                      │
                                            Syncs when cell returns!
```

---

## 🛠️ Step-by-Step Problem Solver

### 1. "My Camera Won't Open in the Scanner"
1. In Safari or Chrome, tap the **aA** or **lock/tune icon** in the top address bar.
2. Tap **Website Settings** &rarr; **Camera** &rarr; set to **Allow**.
3. Reload page.
4. If still blocked: Tap **"Choose File"** button in scanner modal to take a photo using your normal camera app.

### 2. "The Form Fields Look White or Unreadable"
- This has been resolved! All input boxes in the scanner are styled with **Deep Navy backgrounds (`#0B132B`)** and **Crisp White text (`#FFFFFF`)** with a **Gold glow** when active.
- If you see any old styling, hard-refresh the page (Safari: long-press reload &rarr; Request Desktop Site).

### 3. "The Attendee Cannot Find the Confirmation Email"
- Notification emails are dispatched instantly from `notifications@p22corp.com` (or Google Workspace alert).
- Have attendee check their **Spam / Junk / Promotions** folder for:  
  `P-22 Corp Capabilities Briefing` or search `p22corp.com`.
- Give them your direct line: **1-945-218-5896** (Pedro / Eduardo) or **1-888-722-2675** (Procurement Desk).

### 4. "I Scanned Cards while Offline — Where Did They Go?"
1. Every scan without cell signal is safely preserved in your phone's memory.
2. Open `https://card.p22corp.com/setup#vault`.
3. You will see a list of every attendee scanned with timestamp and photo preview.
4. When you step outside or connect to hotel Wi-Fi, tap the golden **[Sync All to Sheet]** button. All rows will sync into the Google Sheet automatically.
5. You can also tap **[Download CSV]** at any time to save an Excel-ready spreadsheet directly to your phone files.

### 5. "Attendee Wants to Book a 15-Minute Briefing Right Now"
1. On your card or badge, tap **[📅 Book 15-Min Briefing]**.
2. If they have Google Calendar, it opens pre-populated with:
   - Topic: Executive Capabilities Briefing
   - Video Room: Google Meet link automatically attached
   - Representative: Pre-filled with your `@p22corp.com` address
3. If they don't have Google Calendar: Have them enter their email, and tap **"Send Calendar Invite"** — an `.ics` invite will be emailed to them.

---

## 📱 Pre-Opening Morning Booth Checklist (Done in 2 Minutes)

- [ ] Phone charged to 100% + power bank in pocket.
- [ ] Screen brightness set to 80%+ (easier for attendees to scan).
- [ ] Offline Lockscreen wallpaper active on phone screen.
- [ ] PWA Badge installed on home screen (`card.p22corp.com/badge?rep=YOUR_NAME`).
- [ ] 1 test scan executed and visible in `/setup#vault`.
- [ ] Physical business cards and printed lanyard ready as secondary backup.

---

## 📞 Technical Support Contact During Expo
If any unresolvable digital anomaly occurs:
- **Lead Dev Direct / Admin Hotline**: `pfelipe@p22corp.com`
- **Emergency Telemetry Sheet**: [Google Sheets Leads Vault](https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0)
- **Production Status Check**: Open `https://card.p22corp.com/api/router?action=ping` (returns `{"status":"ok"}`).
