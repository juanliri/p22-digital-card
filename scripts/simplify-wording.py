import re, glob, io, sys

# (old, new) - old is matched tolerant of &amp;/& and &bull;/bullet entities
PUBLIC = [
    ('Scan Card (OCR)', 'Scan Their Card'),
    ('Reciprocal Exchange', 'Share Your Details'),
    ('Step 2 of 2', 'Final Step'),
    ('Executive Consultation', 'Book a Meeting'),
    ('Briefing Scope / Priority Topic', 'What would you like to discuss?'),
    ('1-Tap Save • Instant sync to Apple & Android address book', 'One tap to save to your contacts'),
    ('Send your agency or company credentials for immediate 24-hr follow-up and formal Capability Statement delivery.',
     "Share your company details and we'll follow up within 24 hours with our Capability Statement."),
    ('Verified SAM.gov Credential', 'SAM.gov Verified'),
    ('Point phone camera at QR code to instantly capture Executive Credentials & Government Contracting profile.',
     'Point your phone camera at the QR code to save contact details and the company profile.'),
]
SETUP = PUBLIC + [
    ('P-22 Corp Executive Portal', 'P-22 Corp Team Portal'),
    ('personalized digital passes, NFC tools, and lead vault', 'personalized digital passes, NFC tools, and saved contacts'),
    ('Executive Master Admin — Full Multi-Profile Access', 'Admin — All Team Profiles'),
    ('Scan at Booth • Direct Agency Intake', 'Scan at Booth • Collect Contacts'),
    ('📊 Telemetry & Vault', '📊 Activity & Contacts'),
    ('Apple Wallet & Apple Watch Sync', 'Apple Wallet & Apple Watch'),
    ('Offline Failsafe Lock Screen Wallpaper', 'Backup Lock Screen Wallpaper'),
    ('The 100% Offline Expo Failsafe:', 'Works With No Signal:'),
    ('Failsafe Lock Screen', 'Backup Lock Screen'),
    ('Live Telemetry & Google Sheets Analytics Hub', 'Live Activity & Google Sheets Reports'),
    ('Send Test Telemetry Beacon', 'Send Test Activity'),
    ('Expo Lead Capture Vault & Live Google Sheet Sync', 'Expo Contacts & Live Google Sheet'),
    ('Archived locally in browser & automatically synced to Google Sheets', 'Saved on this device and sent to Google Sheets automatically'),
    ('Leads_Vault Tab ↗', 'Contacts Tab ↗'),
    ('Sync All to Sheet', 'Send All to Sheet'),
    ('Scope / Notes', 'Notes'),
    ('with in-flight telemetry attribution', 'with tap tracking'),
    ('Google Sheets telemetry router to automatically identify', 'Google Sheets report to automatically identify'),
]
SCANNER = [
    ('Instant AI Contact & Badge Recognition', 'Snap a card or badge to add the contact'),
    ('Processing credentials with AI Vision & OCR.', 'This only takes a few seconds.'),
    ('Optimizing Image for OCR...', 'Preparing your photo...'),
    ('Transcribing Card with AI Vision...', 'Reading the card...'),
    ('Running On-Device Neural OCR...', 'Still reading the card...'),
    ('AI Transcribed Card', 'Scanned Card'),
    ('Physical Card & Badge Scanner', 'Card & Badge Scanner'),
    ('Extracting Contact Credentials...', 'Reading the card...'),
    ('Title / Scope / Procurement Notes', 'Title / Notes'),
    ('Confirm & Connect Contact →', 'Save Contact →'),
    ('Contact Successfully Connected!', 'Contact Saved!'),
    ('Your credentials have been securely registered with P-22 Corp.', 'Thank you. Your details have been shared with P-22 Corp.'),
    ('Expo Business Card / Badge OCR Intake', 'Expo Business Card / Badge Scan'),
    ('Physical Card / Badge OCR Scan', 'Card / Badge Scan'),
]

def pattern(old):
    p = re.escape(old)
    p = p.replace(re.escape('&'), '(?:&amp;|&)')
    p = p.replace('•', '(?:&bull;|•)').replace('→', '(?:&rarr;|→)').replace('↗', '(?:&#8599;|↗)')
    return re.compile(p)

def apply(fn, table):
    raw = open(fn, encoding='utf-8').read()
    out, n = raw, 0
    for old, new in table:
        out, c = pattern(old).subn(new.replace('\\', '\\\\').replace('&', '&amp;') if fn.endswith('.html') else new.replace('\\', '\\\\').replace('&', '&amp;'), out)
        n += c
    if out != raw:
        open(fn, 'w', encoding='utf-8', newline='').write(out)
    print(f'{fn}: {n} replacements')

for fn in ['index.html', 'pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html', 'capability-statement.html'] + glob.glob('badge*.html'):
    apply(fn, PUBLIC)
apply('setup.html', SETUP)
apply('assets/js/card-scanner.js', SCANNER)
