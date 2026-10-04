import json, re, glob

with open('team.json', 'r', encoding='utf-8') as f:
    master_team = json.load(f)

# Serialize master_team to formatted JSON for JS embedding
team_json_str = json.dumps(master_team, indent=2)

badge_files = [
    'badge.html',
    'badge-pedro.html',
    'badge-eduardo.html',
    'badge-marleni.html',
    'badge-bids.html',
    'badge-logistics.html',
    'badge-v1-original.html',
    'badge-v2-tabbed.html',
    'badge-v3-unified.html'
]

for fn in badge_files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find const TEAM_DATA = { ... };
    pattern = r'(const\s+TEAM_DATA\s*=\s*)\{.*?\};(\s*(?:function|const|let|var|\n\s*//))'
    m = re.search(pattern, content, re.DOTALL)
    if m:
        replacement = m.group(1) + team_json_str + ';' + m.group(2)
        content = content[:m.start()] + replacement + content[m.end():]
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated TEAM_DATA in {fn}")
    else:
        print(f"FAILED to find TEAM_DATA pattern in {fn}")

# Now check badge-eduardo.html DOM elements specifically
with open('badge-eduardo.html', 'r', encoding='utf-8') as f:
    bedu = f.read()

# Verify phone link and display on badge-eduardo.html
print("Checking badge-eduardo.html DOM:")
for line in bedu.splitlines():
    if any(k in line for k in ['staffPhone', 'staffEmail', 'phoneLink', 'emailLink', 'repKey']):
        print(" ", line.strip())
