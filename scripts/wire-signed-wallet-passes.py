import re
import os

files_map = {
    'pedro.html': '1f6f9366-194d-43e8-af5a-ee77d2fadb5a',
    'index.html': '1f6f9366-194d-43e8-af5a-ee77d2fadb5a',
    'eduardo.html': '1c98dceb-ac84-4197-8a1d-af9c6e61badf',
    'marleni.html': '730fa126-7f6c-415a-bec7-fdeb2cbc344f',
    'bids.html': '35ad4d79-58a8-46b0-98ee-b5336651ff5e',
    'logistics.html': '4df659bc-e07e-41b3-9779-93eafd04e851'
}

for fname, uid in files_map.items():
    if not os.path.exists(fname):
        print(f"Skipping {fname}, does not exist")
        continue

    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace button / a link for Apple Wallet
    pattern_apple = r'<a id="cardAppleWalletBtn" href="[^"]*"(.*?)>(.*?)</a>'
    replacement_apple = (
        f'<a id="cardAppleWalletBtn" '
        f'href="https://api.walletwallet.dev/p/{uid}/apple.pkpass" '
        f'\\1>'
        f'\\2</a>'
    )
    content = re.sub(pattern_apple, replacement_apple, content, flags=re.DOTALL)

    # Replace a link for Google Wallet
    pattern_google = r'<a id="cardGoogleWalletBtn" href="[^"]*"(.*?)>(.*?)</a>'
    replacement_google = (
        f'<a id="cardGoogleWalletBtn" '
        f'href="https://api.walletwallet.dev/api/passes/{uid}/google" '
        f'\\1>'
        f'\\2</a>'
    )
    content = re.sub(pattern_google, replacement_google, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {fname} with enhanced photo-embedded WalletWallet links")
