import re
import os

reps = ['pedro', 'eduardo', 'marleni', 'bids', 'logistics']
for r in reps:
    fname = f'badge-{r}.html'
    if not os.path.exists(fname):
        print(f"MISSING: {fname}")
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    
    title = re.search(r'<title id="pageTitle">(.*?)</title>', c)
    app_title = re.search(r'name="apple-mobile-web-app-title"\s+content="([^"]+)"', c)
    manifest = re.search(r'rel="manifest"\s+href="([^"]+)"', c)
    icon = re.search(r'rel="apple-touch-icon"\s+href="([^"]+)"', c)
    
    print(f"{fname}:")
    print(f"  Title: {title.group(1) if title else 'NOT FOUND'}")
    print(f"  App Title: {app_title.group(1) if app_title else 'NOT FOUND'}")
    print(f"  Manifest: {manifest.group(1) if manifest else 'NOT FOUND'}")
    print(f"  Icon: {icon.group(1) if icon else 'NOT FOUND'}")
