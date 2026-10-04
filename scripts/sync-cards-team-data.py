import json, re

with open('team.json', 'r', encoding='utf-8') as f:
    master_team = json.load(f)

team_json_str = json.dumps(master_team, indent=2)

card_files = ['index.html', 'pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html', 'setup.html']

for fn in card_files:
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
        print(f"FAILED to find TEAM_DATA in {fn}")
