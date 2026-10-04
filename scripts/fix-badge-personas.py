import glob
import re

badges = {
    'badge-eduardo.html': ('Eduardo López', '/eduardo', 'elopez@p22corp.com', '1-407-369-9001'),
    'badge-marleni.html': ('Marleni Méndez', '/marleni', 'mmendez@p22corp.com', '1-888-722-2675'),
    'badge-pedro.html': ('Pedro Felipe', '/pedro', 'pfelipe@p22corp.com', '1-888-722-2675'),
    'badge-bids.html': ('Federal Procurement Desk', '/bids', 'bids@p22corp.com', '1-888-722-2675'),
    'badge-logistics.html': ('Dallas Logistics Hub', '/logistics', 'logistics@p22corp.com', '1-888-722-2675'),
}

for fname, (rep_name, public_url, email, phone) in badges.items():
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Fix modalRepName
    c = re.sub(
        r'<h3 id="modalRepName"[^>]*>.*?</h3>',
        f'<h3 id="modalRepName" class="text-base font-montserrat font-bold text-white mb-4 text-center">{rep_name}</h3>',
        c
    )

    # 2. Fix modalPublicCardLink
    c = re.sub(
        r'<a id="modalPublicCardLink" href="[^"]*"',
        f'<a id="modalPublicCardLink" href="{public_url}"',
        c
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)

    print(f"Fixed {fname} -> modalRepName: {rep_name}, publicLink: {public_url}")
