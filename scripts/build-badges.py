import re
import os

with open('badge.html', 'r', encoding='utf-8') as f:
    content = f.read()

reps = {
    'pedro': {'name': 'Pedro Felipe', 'short': 'Pedro', 'icon': 'pedro-badge-icon-192.png'},
    'eduardo': {'name': 'Eduardo López', 'short': 'Eduardo', 'icon': 'eduardo-badge-icon-192.png'},
    'marleni': {'name': 'Marleni Méndez', 'short': 'Marleni', 'icon': 'marleni-badge-icon-192.png'},
    'bids': {'name': 'Procurement Desk', 'short': 'Bids Desk', 'icon': 'bids-badge-icon-192.png'},
    'logistics': {'name': 'Dallas Logistics Hub', 'short': 'Logistics', 'icon': 'logistics-badge-icon-192.png'}
}

# 1. Fix synchronous iOS navigation in badge.html (remove setTimeout that breaks user gesture)
old_vcard_ios = """      // iOS Safari: native vCard preview with guidance toast
      if (isIOS) {
        showIosToast();
        setTimeout(() => {
          window.location.href = staticVcfUrl;
        }, 280);
        return;
      }"""

new_vcard_ios = """      // iOS Safari: immediate synchronous navigation inside user-gesture launches native Contacts sheet directly
      if (isIOS) {
        window.location.href = staticVcfUrl;
        return;
      }"""

fixed_content = content.replace(old_vcard_ios, new_vcard_ios)

for slug, data in reps.items():
    rep_html = fixed_content
    # Replace title
    rep_html = rep_html.replace(
        '<title id="pageTitle">P-22 Corp | Executive Staff ID Badge</title>',
        f'<title id="pageTitle">{data["name"]} | P-22 Staff ID Badge</title>'
    )
    # Replace manifest
    rep_html = rep_html.replace(
        'href="/manifest-badge-pedro.json"',
        f'href="/manifest-badge-{slug}.json"'
    )
    # Replace apple icon
    rep_html = rep_html.replace(
        'href="/assets/staff/pedro-badge-icon-192.png"',
        f'href="/assets/staff/{data["icon"]}"'
    )
    # Replace apple-mobile-web-app-title
    rep_html = rep_html.replace(
        'content="Pedro"',
        f'content="{data["short"]}"'
    )
    # Set default rep in the inline script
    rep_html = re.sub(
        r"var rep = \(\(pm && pm\[1\]\) \|\| new URLSearchParams\(location\.search\)\.get\('rep'\) \|\| 'pedro'\)\.toLowerCase\(\);",
        f"var rep = '{slug}';",
        rep_html
    )
    # Set default in window.onload
    rep_html = re.sub(
        r"const repParam = \(urlParams\.get\('rep'\) \|\| pathRep \|\| 'pedro'\)\.toLowerCase\(\);",
        f"const repParam = (urlParams.get('rep') || pathRep || '{slug}').toLowerCase();",
        rep_html
    )

    out_file = f'badge-{slug}.html'
    with open(out_file, 'w', encoding='utf-8') as out:
        out.write(rep_html)
    print(f'Generated {out_file} for {slug} with app title: {data["short"]}')

# Also save fixed content back to badge.html
with open('badge.html', 'w', encoding='utf-8') as f:
    f.write(fixed_content)
print('Updated badge.html successfully!')
