"""
Update directGoogleScheduleLink default href across all HTML cards
"""
import os

rep_links = {
    'pedro.html': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Executive+Briefing&add=pfelipe@p22corp.com&details=15-Minute+Executive+Capabilities+Briefing+with+Pedro+Felipe+(P-22+Corp)&location=Google+Meet',
    'index.html': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Executive+Briefing&add=pfelipe@p22corp.com&details=15-Minute+Executive+Capabilities+Briefing+with+Pedro+Felipe+(P-22+Corp)&location=Google+Meet',
    'eduardo.html': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Operations+Briefing&add=elopez@p22corp.com&details=15-Minute+Operations+and+Materials+Briefing+with+Eduardo+Lopez+(P-22+Corp)&location=Google+Meet',
    'marleni.html': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Client+Relations+Briefing&add=mmendez@p22corp.com&details=15-Minute+Client+Relations+Briefing+with+Marleni+Mendez+(P-22+Corp)&location=Google+Meet',
    'bids.html': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Estimating+and+RFQ+Briefing&add=bids@p22corp.com&details=15-Minute+Estimating+and+RFQ+Briefing+(P-22+Corp)&location=Google+Meet',
    'logistics.html': 'https://calendar.google.com/calendar/u/0/r/eventedit?text=P-22+Corp+15-Min+Logistics+and+DFW+Fleet+Briefing&add=logistics@p22corp.com&details=15-Minute+Logistics+and+DFW+Fleet+Briefing+(P-22+Corp)&location=Google+Meet',
}

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for fname, link in rep_links.items():
    fpath = os.path.join(base_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_target = '<a id="directGoogleScheduleLink" href="https://calendar.google.com/calendar"'
    new_target = f'<a id="directGoogleScheduleLink" href="{link}"'
    
    if old_target in content:
        content = content.replace(old_target, new_target, 1)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'[+] Updated direct schedule link in {fname}')
    else:
        print(f'[-] Target not found or already updated in {fname}')
