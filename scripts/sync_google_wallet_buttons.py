import json, re

with open('team.json', 'r', encoding='utf-8') as f:
    team = json.load(f)

for s in ['pedro', 'eduardo', 'marleni', 'bids', 'logistics']:
    with open(f'{s}.html', 'r', encoding='utf-8') as f:
        c = f.read()
    
    # 1. Check/Update Google Wallet button
    pattern_g = r'(id="cardGoogleWalletBtn"\s+href=")[^"]+(")'
    new_g_url = team[s]['googleWalletUrl']
    c_new = re.sub(pattern_g, r'\g<1>' + new_g_url + r'\2', c)

    # 2. Check Apple Wallet button
    pattern_a = r'(id="cardAppleWalletBtn"\s+href=")[^"]+(")'
    new_a_url = team[s]['pass']
    # If the button had an alias like pedro-felipe.pkpass, keep or ensure it points to the valid pkpass
    m_a = re.search(r'id="cardAppleWalletBtn"\s+href="([^"]+)"', c)
    if m_a:
        print(f"{s} Apple Wallet href: {m_a.group(1)}")

    if c_new != c:
        with open(f'{s}.html', 'w', encoding='utf-8') as f:
            f.write(c_new)
        print(f"Updated cardGoogleWalletBtn href in {s}.html")

# Also update index.html (defaulting to pedro)
with open('index.html', 'r', encoding='utf-8') as f:
    c_idx = f.read()
pattern_g = r'(id="cardGoogleWalletBtn"\s+href=")[^"]+(")'
new_g_url = team['pedro']['googleWalletUrl']
c_idx_new = re.sub(pattern_g, r'\g<1>' + new_g_url + r'\2', c_idx)
if c_idx_new != c_idx:
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c_idx_new)
    print("Updated cardGoogleWalletBtn href in index.html")
