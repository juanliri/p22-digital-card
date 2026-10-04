import re
import os

files_map = {
    'index.html': {'name': 'Pedro', 'icon': '/assets/staff/pedro-badge-icon-192.png'},
    'pedro.html': {'name': 'Pedro', 'icon': '/assets/staff/pedro-badge-icon-192.png'},
    'eduardo.html': {'name': 'Eduardo', 'icon': '/assets/staff/eduardo-badge-icon-192.png'},
    'marleni.html': {'name': 'Marleni', 'icon': '/assets/staff/marleni-badge-icon-192.png'},
    'bids.html': {'name': 'P-22 Bids', 'icon': '/assets/staff/bids-badge-icon-192.png'},
    'logistics.html': {'name': 'Logistics', 'icon': '/assets/staff/logistics-badge-icon-192.png'},
    'badge.html': {'name': 'Pedro', 'icon': '/assets/staff/pedro-badge-icon-192.png'},
    'badge-pedro.html': {'name': 'Pedro', 'icon': '/assets/staff/pedro-badge-icon-192.png'},
    'badge-eduardo.html': {'name': 'Eduardo', 'icon': '/assets/staff/eduardo-badge-icon-192.png'},
    'badge-marleni.html': {'name': 'Marleni', 'icon': '/assets/staff/marleni-badge-icon-192.png'},
    'badge-bids.html': {'name': 'P-22 Bids', 'icon': '/assets/staff/bids-badge-icon-192.png'},
    'badge-logistics.html': {'name': 'Logistics', 'icon': '/assets/staff/logistics-badge-icon-192.png'},
    'setup.html': {'name': 'P-22 Setup', 'icon': '/favicon.png'}
}

standalone_script = """
  <!-- Standalone Native PWA App Link Handler (Prevents kicking out to browser) -->
  <script>
    if (('standalone' in window.navigator) && window.navigator.standalone) {
      document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (a && a.href && a.getAttribute('target') !== '_blank' && !a.href.startsWith('mailto:') && !a.href.startsWith('tel:') && !a.href.startsWith('sms:') && a.origin === window.location.origin) {
          e.preventDefault();
          window.location.href = a.href;
        }
      }, false);
    }
  </script>
"""

safe_area_style = """
  <style>
    /* iOS & Android Standalone Native Safe Areas */
    body {
      padding-top: max(0.5rem, env(safe-area-inset-top));
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }
  </style>
"""

for fn, meta in files_map.items():
    if not os.path.exists(fn):
        continue
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Ensure viewport-fit=cover
    content = re.sub(
        r'<meta name="viewport" content="width=device-width, initial-scale=1\.0, maximum-scale=1\.0, user-scalable=no(,\s*viewport-fit=cover)?"/?>',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">',
        content
    )

    # 2. Ensure apple-touch-icon
    if 'apple-touch-icon' not in content:
        # insert after favicon
        fav_marker = '<link rel="icon" type="image/png" sizes="192x192" href="/favicon.png">'
        if fav_marker in content:
            content = content.replace(
                fav_marker,
                f'{fav_marker}\n  <link rel="apple-touch-icon" sizes="180x180" href="{meta["icon"]}">'
            )
        else:
            # Insert before </head>
            content = content.replace('</head>', f'  <link rel="apple-touch-icon" sizes="180x180" href="{meta["icon"]}">\n</head>')

    # 3. Ensure apple-mobile-web-app meta tags
    if 'apple-mobile-web-app-capable' not in content:
        meta_block = f"""
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="{meta['name']}">
"""
        content = content.replace('</head>', f'{meta_block}\n</head>')
    else:
        # Update title if present
        content = re.sub(r'<meta name="apple-mobile-web-app-title" content="[^"]*"', f'<meta name="apple-mobile-web-app-title" content="{meta["name"]}"', content)

    # 4. Inject safe-area style if not present
    if 'safe-area-inset-top' not in content:
        content = content.replace('</head>', f'{safe_area_style}\n</head>')

    # 5. Inject standalone script if not present
    if 'window.navigator.standalone' not in content:
        content = content.replace('</head>', f'{standalone_script}\n</head>')

    with open(fn, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[OK] Enhanced standalone PWA configuration in {fn}")
