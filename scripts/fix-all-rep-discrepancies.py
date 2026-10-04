import re
import os

REPS_CONFIG = {
    'pedro': {
        'name': 'Pedro Felipe',
        'shortName': 'Pedro',
        'email': 'pfelipe@p22corp.com',
        'slug': 'pedro',
        'scheduleUrl': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Executive+Briefing&add=pfelipe@p22corp.com&details=15-Minute+Executive+Capabilities+Briefing+with+Pedro+Felipe+(P-22+Corp)&location=Google+Meet'
    },
    'eduardo': {
        'name': 'Eduardo Lopez',
        'shortName': 'Eduardo',
        'email': 'elopez@p22corp.com',
        'slug': 'eduardo',
        'scheduleUrl': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Operations+Briefing&add=elopez@p22corp.com&details=15-Minute+Operations+and+Materials+Briefing+with+Eduardo+Lopez+(P-22+Corp)&location=Google+Meet'
    },
    'marleni': {
        'name': 'Marleni Méndez',
        'shortName': 'Marleni',
        'email': 'mmendez@p22corp.com',
        'slug': 'marleni',
        'scheduleUrl': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Client+Relations+Briefing&add=mmendez@p22corp.com&details=15-Minute+Client+Relations+Briefing+with+Marleni+Mendez+(P-22+Corp)&location=Google+Meet'
    },
    'bids': {
        'name': 'Government Procurement Desk',
        'shortName': 'Procurement Desk',
        'email': 'bids@p22corp.com',
        'slug': 'bids',
        'scheduleUrl': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Estimating+and+RFQ+Briefing&add=bids@p22corp.com&details=15-Minute+Estimating+and+RFQ+Briefing+(P-22+Corp)&location=Google+Meet'
    },
    'logistics': {
        'name': 'Logistics & DFW Fleet Desk',
        'shortName': 'Logistics Desk',
        'email': 'logistics@p22corp.com',
        'slug': 'logistics',
        'scheduleUrl': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Logistics+and+DFW+Fleet+Briefing&add=logistics@p22corp.com&details=15-Minute+Logistics+and+DFW+Fleet+Briefing+(P-22+Corp)&location=Google+Meet'
    }
}

HTML_FILES = {
    'pedro.html': 'pedro',
    'index.html': 'pedro',
    'eduardo.html': 'eduardo',
    'marleni.html': 'marleni',
    'bids.html': 'bids',
    'logistics.html': 'logistics'
}

# Clean TEAM_DATA appointmentScheduleUrl in any file
def fix_team_data(content):
    # 1. Clean pedro: remove the 4 extra appointmentScheduleUrls
    pedro_extra_pattern = (
        r'(\s*"appointmentScheduleUrl":\s*"https://calendar\.google\.com/calendar/u/0/r/eventedit\?text=P-22\+Corp\+15-Min\+Logistics[^"]*",\n)'
        r'(\s*"appointmentScheduleUrl":\s*"https://calendar\.google\.com/calendar/u/0/r/eventedit\?text=P-22\+Corp\+15-Min\+Estimating[^"]*",\n)'
        r'(\s*"appointmentScheduleUrl":\s*"https://calendar\.google\.com/calendar/u/0/r/eventedit\?text=P-22\+Corp\+15-Min\+Client\+Relations[^"]*",\n)'
        r'(\s*"appointmentScheduleUrl":\s*"https://calendar\.google\.com/calendar/u/0/r/eventedit\?text=P-22\+Corp\+15-Min\+Operations[^"]*",\n)'
    )
    content = re.sub(pedro_extra_pattern, '', content)

    # 2. Ensure each rep in TEAM_DATA has their appointmentScheduleUrl
    # Eduardo: add if not present
    if '"calendly": "https://calendly.com/p22corp/capabilities-briefing",\n    "photoB64"' in content:
        # In eduardo
        eduardo_target = '"slug": "eduardo",'
        if eduardo_target in content:
            # Let's insert appointmentScheduleUrl for eduardo if missing
            edu_cal_marker = '"calendly": "https://calendly.com/p22corp/capabilities-briefing",'
            edu_cal_replace = (
                '"calendly": "https://calendly.com/p22corp/capabilities-briefing",\n'
                f'    "appointmentScheduleUrl": "{REPS_CONFIG["eduardo"]["scheduleUrl"]}",'
            )
            # Find eduardo block
            parts = content.split('"eduardo": {')
            if len(parts) > 1:
                edu_block = parts[1].split('photoB64')[0]
                if 'appointmentScheduleUrl' not in edu_block:
                    parts[1] = parts[1].replace(edu_cal_marker, edu_cal_replace, 1)
                    content = '"eduardo": {'.join(parts)

    # Marleni
    parts = content.split('"marleni": {')
    if len(parts) > 1:
        marleni_block = parts[1].split('photoB64')[0]
        if 'appointmentScheduleUrl' not in marleni_block:
            marleni_cal_marker = '"calendly": "https://calendly.com/p22corp/capabilities-briefing",'
            marleni_cal_replace = (
                '"calendly": "https://calendly.com/p22corp/capabilities-briefing",\n'
                f'    "appointmentScheduleUrl": "{REPS_CONFIG["marleni"]["scheduleUrl"]}",'
            )
            parts[1] = parts[1].replace(marleni_cal_marker, marleni_cal_replace, 1)
            content = '"marleni": {'.join(parts)

    # Bids
    parts = content.split('"bids": {')
    if len(parts) > 1:
        bids_block = parts[1].split('photoB64')[0]
        if 'appointmentScheduleUrl' not in bids_block:
            bids_cal_marker = '"calendly": "https://calendly.com/p22corp/capabilities-briefing",'
            bids_cal_replace = (
                '"calendly": "https://calendly.com/p22corp/capabilities-briefing",\n'
                f'    "appointmentScheduleUrl": "{REPS_CONFIG["bids"]["scheduleUrl"]}",'
            )
            parts[1] = parts[1].replace(bids_cal_marker, bids_cal_replace, 1)
            content = '"bids": {'.join(parts)

    # Logistics
    parts = content.split('"logistics": {')
    if len(parts) > 1:
        log_block = parts[1].split('photoB64')[0]
        if 'appointmentScheduleUrl' not in log_block:
            log_cal_marker = '"calendly": "https://calendly.com/p22corp/capabilities-briefing",'
            log_cal_replace = (
                '"calendly": "https://calendly.com/p22corp/capabilities-briefing",\n'
                f'    "appointmentScheduleUrl": "{REPS_CONFIG["logistics"]["scheduleUrl"]}",'
            )
            parts[1] = parts[1].replace(log_cal_marker, log_cal_replace, 1)
            content = '"logistics": {'.join(parts)

    return content

for fname, slug in HTML_FILES.items():
    if not os.path.exists(fname):
        continue

    rep = REPS_CONFIG[slug]
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix #emailAction href
    content = re.sub(
        r'<a id="emailAction" href="mailto:[^"]*"',
        f'<a id="emailAction" href="mailto:{rep["email"]}?subject=Procurement%20Inquiry%20-%20P-22%20Corp"',
        content
    )

    # 2. Fix #briefingModalRepName
    content = re.sub(
        r'<span id="briefingModalRepName"[^>]*>.*?</span>',
        f'<span id="briefingModalRepName" class="font-bold text-sm text-white">{rep["name"]}</span>',
        content
    )

    # 3. Fix #successRepName
    content = re.sub(
        r'<span id="successRepName"[^>]*>.*?</span>',
        f'<span id="successRepName" class="text-white font-semibold">{rep["name"]}</span>',
        content
    )

    # 4. Fix #qrModalName
    content = re.sub(
        r'<p id="qrModalName"[^>]*>.*?</p>',
        f'<p id="qrModalName" class="text-xs text-p22gold font-semibold mb-3">{rep["name"]} &bull; P-22 Corp</p>',
        content
    )

    # 5. Fix #qrModalUrl
    content = re.sub(
        r'<p class="text-\[11px\] text-slate-300 font-mono break-all mb-4 px-2" id="qrModalUrl">.*?</p>',
        f'<p class="text-[11px] text-slate-300 font-mono break-all mb-4 px-2" id="qrModalUrl">https://card.p22corp.com/{rep["slug"]}</p>',
        content
    )

    # 6. Fix #briefingBtnText in static HTML
    content = re.sub(
        r'<span id="briefingBtnText"[^>]*>.*?</span>',
        f'<span id="briefingBtnText" class="text-white group-hover:text-p22gold transition-colors">Book 15-Min Briefing with {rep["shortName"]}</span>',
        content
    )

    # 7. Fix TEAM_DATA redundancies
    content = fix_team_data(content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {fname} for {rep['name']}")
