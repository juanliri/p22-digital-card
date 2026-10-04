import re

files = ['index.html', 'pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html']
print('Auditing Wallet Links across all public cards...\n')

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    g_match = re.findall(r'id=["\']cardGoogleWalletBtn["\'][^>]*href=["\'](.*?)["\']', c)
    a_match = re.findall(r'id=["\']cardAppleWalletBtn["\'][^>]*href=["\'](.*?)["\']', c)
    print(f'=== {f} ===')
    print('  Apple: ', a_match[0] if a_match else 'NONE')
    print('  Google:', g_match[0] if g_match else 'NONE')
