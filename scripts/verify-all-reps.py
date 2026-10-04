import re

files = ['pedro.html', 'index.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html']
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    print('=== ' + f + ' ===')
    m_email = re.search(r'id="emailAction"\s+href="([^"]*)"', c)
    print('  emailAction:', m_email.group(1) if m_email else 'N/A')
    m_rep = re.search(r'id="briefingModalRepName"[^>]*>(.*?)</span>', c)
    print('  briefingModalRepName:', m_rep.group(1) if m_rep else 'N/A')
    m_succ = re.search(r'id="successRepName"[^>]*>(.*?)</span>', c)
    print('  successRepName:', m_succ.group(1) if m_succ else 'N/A')
    m_qrname = re.search(r'id="qrModalName"[^>]*>(.*?)</p>', c)
    print('  qrModalName:', m_qrname.group(1) if m_qrname else 'N/A')
    m_qrurl = re.search(r'id="qrModalUrl"[^>]*>(.*?)</p>', c)
    print('  qrModalUrl:', m_qrurl.group(1) if m_qrurl else 'N/A')
