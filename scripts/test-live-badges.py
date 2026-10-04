import urllib.request
import re

domain = 'https://card.p22corp.com'

urls = [
    ('Pedro Badge', f'{domain}/badge/pedro'),
    ('Eduardo Badge', f'{domain}/badge/eduardo'),
    ('Marleni Badge', f'{domain}/badge/marleni'),
    ('Bids Badge', f'{domain}/badge/bids'),
    ('Logistics Badge', f'{domain}/badge/logistics'),
]

for label, u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
            title = re.search(r'apple-mobile-web-app-title"\s+content="([^"]+)"', html)
            icon = re.search(r'apple-touch-icon"\s+href="([^"]+)"', html)
            print(f"{label}:")
            print(f"  App Title: {title.group(1) if title else 'NOT FOUND'}")
            print(f"  Icon: {icon.group(1) if icon else 'NOT FOUND'}")
    except Exception as e:
        print(f"{label}: ERROR -> {e}")
