/**
 * P-22 Corp Digital Card - 15-Minute Consultation Scheduler Endpoint
 * /api/consultation
 *
 * Ingests direct briefing bookings from:
 * 1. Public Digital Cards (#briefingModal)
 * 2. Mobile Badge & Fast-Track Portals
 *
 * Actions:
 * - Appends to Google Sheets 'Consultations' tab (Zero external 404s!)
 * - Dispatches instant smartphone & inbox alert to assigned staff member
 * - Generates Google Meet room URL and calendar event payload
 */

const { appendConsultationRow } = require('../lib/google-sheets');
const { notifyStaffOfConsultation } = require('../lib/notifications');
const { createGoogleCalendarEvent } = require('../lib/google-calendar');
const { syncConsultationToWix } = require('../lib/wix-crm');

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    let payload = {};
    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body);
      } catch (e) {
        payload = { raw: req.body };
      }
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body;
    }

    const repName = payload.rep_name || payload.rep || 'Pedro Felipe';
    const clientName = payload.client_name || payload.name || 'Anonymous Client';
    const agency = payload.client_agency || payload.agency || 'Government / Prime Contractor';
    const email = payload.client_email || payload.email || '';
    const phone = payload.client_phone || payload.phone || '';
    const meetingDate = payload.meeting_date || payload.date || new Date().toISOString().split('T')[0];
    const meetingSlot = payload.meeting_slot || payload.slot || '10:00 AM CST';
    const topic = payload.topic || payload.scope || '15-Min Capabilities & Rapid RFQ Briefing';
    const notes = payload.notes || `Booked via Digital Card for ${repName}`;

    const formattedMeetingTime = `${meetingDate} at ${meetingSlot} (Business Hours CST)`;
    const meetLink = `https://meet.google.com/p22-procurement-desk`;

    const consultEntry = {
      timestamp: new Date().toISOString(),
      rep_name: repName,
      client_name: clientName,
      client_agency: agency,
      client_email: email,
      client_phone: phone,
      meeting_time: formattedMeetingTime,
      meet_link: meetLink,
      status: '🟢 Scheduled',
      topic,
      notes,
    };

    // 1. Append directly to Google Sheets Consultations tab
    let sheetResult = null;
    try {
      sheetResult = await appendConsultationRow(consultEntry);
    } catch (sheetErr) {
      console.warn('[-] Warning appending consultation to sheet:', sheetErr.message);
    }

    // 2. Dispatch instant email alert to staff rep & bids desk
    try {
      await notifyStaffOfConsultation(consultEntry);
    } catch (notifErr) {
      console.warn('[-] Warning dispatching consultation alert:', notifErr.message);
    }

    // 2b. Dual-Stack Mirror to Wix CRM (p22corp.com)
    try {
      await syncConsultationToWix(consultEntry);
    } catch (wixErr) {
      console.warn('[-] Warning mirroring consultation to Wix:', wixErr.message);
    }

    // 3. Attempt direct Google Calendar API event creation on staff calendar
    let directCalendarResult = null;
    try {
      directCalendarResult = await createGoogleCalendarEvent({
        ...consultEntry,
        meeting_date: meetingDate,
        meeting_slot: meetingSlot,
      });
      if (directCalendarResult && directCalendarResult.success && directCalendarResult.meetLink) {
        meetLink = directCalendarResult.meetLink;
        consultEntry.meet_link = meetLink;
      }
    } catch (calErr) {
      console.warn('[-] Warning attempting direct Google Calendar API insert:', calErr.message);
    }

    // 4. Generate direct Google Calendar Event URL for attendee
    const titleEncoded = encodeURIComponent(`15-Min Executive Briefing: P-22 Corp & ${agency}`);
    const detailsEncoded = encodeURIComponent(`15-Minute Executive Briefing with ${repName} (P-22 Corp Construction Material Solutions LLC).\n\nTopic: ${topic}\nClient: ${clientName} (${agency})\nDirect Phone: ${phone}\nGoogle Meet Room: ${meetLink}\n\nDFW Headquarters • Nationwide Federal Infrastructure Response`);
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleEncoded}&details=${detailsEncoded}&location=${encodeURIComponent(meetLink)}`;

    // 5. Generate universal .ICS calendar file for Outlook / Apple Calendar
    const cleanDate = (meetingDate || '').replace(/-/g, '') || '20261006';
    let startHour = 10;
    if (meetingSlot.includes('09:00')) startHour = 9;
    else if (meetingSlot.includes('10:00')) startHour = 10;
    else if (meetingSlot.includes('11:30')) startHour = 11;
    else if (meetingSlot.includes('01:30')) startHour = 13;
    else if (meetingSlot.includes('02:30')) startHour = 14;
    else if (meetingSlot.includes('03:30')) startHour = 15;
    else if (meetingSlot.includes('04:30')) startHour = 16;
    const startHourStr = String(startHour).padStart(2, '0');
    const startMinStr = meetingSlot.includes(':30') ? '30' : '00';
    const endMinStr = meetingSlot.includes(':30') ? '45' : '15';
    const dtStart = `${cleanDate}T${startHourStr}${startMinStr}00`;
    const dtEnd = `${cleanDate}T${startHourStr}${endMinStr}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//P-22 Corp//Executive Briefing//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:15-Min Executive Briefing: P-22 Corp & ${agency}`,
      `DESCRIPTION:15-Minute Executive Capabilities Briefing with ${repName} (P-22 Corp Construction Material Solutions LLC).\\n\\nTopic: ${topic}\\nClient: ${clientName} (${agency})\\nDirect Phone: ${phone}\\nGoogle Meet: ${meetLink}\\n\\nDFW Headquarters • Nationwide Federal Infrastructure Response`,
      `LOCATION:${meetLink}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

    return res.status(200).json({
      ok: true,
      message: 'Consultation successfully scheduled and confirmed.',
      consultation: {
        rep_name: repName,
        client_name: clientName,
        agency,
        meeting_time: formattedMeetingTime,
        meet_link: meetLink,
        google_cal_url: (directCalendarResult && directCalendarResult.htmlLink) || googleCalUrl,
        direct_calendar_event: !!(directCalendarResult && directCalendarResult.success),
        ics_url: icsUrl,
      },
    });
  } catch (err) {
    console.error('[-] Error in /api/consultation:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'Failed to schedule consultation',
      details: err.message,
    });
  }
};
