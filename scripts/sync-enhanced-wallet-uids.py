import json
import re
import glob

UIDS = {
    'pedro': '1f6f9366-194d-43e8-af5a-ee77d2fadb5a',
    'eduardo': '1c98dceb-ac84-4197-8a1d-af9c6e61badf',
    'marleni': '730fa126-7f6c-415a-bec7-fdeb2cbc344f',
    'bids': '35ad4d79-58a8-46b0-98ee-b5336651ff5e',
    'logistics': '4df659bc-e07e-41b3-9779-93eafd04e851'
}

# 1. Update team.json
with open('team.json', 'r', encoding='utf-8') as f:
    team = json.load(f)

for slug, uid in UIDS.items():
    if slug in team:
        team[slug]['walletShareUrl'] = f"https://api.walletwallet.dev/p/{uid}"
        team[slug]['googleWalletUrl'] = f"https://api.walletwallet.dev/api/passes/{uid}/google"
        team[slug]['googleUrl'] = f"https://api.walletwallet.dev/api/passes/{uid}/google"

with open('team.json', 'w', encoding='utf-8') as f:
    json.dump(team, f, indent=2)
print("Updated team.json")

# 2. Update all HTML files containing TEAM_DATA
OLD_UIDS = {
    'pedro': 'c73d3e12-fd05-406b-88a8-cb8a0cc52a17',
    'eduardo': 'e98b67f8-2d0d-4076-b014-6937f9c70632',
    'marleni': '9d810422-bcaa-468b-9c77-b53ea2b43978',
    'bids': '88e37599-0cf1-446b-bace-5c1ecd8d729e',
    'logistics': 'd75da9aa-e200-4019-9d3e-78bec226dc9c'
}

html_files = glob.glob('*.html')
for hf in html_files:
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    for slug, old_uid in OLD_UIDS.items():
        new_uid = UIDS[slug]
        if old_uid in content:
            content = content.replace(old_uid, new_uid)
            changed = True
    
    if changed:
        with open(hf, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated UIDs in {hf}")
