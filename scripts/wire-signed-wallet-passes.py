import re
import os

files_map = {
    'pedro.html': '8c756230-8f2e-44b4-8a63-308c8fc2c140',
    'index.html': '8c756230-8f2e-44b4-8a63-308c8fc2c140',
    'eduardo.html': '56b035bf-14e4-4679-81a3-749a26baf46b',
    'marleni.html': '50005e25-26ba-446f-86c3-e16a3450d967',
    'bids.html': '79cca1ec-88a4-4cc2-b6de-d71d8bfa71e4',
    'logistics.html': 'b2ffe06f-6008-4ed5-ae04-4d7992772d03'
}

for fname, uid in files_map.items():
    if not os.path.exists(fname):
        print(f"Skipping {fname}, does not exist")
        continue

    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace button with link for Apple Wallet
    pattern_apple = r'<button type="button" id="cardAppleWalletBtn"[^>]*>(.*?)</button>'
    replacement_apple = (
        f'<a id="cardAppleWalletBtn" '
        f'href="https://api.walletwallet.dev/p/{uid}/apple.pkpass" '
        f'target="_blank" '
        f'onclick="trackEvent(\'Wallet\', \'Click\', \'AppleWalletPass\'); revealStep2Exchange(false, \'Pass Saved ✓\');" '
        f'class="py-2.5 px-3 rounded-xl bg-black hover:bg-neutral-900 border border-white/20 text-white font-montserrat font-bold text-[11px] tracking-wide shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 btn-bounce">'
        f'\\1</a>'
    )
    content = re.sub(pattern_apple, replacement_apple, content, flags=re.DOTALL)

    # Replace button with link for Google Wallet
    pattern_google = r'<button type="button" id="cardGoogleWalletBtn"[^>]*>(.*?)</button>'
    replacement_google = (
        f'<a id="cardGoogleWalletBtn" '
        f'href="https://api.walletwallet.dev/api/passes/{uid}/google" '
        f'target="_blank" '
        f'onclick="trackEvent(\'Wallet\', \'Click\', \'GoogleWalletPass\'); revealStep2Exchange(false, \'Pass Saved ✓\');" '
        f'class="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/20 text-white font-montserrat font-bold text-[11px] tracking-wide shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 btn-bounce">'
        f'\\1</a>'
    )
    content = re.sub(pattern_google, replacement_google, content, flags=re.DOTALL)

    # In switchStaff, wire cardAppleWalletBtn and cardGoogleWalletBtn hrefs
    switch_idx = content.find('function switchStaff')
    if switch_idx != -1:
        func_body = content[switch_idx:switch_idx + 4000]
        if 'appleBtn.href' not in func_body:
            insert_marker = "trackEvent('Profile', 'Load', data.name);"
            wire_code = (
                "      const appleBtn = document.getElementById('cardAppleWalletBtn');\n"
                "      if (appleBtn && data.walletShareUrl) {\n"
                "        appleBtn.href = `${data.walletShareUrl}/apple.pkpass`;\n"
                "      }\n"
                "      const googleBtn = document.getElementById('cardGoogleWalletBtn');\n"
                "      if (googleBtn && data.googleUrl) {\n"
                "        googleBtn.href = data.googleUrl;\n"
                "      }\n"
                "      "
            )
            content = content.replace(insert_marker, wire_code + insert_marker, 1)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {fname} with official signed WalletWallet links")
