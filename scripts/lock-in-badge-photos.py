import re, glob

badge_files = {
    'badge-pedro.html': 'pedro',
    'badge-eduardo.html': 'eduardo',
    'badge-marleni.html': 'marleni',
    'badge-bids.html': 'bids',
    'badge-logistics.html': 'logistics',
    'badge.html': 'pedro',
    'badge-v1-original.html': 'pedro',
    'badge-v2-tabbed.html': 'pedro',
    'badge-v3-unified.html': 'pedro',
}

for fn, rep in badge_files.items():
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update static img tag
    old_img_pat = r'<img\s+id="staffPhoto"[^>]*>'
    new_img = f'<img id="staffPhoto" src="/assets/staff/{rep}-official-1x1.png" alt="Staff Portrait" class="w-full h-full object-cover rounded-full" onerror="if(window.activeRep && window.activeRep.photoB64){{this.src=\'data:image/jpeg;base64,\'+window.activeRep.photoB64;}}else{{this.src=\'/favicon.png\';}}">'
    content = re.sub(old_img_pat, new_img, content)

    # 2. Update JS assignment
    old_js_pat = r"document\.getElementById\('staffPhoto'\)\.src\s*=\s*activeRep\.avatar\s*\|\|\s*'[^']*';"
    new_js = """let avatarSrc = activeRep.avatar || `/assets/staff/${activeRep.slug}-official-1x1.png`;
      if (!avatarSrc.startsWith('/') && !avatarSrc.startsWith('http') && !avatarSrc.startsWith('data:')) {
        avatarSrc = '/' + avatarSrc;
      }
      const photoEl = document.getElementById('staffPhoto');
      if (photoEl) {
        photoEl.src = avatarSrc;
        photoEl.onerror = function() {
          if (activeRep.photoB64 && !this.src.startsWith('data:')) {
            this.src = 'data:image/jpeg;base64,' + activeRep.photoB64;
          } else {
            this.src = '/favicon.png';
          }
        };
      }"""
    content = re.sub(old_js_pat, new_js, content)

    with open(fn, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Locked in photo failsafes for {fn} (rep: {rep})")
