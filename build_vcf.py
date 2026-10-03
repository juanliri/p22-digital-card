import os, io, base64, json, datetime
from PIL import Image

def optimize_photo(src_path, size=(320, 320), quality=82):
    img = Image.open(src_path)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        bg = Image.new('RGB', img.size, (13, 24, 41))
        bg.paste(img, mask=img.convert('RGBA').split()[3])
        img = bg
    else:
        img = img.convert('RGB')
    
    # Center square crop
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    img = img.crop((left, top, left + min_dim, top + min_dim))
    img = img.resize(size, Image.Resampling.LANCZOS)
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=quality, optimize=True)
    raw_bytes = buf.getvalue()
    b64 = base64.b64encode(raw_bytes).decode('ascii')
    print(f"Optimized {src_path}: {len(raw_bytes)} bytes JPEG (base64: {len(b64)})")
    return b64

def fold_vcard_line(line, max_len=75):
    """
    RFC 2426 Section 2.6: Line folding
    Long lines are folded by inserting CRLF followed by a single whitespace character.
    """
    if len(line) <= max_len:
        return line
    parts = [line[:max_len]]
    remainder = line[max_len:]
    while remainder:
        chunk = remainder[:max_len - 1]
        parts.append(' ' + chunk)
        remainder = remainder[max_len - 1:]
    return '\r\n'.join(parts)

staff_definitions = [
    {
        'slug': 'pedro',
        'filename': 'pedro.vcf',
        'first': 'Pedro',
        'last': 'Felipe',
        'fn': 'Pedro Felipe',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Managing Director & Government Procurement Lead',
        'tel': '1-888-722-2675',
        'email': 'pfelipe@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/pedro',
        'photo_path': 'assets/staff/pedro-felipe.png',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nManaging Director - P-22 Corp\\nSBA Certified Small Minority-Owned Business\\nDirect Executive Line & Dallas Hub',
    },
    {
        'slug': 'eduardo',
        'filename': 'eduardo.vcf',
        'first': 'Eduardo',
        'last': 'Lopez',
        'fn': 'Eduardo Lopez',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Director of Government Sales',
        'tel': '1-888-722-2675',
        'email': 'elopez@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/eduardo',
        'photo_path': 'assets/staff/eduardo-lopez.jpg',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nDirector of Government Sales - P-22 Corp\\nSBA Certified Small Minority-Owned Business\\nDallas Sales Office - Federal Quotes & Procurement',
    },
    {
        'slug': 'marleni',
        'filename': 'marleni.vcf',
        'first': 'Marleni',
        'last': 'Mendez',
        'fn': 'Marleni Mendez',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Controller & Compliance Lead (WAWF / Invoicing)',
        'tel': '1-888-722-2675',
        'email': 'mmendez@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/marleni',
        'photo_path': 'assets/staff/marleni-mendez.jpg',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nController - P-22 Corp\\nSBA Certified Small Minority-Owned Business\\nWAWF, PIEE, DoD Invoicing & Federal Accounting Desk',
    },
    {
        'slug': 'bids',
        'filename': 'bids.vcf',
        'first': 'Procurement Desk',
        'last': 'Government',
        'fn': 'Government Procurement Desk',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': '24-Hour Rapid RFQ & Solicitation Response Desk',
        'tel': '1-888-722-2675',
        'email': 'bids@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/bids',
        'photo_path': 'assets/branding/logo-navy-flat.png',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\n24-Hour Bids Desk - P-22 Corp\\nSBA Certified Small Minority-Owned Business\\nSimplified Acquisitions, BPAs & Fast-Track Solicitations',
    },
    {
        'slug': 'logistics',
        'filename': 'logistics.vcf',
        'first': 'Logistics & Dispatch',
        'last': 'Dallas',
        'fn': 'Dallas Logistics & Dispatch',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Dallas Logistics Hub - Material Staging & Delivery',
        'tel': '1-888-722-2675',
        'email': 'logistics@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/logistics',
        'photo_path': 'assets/facility/loading-dock.webp',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nDallas Logistics Hub - P-22 Corp\\nSBA Certified Small Minority-Owned Business\\nOvernight Mobilization & Expedited Freight Delivery',
    },
]

os.makedirs('assets/vcf', exist_ok=True)

team_data = {}
if os.path.exists('team.json'):
    try:
        with open('team.json', 'r', encoding='utf-8') as f:
            team_data = json.load(f)
    except Exception as e:
        print('Error loading existing team.json:', e)

now_iso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

for s in staff_definitions:
    photo_b64 = optimize_photo(s['photo_path'])
    
    # vCard 3.0 Standard strictly compliant with RFC 2426
    raw_lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        f"N:{s['last']};{s['first']};;;",
        f"FN:{s['fn']}",
        f"ORG:{s['org']}",
        f"TITLE:{s['title']}",
        f"TEL;TYPE=WORK,VOICE:{s['tel']}",
        f"EMAIL;TYPE=PREF,INTERNET:{s['email']}",
        f"URL:{s['url']}",
        'ADR;TYPE=WORK:;;18383 Preston Rd, Suite 202;Dallas;TX;75252;USA',
        f"NOTE:{s['note']}",
        f"CATEGORIES:Government Contractor,P-22 Corp,Procurement",
        f"REV:{now_iso}",
        f"PHOTO;TYPE=JPEG;ENCODING=b:{photo_b64}",
        'END:VCARD'
    ]
    
    # Apply RFC 2426 line folding (75 char max per line)
    folded_lines = [fold_vcard_line(line) for line in raw_lines]
    vcard_str = '\r\n'.join(folded_lines) + '\r\n'
    
    out_path = os.path.join('assets', 'vcf', s['filename'])
    with open(out_path, 'w', encoding='utf-8', newline='') as f:
        f.write(vcard_str)
    print(f"Generated {out_path} ({len(vcard_str.encode('utf-8'))} bytes)")
    
    # Also write root pedro-felipe.vcf for legacy backwards compatibility
    if s['slug'] == 'pedro':
        with open('pedro-felipe.vcf', 'w', encoding='utf-8', newline='') as f:
            f.write(vcard_str)
        print("Updated root pedro-felipe.vcf")
        
    # Update team.json
    slug = s['slug']
    if slug not in team_data:
        team_data[slug] = {}
    team_data[slug]['slug'] = slug
    team_data[slug]['name'] = s['fn']
    team_data[slug]['title'] = s['title']
    team_data[slug]['company'] = s['org']
    team_data[slug]['email'] = s['email']
    team_data[slug]['phone'] = s['tel']
    team_data[slug]['directPhone'] = s['tel']
    team_data[slug]['avatar'] = s['photo_path']
    team_data[slug]['photoB64'] = photo_b64
    team_data[slug]['vcf'] = vcard_str.strip()

with open('team.json', 'w', encoding='utf-8') as f:
    json.dump(team_data, f, indent=2)

print("\nSUCCESS: All staff VCF files built with RFC 2426 compliance and team.json updated!")
