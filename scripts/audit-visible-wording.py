import re, glob, collections, sys

TERMS = ['OCR', 'AI ', 'A.I.', 'Neural', 'Telemetry', 'Leads_Vault', 'Failsafe', 'Fail-safe', 'Payload', 'Webhook',
         'Dual-Stack', 'Handshake', 'Reciprocal', 'Quick-Capture', 'Ingest', 'Vault', 'Lockscreen', 'Provision',
         'Credential', 'Transcrib', 'Extract', 'Vision', 'Sync', 'Endpoint', 'Pipeline', 'Cache', 'Offline queue',
         'Tesseract', 'Gemini', 'CRM', 'Intake', 'Heuristic', 'Parser', 'Step 2 of 2', 'Executive', 'Titanium',
         'Telemetry', 'Verified Credentials', 'Scope']

def visible(html):
    html = re.sub(r'<(script|style)\b.*?</\1>', ' ', html, flags=re.S | re.I)
    # keep placeholder / title / aria text
    extra = re.findall(r'(?:placeholder|title|aria-label|alt)="([^"]+)"', html)
    txt = re.sub(r'<[^>]+>', '\n', html)
    txt = re.sub(r'&amp;', '&', txt)
    return [l.strip() for l in txt.split('\n') if l.strip()] + extra

files = ['index.html', 'pedro.html', 'badge-pedro.html', 'setup.html', 'capability-statement.html']
hits = collections.OrderedDict()
for fn in files:
    for line in visible(open(fn, encoding='utf-8').read()):
        if len(line) > 220:
            continue
        for t in TERMS:
            if t.lower() in line.lower():
                hits.setdefault(line, set()).add(fn)
                break
for line, fs in hits.items():
    print(f"[{','.join(sorted(f.split('.')[0] for f in fs))}] {line}")
print('\nTOTAL unique lines:', len(hits))
