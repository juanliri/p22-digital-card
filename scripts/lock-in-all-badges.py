import re

staff_badges = {
    'badge-eduardo.html': {
        'name': 'Eduardo Lopez',
        'title': 'Director of Commercial Sales & Material Supply',
        'email': 'elopez@p22corp.com',
        'phone': '1-407-369-9001',
        'phone_display': '(407) 369-9001',
        'tel': '14073699001',
        'photo': '/assets/staff/eduardo-official-1x1.png',
        'public': '/eduardo',
        'rep_key': 'eduardo'
    },
    'badge-marleni.html': {
        'name': 'Marleni Mendez',
        'title': 'Senior Procurement & Logistics Specialist',
        'email': 'mmendez@p22corp.com',
        'phone': '1-888-722-2675',
        'phone_display': '1-888-722-2675',
        'tel': '18887222675',
        'photo': '/assets/staff/marleni-official-1x1.png',
        'public': '/marleni',
        'rep_key': 'marleni'
    },
    'badge-pedro.html': {
        'name': 'Pedro Felipe',
        'title': 'Managing Director & Federal Contract Lead',
        'email': 'pfelipe@p22corp.com',
        'phone': '1-888-722-2675',
        'phone_display': '1-888-722-2675',
        'tel': '18887222675',
        'photo': '/assets/staff/pedro-official-1x1.png',
        'public': '/pedro',
        'rep_key': 'pedro'
    },
    'badge-bids.html': {
        'name': 'Federal Procurement Desk',
        'title': 'Bids, Solicitations & Prime Contracting',
        'email': 'bids@p22corp.com',
        'phone': '1-888-722-2675',
        'phone_display': '1-888-722-2675',
        'tel': '18887222675',
        'photo': '/assets/staff/bids-official-1x1.png',
        'public': '/bids',
        'rep_key': 'bids'
    },
    'badge-logistics.html': {
        'name': 'Dallas Logistics Hub',
        'title': 'Regional Warehouse & Freight Dispatch',
        'email': 'logistics@p22corp.com',
        'phone': '1-888-722-2675',
        'phone_display': '1-888-722-2675',
        'tel': '18887222675',
        'photo': '/assets/staff/logistics-official-1x1.png',
        'public': '/logistics',
        'rep_key': 'logistics'
    }
}

for fname, d in staff_badges.items():
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()

    # staffName
    c = re.sub(
        r'<h1 id="staffName"[^>]*>.*?</h1>',
        f'<h1 id="staffName" class="text-2xl sm:text-3xl font-montserrat font-extrabold tracking-tight text-white leading-tight">{d["name"]}</h1>',
        c
    )

    # staffTitle
    c = re.sub(
        r'<p id="staffTitle"[^>]*>.*?</p>',
        f'<p id="staffTitle" class="text-xs sm:text-sm text-p22gold font-bold uppercase tracking-wider mt-1 px-2">{d["title"]}</p>',
        c
    )

    # staffEmail
    c = re.sub(
        r'<span id="staffEmail">.*?</span>',
        f'<span id="staffEmail">{d["email"]}</span>',
        c
    )

    # staffPhone
    c = re.sub(
        r'<span id="staffPhone">.*?</span>',
        f'<span id="staffPhone">{d["phone_display"]}</span>',
        c
    )

    # phoneLink
    c = re.sub(
        r'<a id="phoneLink"\s+href="[^"]*"',
        f'<a id="phoneLink" href="tel:{d["tel"]}"',
        c
    )

    # staffPhoto
    c = re.sub(
        r'id="staffPhoto"\s+src="[^"]*"',
        f'id="staffPhoto" src="{d["photo"]}"',
        c
    )

    # publicCardLink
    c = re.sub(
        r'href="/pedro"',
        f'href="{d["public"]}"',
        c
    )

    # active rep in script
    c = re.sub(
        r"var rep = '[a-z0-9_-]+';",
        f"var rep = '{d['rep_key']}';",
        c
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)

    print(f"Completely locked in {fname} for {d['name']}")
