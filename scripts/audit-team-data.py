import json, re, glob

with open('team.json', 'r', encoding='utf-8') as f:
    master_team = json.load(f)

print("=== MASTER TEAM.JSON ===")
for k, v in master_team.items():
    print(f"{k}: phone={v.get('phone')} directPhone={v.get('directPhone')}")

files = glob.glob('*.html')
for fn in sorted(files):
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # check for 1-945-218-5896 or 407-369-9001 in eduardo blocks
    # or check TEAM_DATA if present
    m = re.search(r'const\s+TEAM_DATA\s*=\s*(\{.*?\});', content, re.DOTALL)
    if m:
        js_str = m.group(1)
        # try simple regex on eduardo block inside TEAM_DATA
        edu_m = re.search(r'"eduardo":\s*\{(.*?)\}', js_str, re.DOTALL)
        if edu_m:
            phone_m = re.search(r'"phone":\s*"([^"]+)"', edu_m.group(1))
            dphone_m = re.search(r'"directPhone":\s*"([^"]+)"', edu_m.group(1))
            print(f"{fn} [TEAM_DATA.eduardo]: phone={phone_m.group(1) if phone_m else 'None'} directPhone={dphone_m.group(1) if dphone_m else 'None'}")
    
    # also check if 1-945-218-5896 is associated with eduardo anywhere in the file
    for line_num, line in enumerate(content.splitlines(), 1):
        if 'eduardo' in line.lower() and '945' in line:
            print(f"WARNING: {fn}:{line_num} mentions eduardo and 945: {line.strip()[:80]}")
        if 'elopez' in line.lower() and '945' in line:
            print(f"WARNING: {fn}:{line_num} mentions elopez and 945: {line.strip()[:80]}")
