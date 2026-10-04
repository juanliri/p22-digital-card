"""
Generates dedicated PWA manifests for each card profile to ensure 'Add to Home Screen'
saves the exact profile with full name, correct avatar icon, and direct start_url.
"""
import os, json

REPS = {
    'pedro': {
        'name': 'Pedro Felipe | P-22 Corp Digital Card',
        'short_name': 'Pedro Felipe',
        'description': 'Managing Director & Federal Contract Lead - P-22 Corp Construction Material Solutions LLC. CAGE: 169D8 | UEI: X3HUQZ66P6N3',
        'start_url': '/pedro',
        'icon_prefix': 'pedro'
    },
    'eduardo': {
        'name': 'Eduardo Lopez | P-22 Corp Digital Card',
        'short_name': 'Eduardo Lopez',
        'description': 'Director of Commercial Sales & Material Supply - P-22 Corp Construction Material Solutions LLC. CAGE: 169D8 | UEI: X3HUQZ66P6N3',
        'start_url': '/eduardo',
        'icon_prefix': 'eduardo'
    },
    'marleni': {
        'name': 'Marleni Mendez | P-22 Corp Digital Card',
        'short_name': 'Marleni Mendez',
        'description': 'Director of Finance & Contract Compliance - P-22 Corp Construction Material Solutions LLC. CAGE: 169D8 | UEI: X3HUQZ66P6N3',
        'start_url': '/marleni',
        'icon_prefix': 'marleni'
    },
    'bids': {
        'name': 'Bids Desk | P-22 Corp Digital Card',
        'short_name': 'Bids Desk',
        'description': 'Federal Procurement & Rapid RFQ Desk - P-22 Corp Construction Material Solutions LLC. CAGE: 169D8 | UEI: X3HUQZ66P6N3',
        'start_url': '/bids',
        'icon_prefix': 'bids'
    },
    'logistics': {
        'name': 'Logistics Desk | P-22 Corp Digital Card',
        'short_name': 'Logistics Desk',
        'description': 'Central Material Staging & Fleet Logistics - P-22 Corp Construction Material Solutions LLC. CAGE: 169D8 | UEI: X3HUQZ66P6N3',
        'start_url': '/logistics',
        'icon_prefix': 'logistics'
    }
}

for slug, data in REPS.items():
    manifest = {
        "name": data["name"],
        "short_name": data["short_name"],
        "description": data["description"],
        "start_url": data["start_url"],
        "scope": "/",
        "display": "standalone",
        "display_override": ["standalone", "fullscreen"],
        "background_color": "#060B14",
        "theme_color": "#060B14",
        "orientation": "portrait-primary",
        "icons": [
            {
                "src": f"/assets/staff/{data['icon_prefix']}-badge-icon-192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any maskable"
            },
            {
                "src": f"/assets/staff/{data['icon_prefix']}-badge-icon-512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
            }
        ]
    }
    manifest_fn = f"manifest-{slug}.json"
    with open(manifest_fn, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"[+] Wrote {manifest_fn}")

    # Update corresponding HTML file
    html_fn = f"{slug}.html"
    if os.path.exists(html_fn):
        with open(html_fn, "r", encoding="utf-8") as f:
            content = f.read()

        # Update manifest link
        content = content.replace('<link rel="manifest" href="/manifest.json">', f'<link rel="manifest" href="/manifest-{slug}.json">')
        
        # Update apple-mobile-web-app-title
        import re
        content = re.sub(
            r'<meta name="apple-mobile-web-app-title" content="[^"]*">',
            f'<meta name="apple-mobile-web-app-title" content="{data["short_name"]}">',
            content
        )

        with open(html_fn, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[+] Updated manifest link and app title in {html_fn}")
