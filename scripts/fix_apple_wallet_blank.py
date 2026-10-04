import glob, re

for fn in ['index.html', 'pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html']:
    with open(fn, 'r', encoding='utf-8') as f:
        c = f.read()

    # Remove target="_blank" from cardAppleWalletBtn so iOS Safari opens PassKit cleanly in-place
    # instead of opening an empty about:blank tab that hangs or crashes
    c_new = re.sub(r'(id="cardAppleWalletBtn"[^>]*?)\s*target="_blank"', r'\1', c)
    if c_new != c:
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(c_new)
        print(f"Removed target=_blank from Apple Wallet button in {fn}")
    else:
        print(f"No target=_blank on Apple Wallet button in {fn}")
