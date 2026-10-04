import re

files = ['pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html', 'index.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        lines = fp.readlines()
    
    new_lines = []
    skip = 0
    cleaned = False
    for line in lines:
        if '// Update Dual Fast-Pass Action Bar' in line:
            skip = 8
            cleaned = True
            continue
        if skip > 0:
            skip -= 1
            continue
        new_lines.append(line)
        
    if cleaned:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.writelines(new_lines)
        print(f'[OK] Cleaned switchRep Fast-Pass assignment in {f}')
    else:
        print(f'[WARN] Not found in {f}')
