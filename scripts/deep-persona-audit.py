import re
import glob

files = glob.glob('*.html')
print(f'Auditing {len(files)} HTML files for persona consistency...\n')

for f in sorted(files):
    if f.startswith('badge-v1') or f.startswith('badge-v2'):
        continue
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    
    bm = re.findall(r'id=["\']briefingModalRepName["\'][^>]*>(.*?)<', content)
    sr = re.findall(r'id=["\']successRepName["\'][^>]*>(.*?)<', content)
    ea = re.findall(r'id=["\']emailAction["\'][^>]*href=["\'](.*?)["\']', content)
    qm = re.findall(r'id=["\']qrModalName["\'][^>]*>(.*?)<', content)
    sn = re.findall(r'id=["\']staffName["\'][^>]*>(.*?)<', content)
    pl = re.findall(r'id=["\']phoneLink["\'][^>]*href=["\'](.*?)["\']', content)
    ca = re.findall(r'id=["\']callAction["\'][^>]*href=["\'](.*?)["\']', content)
    mr = re.findall(r'id=["\']modalRepName["\'][^>]*>(.*?)<', content)
    ml = re.findall(r'id=["\']modalPublicCardLink["\'][^>]*href=["\'](.*?)["\']', content)
    qr_url = re.findall(r'id=["\']qrModalUrl["\'][^>]*href=["\'](.*?)["\']', content)

    print(f'=== {f} ===')
    if sn: print(f'  staffName: {sn[0].strip()}')
    if bm: print(f'  briefingModalRepName: {bm[0].strip()}')
    if sr: print(f'  successRepName: {sr[0].strip()}')
    if ea: print(f'  emailAction: {ea[0].strip()}')
    if qm: print(f'  qrModalName: {qm[0].strip()}')
    if pl: print(f'  phoneLink: {pl[0].strip()}')
    if ca: print(f'  callAction: {ca[0].strip()}')
    if mr: print(f'  modalRepName: {mr[0].strip()}')
    if ml: print(f'  modalPublicCardLink: {ml[0].strip()}')
    if qr_url: print(f'  qrModalUrl: {qr_url[0].strip()}')
