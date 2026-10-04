import glob
import re

for f in sorted(glob.glob('badge*.html')):
    c = open(f, encoding='utf-8').read()
    m = re.search(r'id=["\']modalRepName["\'][^>]*>(.*?)</h3>', c)
    if m:
        print(f"{f}: modalRepName = {m.group(1)}")
