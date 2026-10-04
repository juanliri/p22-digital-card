import re, glob

# 1. Update public card files
card_files = ['index.html', 'pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html']
for fn in card_files:
    with open(fn, 'r', encoding='utf-8') as f:
        c = f.read()
    
    old_block = """      // Direct Phone & Email (100% Uncropped & Clickable)
      const cleanPhoneDigits = data.phone.replace(/[^0-9]/g, '');
      if (document.getElementById('directPhoneLink')) document.getElementById('directPhoneLink').href = `tel:${cleanPhoneDigits}`;
      if (document.getElementById('directPhoneVal')) document.getElementById('directPhoneVal').textContent = data.phone;"""
    
    new_block = """      // Direct Phone & Email (100% Uncropped & Clickable)
      const activePhone = data.directPhone || data.phone;
      const cleanPhoneDigits = activePhone.replace(/[^0-9]/g, '');
      if (document.getElementById('directPhoneLink')) document.getElementById('directPhoneLink').href = `tel:${cleanPhoneDigits}`;
      if (document.getElementById('directPhoneVal')) document.getElementById('directPhoneVal').textContent = activePhone;"""
      
    if old_block in c:
        c = c.replace(old_block, new_block)
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Updated dynamic phone binding in {fn}")
    else:
        # Regex fallback
        pat = r"const cleanPhoneDigits = data\.phone\.replace\(\/\[\^0-9\]\/g, ''\);\s*if \(document\.getElementById\('directPhoneLink'\)\) document\.getElementById\('directPhoneLink'\)\.href = `tel:\$\{cleanPhoneDigits\}`;\s*if \(document\.getElementById\('directPhoneVal'\)\) document\.getElementById\('directPhoneVal'\)\.textContent = data\.phone;"
        sub = """const activePhone = data.directPhone || data.phone;
      const cleanPhoneDigits = activePhone.replace(/[^0-9]/g, '');
      if (document.getElementById('directPhoneLink')) document.getElementById('directPhoneLink').href = `tel:${cleanPhoneDigits}`;
      if (document.getElementById('directPhoneVal')) document.getElementById('directPhoneVal').textContent = activePhone;"""
        new_c, count = re.subn(pat, sub, c)
        if count > 0:
            with open(fn, 'w', encoding='utf-8') as f:
                f.write(new_c)
            print(f"Updated dynamic phone binding in {fn} via regex ({count} replacements)")
        else:
            print(f"Could NOT find dynamic phone binding in {fn}")

# 2. Update badge files
badge_mappings = {
    'badge-eduardo.html': 'eduardo',
    'badge-pedro.html': 'pedro',
    'badge-marleni.html': 'marleni',
    'badge-bids.html': 'bids',
    'badge-logistics.html': 'logistics',
    'badge.html': 'pedro'
}

for bfn, default_slug in badge_mappings.items():
    with open(bfn, 'r', encoding='utf-8') as f:
        bc = f.read()
    
    # 2a. Update default slug in getSelectedRep
    # const repKey = ((pm && pm[1]) || params.get('rep') || 'pedro').toLowerCase();
    # return TEAM_DATA[repKey] || TEAM_DATA.pedro;
    rep_pat = r"const repKey = \(\(pm && pm\[1\]\) \|\| params\.get\('rep'\) \|\| '[a-z]+'\)\.toLowerCase\(\);\s*return TEAM_DATA\[repKey\] \|\| TEAM_DATA\.[a-z]+;"
    rep_sub = f"const repKey = ((pm && pm[1]) || params.get('rep') || '{default_slug}').toLowerCase();\n      return TEAM_DATA[repKey] || TEAM_DATA.{default_slug};"
    bc, rcount = re.subn(rep_pat, rep_sub, bc)
    
    # 2b. Update staffPhone text and link to use directPhone if available
    phone_pat = r"document\.getElementById\('staffPhone'\)\.textContent = activeRep\.phone;\s*const cleanPhone = activeRep\.phone\.replace\(\/\[\^0-9\+\]\/g, ''\);\s*document\.getElementById\('phoneLink'\)\.href = `tel:\$\{cleanPhone\}`;"
    phone_sub = """const activePhone = activeRep.directPhone || activeRep.phone;
      document.getElementById('staffPhone').textContent = activePhone;
      const cleanPhone = activePhone.replace(/[^0-9+]/g, '');
      document.getElementById('phoneLink').href = `tel:${cleanPhone}`;"""
    bc, pcount = re.subn(phone_pat, phone_sub, bc)
    
    with open(bfn, 'w', encoding='utf-8') as f:
        f.write(bc)
    print(f"Updated {bfn}: repKey default='{default_slug}' ({rcount}), phone logic ({pcount})")
