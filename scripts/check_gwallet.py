import json, re

with open('team.json', 'r', encoding='utf-8') as f:
    team = json.load(f)

for s in ['pedro', 'eduardo', 'marleni', 'bids', 'logistics']:
    with open(f'{s}.html', 'r', encoding='utf-8') as f:
        c = f.read()
    m = re.search(r'id="cardGoogleWalletBtn"\s+href="([^"]+)"', c)
    if m:
        href = m.group(1)
        expected = team[s]['googleWalletUrl']
        print(f"{s}: matches={href == expected}")
        if href != expected:
            print(f"  html: {href[:50]}...")
            print(f"  team: {expected[:50]}...")
    else:
        print(f"{s}: no match")
