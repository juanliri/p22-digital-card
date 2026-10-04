/**
 * P-22 CORP — Native Google Workspace Lead Notification Trigger
 * Runs directly inside Google Sheets (P22_Badge_Telemetry) via Apps Script.
 * Dispatches an instant executive email from @p22corp.com to the assigned staff member.
 *
 * HOW TO INSTALL IN 60 SECONDS:
 * 1. Open Spreadsheet: https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any default code, paste this script, and click "Save" (Disk icon).
 * 4. Click "Triggers" (alarm clock icon on left sidebar) > "Add Trigger":
 *    - Choose which function to run: onLeadAdded
 *    - Select event source: From spreadsheet
 *    - Select event type: On change (or On edit)
 *    - Click Save and authorize permissions.
 */

var STAFF_DIRECTORY = {
  "pedro": "pfelipe@p22corp.com",
  "eduardo": "elopez@p22corp.com",
  "marleni": "mmendez@p22corp.com",
  "bids": "bids@p22corp.com",
  "logistics": "logistics@p22corp.com"
};

var DEFAULT_ALERT_INBOX = "bids@p22corp.com";
var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0";

function onLeadAdded(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Leads_Vault");
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return; // Only headers

  // Check if we already notified for this row (Column L: Notified Flag)
  var notifiedFlag = sheet.getRange(lastRow, 12).getValue();
  if (notifiedFlag === "SENT") return;

  var row = sheet.getRange(lastRow, 1, 1, 10).getValues()[0];
  var timestamp = row[0] || new Date().toISOString();
  var repName = String(row[1] || "General Staff");
  var clientName = String(row[2] || "Expo Attendee");
  var agency = String(row[3] || "N/A");
  var email = String(row[4] || "N/A");
  var phone = String(row[5] || "N/A");
  var scope = String(row[6] || "Material Supply & RFQ");
  var notes = String(row[7] || "None");
  var source = String(row[9] || "Digital Card Step 2");

  // Determine recipient
  var repKey = repName.toLowerCase();
  var recipientEmail = DEFAULT_ALERT_INBOX;
  for (var key in STAFF_DIRECTORY) {
    if (repKey.indexOf(key) !== -1) {
      recipientEmail = STAFF_DIRECTORY[key];
      break;
    }
  }

  var subject = "🚨 New Expo Contact: " + clientName + " (" + agency + ") - " + repName;

  var htmlBody = ""
    + "<div style='background-color:#080f1d; padding:24px; font-family:sans-serif; color:#f8fafc;'>"
    + "  <div style='max-width:600px; margin:0 auto; background-color:#0d192e; border:1px solid rgba(241,196,15,0.4); border-radius:14px; overflow:hidden;'>"
    + "    <div style='background:#0b1526; padding:20px 26px; border-bottom:2px solid #f1c40f;'>"
    + "      <div style='font-size:11px; font-weight:800; color:#f1c40f; letter-spacing:2px;'>P-22 CORP &bull; LEAD INTAKE VAULT</div>"
    + "      <h2 style='margin:6px 0 0 0; color:#ffffff; font-size:18px;'>🚨 New Contact Exchange Captured</h2>"
    + "    </div>"
    + "    <div style='padding:12px 26px; background:rgba(241,196,15,0.08); font-size:12px; color:#cbd5e1;'>"
    + "      Assigned Rep: <strong style='color:#f1c40f;'>" + repName + "</strong> &bull; Intake: <em>" + source + "</em>"
    + "    </div>"
    + "    <div style='padding:24px 26px;'>"
    + "      <table width='100%' style='font-size:14px; color:#e2e8f0; line-height:1.6;'>"
    + "        <tr><td width='35%' style='color:#94a3b8; font-weight:bold;'>Client / Lead:</td><td style='color:#ffffff; font-weight:bold; font-size:16px;'>" + clientName + "</td></tr>"
    + "        <tr><td style='color:#94a3b8; font-weight:bold;'>Agency / Prime:</td><td style='color:#f1c40f; font-weight:bold;'>" + agency + "</td></tr>"
    + "        <tr><td style='color:#94a3b8; font-weight:bold;'>Work Email:</td><td><a href='mailto:" + email + "' style='color:#38bdf8; text-decoration:none;'>" + email + "</a></td></tr>"
    + "        <tr><td style='color:#94a3b8; font-weight:bold;'>Direct Phone:</td><td><a href='tel:" + phone + "' style='color:#38bdf8; text-decoration:none; font-weight:bold;'>" + phone + "</a></td></tr>"
    + "        <tr><td style='color:#94a3b8; font-weight:bold;'>Procurement Scope:</td><td>" + scope + "</td></tr>"
    + "        <tr><td style='color:#94a3b8; font-weight:bold; vertical-align:top;'>Extracted Notes:</td><td style='background:rgba(255,255,255,0.05); padding:8px; border-radius:6px; font-size:12px; font-family:monospace;'>" + notes + "</td></tr>"
    + "      </table>"
    + "      <div style='margin-top:22px;'>"
    + "        <a href='tel:" + phone + "' style='background:#f1c40f; color:#0b1526; padding:10px 18px; border-radius:8px; font-weight:bold; text-decoration:none; font-size:13px; display:inline-block; margin-right:8px;'>📞 Call Client</a>"
    + "        <a href='mailto:" + email + "?subject=P-22%20Corp%20Follow-Up' style='background:rgba(255,255,255,0.1); color:#ffffff; padding:10px 18px; border-radius:8px; font-weight:bold; text-decoration:none; font-size:13px; display:inline-block;'>✉️ Reply via Email</a>"
    + "      </div>"
    + "    </div>"
    + "    <div style='padding:14px 26px; background:#081120; text-align:center; font-size:11px; color:#64748b; border-top:1px solid rgba(255,255,255,0.05);'>"
    + "      View live in <a href='" + SPREADSHEET_URL + "' style='color:#f1c40f;'>P22_Badge_Telemetry</a> &bull; P-22 Corp Construction Material Solutions LLC"
    + "    </div>"
    + "  </div>"
    + "</div>";

  try {
    MailApp.sendEmail({
      to: recipientEmail,
      cc: DEFAULT_ALERT_INBOX !== recipientEmail ? DEFAULT_ALERT_INBOX : undefined,
      subject: subject,
      htmlBody: htmlBody
    });

    // Mark as sent so it won't duplicate
    sheet.getRange(lastRow, 12).setValue("SENT");
    Logger.log("Notification sent successfully to: " + recipientEmail);
  } catch (err) {
    Logger.log("Failed to send notification: " + err.toString());
  }
}

/**
 * Automatically creates a Google Calendar event on Pedro / Staff Calendar
 * and sends official Google Calendar invitations when a consultation is booked.
 */
function onConsultationAdded(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Consultations");
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return; // Only headers

  // Column K: Calendar Sync Flag
  var syncedFlag = sheet.getRange(lastRow, 11).getValue();
  if (syncedFlag === "CALENDAR_SYNCED") return;

  var row = sheet.getRange(lastRow, 1, 1, 10).getValues()[0];
  var timestamp = row[0];
  var repName = String(row[1] || "Pedro Felipe");
  var clientName = String(row[2] || "Attendee");
  var agency = String(row[3] || "Contractor / Agency");
  var email = String(row[4] || "");
  var phone = String(row[5] || "");
  var meetingTimeStr = String(row[6] || "");
  var meetLink = String(row[7] || "https://meet.google.com/p22-procurement-desk");
  var status = String(row[8] || "Scheduled");
  var notes = String(row[9] || "15-Minute Executive Briefing");

  // Determine staff email
  var repKey = repName.toLowerCase();
  var recipientEmail = "pfelipe@p22corp.com";
  for (var key in STAFF_DIRECTORY) {
    if (repKey.indexOf(key) !== -1) {
      recipientEmail = STAFF_DIRECTORY[key];
      break;
    }
  }

  // Parse Date & Time (e.g. "2026-10-06 at 10:00 AM CST")
  var dateMatch = meetingTimeStr.match(/(\d{4}-\d{2}-\d{2})/);
  var timeMatch = meetingTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  var startTime = new Date();
  if (dateMatch && timeMatch) {
    var parts = dateMatch[1].split("-");
    var hour = parseInt(timeMatch[1], 10);
    var min = parseInt(timeMatch[2], 10);
    var ampm = timeMatch[3].toUpperCase();
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    startTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), hour, min, 0);
  } else {
    startTime = new Date(Date.now() + 24 * 3600 * 1000);
  }

  var endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15-minute briefing

  var eventTitle = "15-Min Executive Briefing: P-22 Corp & " + agency;
  var description = "15-Minute Executive Capabilities Briefing with " + repName + " (P-22 Corp Construction Material Solutions LLC).\n\n"
    + "Client: " + clientName + " (" + agency + ")\n"
    + "Direct Phone: " + phone + "\n"
    + "Work Email: " + email + "\n"
    + "Google Meet Room: " + meetLink + "\n"
    + "Procurement Scope: " + notes + "\n\n"
    + "DFW Headquarters • Nationwide Federal Infrastructure Delivery\nCAGE: 169D8 • UEI: X3HUQZ66P6N3";

  try {
    var cal = CalendarApp.getDefaultCalendar();
    var guests = recipientEmail;
    if (email && email.indexOf("@") !== -1) {
      guests += "," + email;
    }

    var event = cal.createEvent(eventTitle, startTime, endTime, {
      description: description,
      location: meetLink,
      guests: guests,
      sendInvites: true
    });

    sheet.getRange(lastRow, 11).setValue("CALENDAR_SYNCED");
    Logger.log("Successfully created Google Calendar event: " + event.getId());
  } catch (calErr) {
    Logger.log("Error creating Calendar event: " + calErr.toString());
  }
}

