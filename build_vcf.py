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
        'title': 'Managing Director & Power Systems Lead',
        'tel': '1-888-722-2675',
        'directPhone': '1-945-218-5896',
        'email': 'pfelipe@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/pedro',
        'photo_path': 'assets/staff/pedro-official-1x1.png',
        'avatar': 'assets/staff/pedro-official-1x1.png',
        'bio': '15+ years in Power Systems Engineering & MV Switchgear. Specializing in IEEE/ANSI utility infrastructure, federal procurement, and rapid logistics mobilization.',
        'location': 'Dallas-Fort Worth HQ • Nationwide Response',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nManaging Director - P-22 Corp\\n15+ Years Power Systems & MV Switchgear Engineering\\nDirect: 1-945-218-5896 | Toll-Free: 1-888-722-2675',
    },
    {
        'slug': 'eduardo',
        'filename': 'eduardo.vcf',
        'first': 'Eduardo',
        'last': 'Lopez',
        'fn': 'Eduardo Lopez',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Electrical Sales Manager & OEM Logistics SME',
        'tel': '1-888-722-2675',
        'directPhone': '1-945-218-5896',
        'email': 'sales@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/eduardo',
        'photo_path': 'assets/staff/eduardo-official-1x1.png',
        'avatar': 'assets/staff/eduardo-official-1x1.png',
        'bio': '36 years managing heavy equipment logistics and OEM dealer networks (Case Corp). Primary SME for technical sourcing and government fleet lifecycles.',
        'location': 'Dallas Sales Office • DFW Logistics Hub',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nElectrical Sales Manager - P-22 Corp\\n36 Years Heavy Equipment & OEM Logistics (Case Corp SME)\\nDirect: 1-945-218-5896 | Toll-Free: 1-888-722-2675',
    },
    {
        'slug': 'marleni',
        'filename': 'marleni.vcf',
        'first': 'Marleni',
        'last': 'Mendez',
        'fn': 'Marleni Mendez',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Finance Officer & DCAA Compliance Lead',
        'tel': '1-888-722-2675',
        'directPhone': '1-945-218-5896',
        'email': 'accounting@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/marleni',
        'photo_path': 'assets/staff/marleni-official-1x1.png',
        'avatar': 'assets/staff/marleni-official-1x1.png',
        'bio': 'Former Senior Auditor for Grant Thornton. Oversees DCAA-compliant record keeping, GAAP fiscal transparency, and WAWF federal contract invoicing.',
        'location': 'Dallas Corporate Office • DFW Hub',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nFinance Officer - P-22 Corp\\nFormer Senior Auditor (Grant Thornton) | DCAA & WAWF Invoicing\\nDirect: 1-945-218-5896 | Toll-Free: 1-888-722-2675',
    },
    {
        'slug': 'bids',
        'filename': 'bids.vcf',
        'first': 'Procurement Desk',
        'last': 'Government',
        'fn': 'Government Procurement Desk',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': '24-Hour Rapid RFQ & Solicitation Response Unit',
        'tel': '1-888-722-2675',
        'directPhone': '1-888-722-2675',
        'email': 'bids@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/bids',
        'photo_path': 'assets/staff/bids-official-1x1.png',
        'avatar': 'assets/staff/bids-official-1x1.png',
        'bio': 'Direct access to specialized government contracting support. Fast-turnaround bids for USACE, TxDOT, VA, and municipal agencies. FAR/DFARS & TAA compliant.',
        'location': 'Dallas Logistics Hub • 24/7 Rapid Response Desk',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\n24-Hour Government Procurement Desk - P-22 Corp\\nSBA Certified Small Minority-Owned Business\\n24-Hr Solicitation Response: bids@p22corp.com',
    },
    {
        'slug': 'logistics',
        'filename': 'logistics.vcf',
        'first': 'Logistics Hub',
        'last': 'Dallas',
        'fn': 'Dallas Logistics Hub',
        'org': 'P-22 Corp Construction Material Solutions LLC',
        'title': 'Centralized Fleet Dispatch & Material Staging',
        'tel': '1-888-722-2675',
        'directPhone': '1-888-722-2675',
        'email': 'logistics@p22corp.com',
        'url': 'https://p22-digital-card.vercel.app/logistics',
        'photo_path': 'assets/staff/logistics-official-1x1.png',
        'avatar': 'assets/staff/logistics-official-1x1.png',
        'bio': 'Centralized Dallas-Fort Worth logistics staging facility providing expedited shipping, emergency freight, and multi-site infrastructure fulfillment nationwide.',
        'location': 'Dallas Logistics Hub • DFW Staging Facility',
        'note': 'CAGE: 169D8 | UEI: X3HUQZ66P6N3\\nDallas Logistics Hub - P-22 Corp\\n18383 Preston Rd, Ste 202, Dallas, TX 75252\\nExpedited Shipping & Emergency Freight Nationwide',
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
    vcf_content = '\r\n'.join(folded_lines) + '\r\n'
    
    # 1. Write individual RFC 2426 .vcf file to assets/vcf/
    vcf_filepath = os.path.join('assets', 'vcf', s['filename'])
    with open(vcf_filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(vcf_content)
    print(f"Generated valid RFC 2426 vcf: {vcf_filepath}")
    
    # 2. Update team.json
    slug = s['slug']
    if slug not in team_data:
        team_data[slug] = {}
        
    team_data[slug].update({
        'slug': slug,
        'name': s['fn'],
        'title': s['title'],
        'company': s['org'],
        'email': s['email'],
        'phone': s['tel'],
        'directPhone': s.get('directPhone', s['tel']),
        'avatar': s['avatar'],
        'badge': 'SAM.gov Active Certified Rep',
        'bio': s['bio'],
        'location': s['location'],
        'calendly': 'https://calendly.com/p22corp/capabilities-briefing',
        'photoB64': photo_b64,
        'vcf': vcf_content,
        'canopyPoster': 'assets/facility/construction-crane.webp',
        'specBadge': 'SPEC: DIV 26 • STRUCTURAL TAKEOFF',
        'complianceBadge': 'TAA / FAR COMPLIANT',
        'verificationBadge': 'SAM.gov Active Certified Rep'
    })

# Also write root pedro-felipe.vcf
with open('pedro-felipe.vcf', 'w', encoding='utf-8', newline='') as f:
    f.write(team_data['pedro']['vcf'])

with open('team.json', 'w', encoding='utf-8') as f:
    json.dump(team_data, f, indent=2, ensure_ascii=False)

print("team.json updated successfully with official site terms & photos!")
