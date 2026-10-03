import os, io, base64, json, datetime
from PIL import Image

def optimize_photo(src_path, size=(400, 400), quality=88):
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
    return b64

def fold_vcard_line(line, max_len=75):
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
        'title': 'Managing Director & Federal Contract Lead',
        'tel': '1-888-722-2675',
        'directPhone': '1-945-218-5896',
        'email': 'pfelipe@p22corp.com',
        'secondaryEmail': 'bids@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/pedro',
        'photo_path': 'assets/staff/pedro-official-1x1.png',
        'avatar': 'assets/staff/pedro-official-1x1.png',
        'bio': 'Executive lead for federal procurement, prime contractor partnerships, and commercial supply agreements. Oversees end-to-end contracting packages, rapid RFQ turnarounds, and nationwide infrastructure fulfillment.',
        'location': 'Dallas-Fort Worth HQ • Nationwide Response',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nManaging Director & Federal Contract Lead - P-22 Corp\\nDirect: 1-945-218-5896 | Toll-Free: 1-888-722-2675',
    },
    {
        'slug': 'eduardo',
        'filename': 'eduardo.vcf',
        'first': 'Eduardo',
        'last': 'Lopez',
        'fn': 'Eduardo Lopez',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Director of Commercial Sales & Material Supply',
        'tel': '1-888-722-2675',
        'directPhone': '1-945-218-5896',
        'email': 'elopez@p22corp.com',
        'secondaryEmail': 'sales@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/eduardo',
        'photo_path': 'assets/staff/eduardo-official-1x1.png',
        'avatar': 'assets/staff/eduardo-official-1x1.png',
        'bio': 'Directs commercial supply sales, manufacturer allocation, and prime vendor networks. Focuses on competitive project pricing, guaranteed delivery schedules, and dedicated account support.',
        'location': 'Dallas Sales Office • DFW Logistics Hub',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nDirector of Commercial Sales - P-22 Corp\\nDirect: 1-945-218-5896 | Toll-Free: 1-888-722-2675',
    },
    {
        'slug': 'marleni',
        'filename': 'marleni.vcf',
        'first': 'Marleni',
        'last': 'Mendez',
        'fn': 'Marleni Mendez',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Director of Finance & Contract Compliance',
        'tel': '1-888-722-2675',
        'directPhone': '1-945-218-5896',
        'email': 'mmendez@p22corp.com',
        'secondaryEmail': 'accounting@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/marleni',
        'photo_path': 'assets/staff/marleni-official-1x1.png',
        'avatar': 'assets/staff/marleni-official-1x1.png',
        'bio': 'Oversees corporate financial operations, federal billing compliance, and prime contract accounting. Ensures rapid vendor onboarding, transparent invoicing, and prompt contract closeouts.',
        'location': 'Dallas Corporate Office • DFW Hub',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nDirector of Finance & Compliance - P-22 Corp\\nDirect: 1-945-218-5896 | Toll-Free: 1-888-722-2675',
    },
    {
        'slug': 'bids',
        'filename': 'bids.vcf',
        'first': 'Procurement Desk',
        'last': 'Government',
        'fn': 'Government Procurement Desk',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Federal Procurement & Rapid RFQ Desk',
        'tel': '1-888-722-2675',
        'directPhone': '1-888-722-2675',
        'email': 'bids@p22corp.com',
        'secondaryEmail': None,
        'url': 'https://p22-digital-card.vercel.app/bids',
        'photo_path': 'assets/staff/bids-official-1x1.png',
        'avatar': 'assets/staff/bids-official-1x1.png',
        'bio': 'Centralized bidding desk delivering 24-hour takeoff reviews, competitive pricing, and certified procurement packages for federal primes and government buyers nationwide.',
        'location': 'Dallas Logistics Hub • 24/7 Rapid Response Desk',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nFederal Procurement Desk - P-22 Corp\\n24-Hr Solicitation Response: bids@p22corp.com',
    },
    {
        'slug': 'logistics',
        'filename': 'logistics.vcf',
        'first': 'Logistics Hub',
        'last': 'Dallas',
        'fn': 'Dallas Logistics Hub',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Central Material Staging & Fleet Logistics',
        'tel': '1-888-722-2675',
        'directPhone': '1-888-722-2675',
        'email': 'logistics@p22corp.com',
        'secondaryEmail': None,
        'url': 'https://p22-digital-card.vercel.app/logistics',
        'photo_path': 'assets/staff/logistics-official-1x1.png',
        'avatar': 'assets/staff/logistics-official-1x1.png',
        'bio': 'Strategic Dallas-Fort Worth staging and warehousing facility providing expedited freight, secure material holding, and guaranteed on-time site delivery nationwide.',
        'location': 'Dallas Logistics Hub • DFW Staging Facility',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nDallas Logistics Hub - P-22 Corp\\n18383 Preston Rd, Ste 202, Dallas, TX 75252',
    },
]

os.makedirs('assets/vcf', exist_ok=True)

team_data = {}
if os.path.exists('team.json'):
    with open('team.json', 'r', encoding='utf-8') as f:
        team_data = json.load(f)

now_iso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

for s in staff_definitions:
    photo_b64 = optimize_photo(s['photo_path'])
    
    raw_lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        f"N:{s['last']};{s['first']};;;",
        f"FN:{s['fn']}",
        f"ORG:{s['org']}",
        f"TITLE:{s['title']}",
        f"TEL;TYPE=WORK,VOICE:{s['tel']}",
    ]
    if s.get('directPhone') and s['directPhone'] != s['tel']:
        raw_lines.append(f"TEL;TYPE=CELL,VOICE:{s['directPhone']}")
    
    # Primary Direct Executive Email
    raw_lines.append(f"EMAIL;TYPE=PREF,INTERNET:{s['email']}")
    
    # Secondary Department Email if applicable
    if s.get('secondaryEmail'):
        raw_lines.append(f"EMAIL;TYPE=WORK,INTERNET:{s['secondaryEmail']}")
        
    raw_lines.extend([
        f"URL:{s['url']}",
        'ADR;TYPE=WORK:;;18383 Preston Rd, Suite 202;Dallas;TX;75252;USA',
        f"NOTE:{s['note']}",
        f"CATEGORIES:Government Contractor,P-22 Corp,Procurement",
        f"REV:{now_iso}",
        f"PHOTO;TYPE=JPEG;ENCODING=b:{photo_b64}",
        'END:VCARD'
    ])
    
    folded_lines = [fold_vcard_line(line) for line in raw_lines]
    vcf_content = '\r\n'.join(folded_lines) + '\r\n'
    
    vcf_filepath = os.path.join('assets', 'vcf', s['filename'])
    with open(vcf_filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(vcf_content)
    print(f"Generated RFC 2426 vcf with direct + secondary email: {vcf_filepath}")
    
    slug = s['slug']
    if slug not in team_data:
        team_data[slug] = {}
        
    team_data[slug].update({
        'slug': slug,
        'name': s['fn'],
        'title': s['title'],
        'company': s['org'],
        'email': s['email'],
        'secondaryEmail': s.get('secondaryEmail'),
        'phone': s['tel'],
        'directPhone': s['directPhone'],
        'avatar': s['avatar'],
        'bio': s['bio'],
        'location': s['location'],
        'photoB64': photo_b64,
        'vcf': vcf_content
    })

with open('team.json', 'w', encoding='utf-8') as f:
    json.dump(team_data, f, indent=2)

print("team.json updated with direct & department emails")
