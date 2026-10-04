import glob
import re

for f in sorted(glob.glob('badge-*.html')):
    c = open(f, encoding='utf-8').read()
    e = re.search(r'id=["\']staffEmail["\'][^>]*>(.*?)</span>', c)
    p = re.search(r'id=["\']staffPhone["\'][^>]*>(.*?)</span>', c)
    pl = re.search(r'id=["\']phoneLink["\']\s+href=["\'](.*?)["\']', c)
    print(f"{f}: email = {e.group(1) if e else 'None'} | phone = {p.group(1) if p else 'None'} | phoneLink = {pl.group(1) if pl else 'None'}")
