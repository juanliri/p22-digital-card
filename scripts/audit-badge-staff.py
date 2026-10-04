import glob
import re

for f in sorted(glob.glob('badge-*.html')):
    c = open(f, encoding='utf-8').read()
    n = re.search(r'id=["\']staffName["\'][^>]*>(.*?)</h1>', c)
    t = re.search(r'id=["\']staffTitle["\'][^>]*>(.*?)</p>', c)
    print(f"{f}: staffName = {n.group(1) if n else 'None'} | staffTitle = {t.group(1) if t else 'None'}")
