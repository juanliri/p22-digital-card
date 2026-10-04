import os
import re

card_files = [
    'pedro.html',
    'eduardo.html',
    'marleni.html',
    'bids.html',
    'logistics.html',
    'index.html',
]

def clean_card_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Primary CTA: Save Contact to Phone (.vcf) -> Save Contact to Phone
    content = content.replace(
        '<span>Save Contact to Phone (.vcf)</span>',
        '<span>Save Contact to Phone</span>'
    )

    # 2. Subtitle: 1-Tap Action ... -> 1-Tap Save • Instant sync to your phone address book
    content = re.sub(
        r'1-Tap Action &bull;\s*<span class="text-amber-300">iOS:</span> Tap "Create New Contact" at bottom &bull;\s*<span class="text-emerald-400">Android:</span> Choose "Contacts"',
        '1-Tap Save &bull; Instant sync to Apple &amp; Android address book',
        content
    )

    # 3. Sticky bottom dock: Save Contact (.vcf) -> Save Contact
    content = content.replace(
        '<span>Save Contact (.vcf)</span>',
        '<span>Save Contact</span>'
    )

    # 4. Capability Statement: Download Capability Statement (PDF) -> Capability Statement
    content = content.replace(
        '<span>Download Capability Statement (PDF)</span>',
        '<span>View Capability Statement</span>'
    )

    # 5. Download PDF -> View Document
    content = content.replace(
        '<span>Download PDF</span>',
        '<span>View Document</span>'
    )

    # 6. Corporate Overview: <span>Download</span> -> <span>View</span>
    content = re.sub(
        r'(<a [^>]*assets/pdf/P-22_Corporate_Overview\.pdf[^>]*>.*?<span>)Download(</span>)',
        r'\g<1>View Document\g<2>',
        content,
        flags=re.DOTALL
    )

    # 7. Calendar: Apple / Outlook Calendar (.ICS) -> Add to Calendar
    content = re.sub(
        r'<span>📥 Apple / Outlook Calendar \(\.ICS\)</span>',
        '<span>📅 Add to Apple / Outlook Calendar</span>',
        content
    )

    # 8. Apple Wallet button fix:
    # Instead of pointing directly to the self-signed pkpass that errors with "Safari cannot download this file",
    # wire cardAppleWalletBtn to call downloadActiveVCard() which opens the verified Apple Contact Card!
    content = re.sub(
        r'<a id="cardAppleWalletBtn" href="[^"]*pkpass" onclick="trackEvent\(\'Wallet\', \'Click\', \'AppleWalletPass\'\); revealStep2Exchange\(false, \'Pass Added ✓\'\);"',
        '<button type="button" id="cardAppleWalletBtn" onclick="downloadActiveVCard(); trackEvent(\'Wallet\', \'Click\', \'AppleContact\'); revealStep2Exchange(false, \'Contact Saved ✓\');"',
        content
    )
    content = re.sub(
        r'<a id="cardGoogleWalletBtn" href="[^"]*walletwallet\.dev[^"]*" target="_blank" onclick="trackEvent\(\'Wallet\', \'Click\', \'GoogleWalletPass\'\); revealStep2Exchange\(false, \'Pass Added ✓\'\);"',
        '<button type="button" id="cardGoogleWalletBtn" onclick="downloadActiveVCard(); trackEvent(\'Wallet\', \'Click\', \'GoogleContact\'); revealStep2Exchange(false, \'Contact Saved ✓\');"',
        content
    )
    # Fix closing tags for those buttons if they were </a>
    content = re.sub(
        r'(id="cardAppleWalletBtn"[^>]*>.*?<span>Apple Wallet</span>\s*)</a>',
        r'\g<1></button>',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'(id="cardGoogleWalletBtn"[^>]*>.*?<span>Google Wallet</span>\s*)</a>',
        r'\g<1></button>',
        content,
        flags=re.DOTALL
    )

    # Change Apple Wallet / Google Wallet labels to clean executive labels
    content = re.sub(
        r'(id="cardAppleWalletBtn"[^>]*>.*?)<span>Apple Wallet</span>',
        r'\g<1><span>Save to Apple</span>',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'(id="cardGoogleWalletBtn"[^>]*>.*?)<span>Google Wallet</span>',
        r'\g<1><span>Save to Google</span>',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[OK] Cleaned card file: {filepath}")

for f in card_files:
    clean_card_file(f)

# Now clean badge files
badge_files = [
    'badge.html',
    'badge-pedro.html',
    'badge-eduardo.html',
    'badge-marleni.html',
    'badge-bids.html',
    'badge-logistics.html',
]

for bf in badge_files:
    if not os.path.exists(bf):
        continue
    with open(bf, 'r', encoding='utf-8') as f:
        bcontent = f.read()

    # Change "Save Pass" to "Save Contact" with User-Plus icon
    old_btn = """      <button onclick="downloadBadgeVCard()" class="flex flex-col items-center justify-center py-2.5 px-1 bg-p22gold hover:bg-p22goldHover text-slate-950 font-montserrat font-bold rounded-xl text-xs transition duration-150 shadow-md active:scale-95 btn-bounce">
        <svg class="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        <span>Save Pass</span>
      </button>"""

    new_btn = """      <button onclick="downloadBadgeVCard()" class="flex flex-col items-center justify-center py-2.5 px-1 bg-p22gold hover:bg-p22goldHover text-slate-950 font-montserrat font-bold rounded-xl text-xs transition duration-150 shadow-md active:scale-95 btn-bounce">
        <svg class="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
        <span>Save Contact</span>
      </button>"""

    bcontent = bcontent.replace(old_btn, new_btn)
    # Also replace any remaining <span>Save Pass</span> with <span>Save Contact</span>
    bcontent = bcontent.replace('<span>Save Pass</span>', '<span>Save Contact</span>')

    with open(bf, 'w', encoding='utf-8') as f:
        f.write(bcontent)
    print(f"[OK] Cleaned badge file: {bf}")

print("\n[ALL FILES CLEANED WITH BUSINESS-FRIENDLY LABELS]")
