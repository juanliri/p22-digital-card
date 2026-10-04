/**
 * P-22 CORP — Google Calendar API Integration Engine
 * Directly inserts 15-minute briefings onto staff's Google Calendar via Google Calendar API v3.
 * Dispatches real-time calendar invites with Google Meet video room.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

let calendarInstance = null;

function getCalendarClient() {
  if (calendarInstance) return calendarInstance;

  let credentials = null;
  if (process.env.GOOGLE_SERVICE_KEY) {
    try {
      const raw = process.env.GOOGLE_SERVICE_KEY.trim();
      credentials = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      console.warn('[!] Failed to parse GOOGLE_SERVICE_KEY for Calendar:', err.message);
    }
  }

  if (!credentials) {
    const keyPath = path.join(process.cwd(), 'credentials', 'google-sa.json');
    if (fs.existsSync(keyPath)) {
      try {
        credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      } catch (err) {
        console.warn('[!] Failed to read local credentials for Calendar:', err.message);
      }
    }
  }

  if (!credentials) {
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });
    calendarInstance = google.calendar({ version: 'v3', auth });
    return calendarInstance;
  } catch (authErr) {
    console.warn('[!] Calendar auth error:', authErr.message);
    return null;
  }
}

/**
 * Calculates start and end ISO strings for a meeting slot.
 */
function calculateMeetingTimeRange(meetingDate, meetingSlot) {
  const cleanDate = (meetingDate || '').trim() || new Date().toISOString().split('T')[0];
  let startHour = 10;
  if (meetingSlot.includes('09:00')) startHour = 9;
  else if (meetingSlot.includes('10:00')) startHour = 10;
  else if (meetingSlot.includes('11:30')) startHour = 11;
  else if (meetingSlot.includes('01:30')) startHour = 13;
  else if (meetingSlot.includes('02:30')) startHour = 14;
  else if (meetingSlot.includes('03:30')) startHour = 15;
  else if (meetingSlot.includes('04:30')) startHour = 16;

  const startMinute = meetingSlot.includes(':30') ? 30 : 0;
  const startHourStr = String(startHour).padStart(2, '0');
  const startMinStr = String(startMinute).padStart(2, '0');

  // America/Chicago is UTC-5 in Daylight Saving Time (CDT)
  const startIso = `${cleanDate}T${startHourStr}:${startMinStr}:00-05:00`;
  
  // 15-minute briefing duration
  const endMinute = (startMinute + 15) % 60;
  const endHour = startMinute + 15 >= 60 ? startHour + 1 : startHour;
  const endHourStr = String(endHour).padStart(2, '0');
  const endMinStr = String(endMinute).padStart(2, '0');
  const endIso = `${cleanDate}T${endHourStr}:${endMinStr}:00-05:00`;

  return { startIso, endIso };
}

/**
 * Attempts direct insertion into Google Calendar API.
 * Gracefully falls back if Calendar API is not yet activated or calendar is not shared.
 */
async function createGoogleCalendarEvent(consult) {
  const calendar = getCalendarClient();
  if (!calendar) {
    return { success: false, reason: 'credentials_unavailable' };
  }

  const { startIso, endIso } = calculateMeetingTimeRange(consult.meeting_date || consult.meetingDate, consult.meeting_slot || consult.meetingSlot || '10:00 AM CST');

  const repName = consult.rep_name || consult.rep || 'Pedro Felipe';
  const clientName = consult.client_name || consult.name || 'Executive Lead';
  const agency = consult.client_agency || consult.agency || 'Government / Prime Contractor';
  const clientEmail = consult.client_email || consult.email || '';
  const clientPhone = consult.client_phone || consult.phone || '';
  const topic = consult.topic || '15-Minute Capabilities & Rapid RFQ Briefing';

  // Target Calendar ID (custom env, rep email, or primary)
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const attendees = [];
  if (clientEmail && clientEmail.includes('@')) {
    attendees.push({ email: clientEmail, displayName: clientName });
  }
  attendees.push({ email: 'pfelipe@p22corp.com', displayName: 'Pedro Felipe' });
  attendees.push({ email: 'bids@p22corp.com', displayName: 'P-22 Bids Desk' });

  const eventPayload = {
    summary: `15-Min Executive Briefing: P-22 Corp & ${agency}`,
    description: `15-Minute Executive Briefing with ${repName} (P-22 Corp Construction Material Solutions LLC).\n\nTopic: ${topic}\nAttendee: ${clientName} (${agency})\nDirect Phone: ${clientPhone}\nWork Email: ${clientEmail}\nDFW Headquarters • Nationwide Federal Infrastructure Delivery\nCAGE: 169D8 • UEI: X3HUQZ66P6N3`,
    start: {
      dateTime: startIso,
      timeZone: 'America/Chicago',
    },
    end: {
      dateTime: endIso,
      timeZone: 'America/Chicago',
    },
    location: 'Google Meet Video Conference',
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: `p22-briefing-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId,
      resource: eventPayload,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    console.log('[+] Direct Google Calendar API event inserted:', res.data.id);
    return {
      success: true,
      eventId: res.data.id,
      htmlLink: res.data.htmlLink,
      meetLink: res.data.hangoutLink || 'Google Meet Video Conference (Unique Link Generated)',
    };
  } catch (err) {
    console.warn('[-] Google Calendar API direct insert notice:', err.message);
    return {
      success: false,
      reason: err.message,
    };
  }
}

module.exports = {
  getCalendarClient,
  createGoogleCalendarEvent,
  calculateMeetingTimeRange,
};
