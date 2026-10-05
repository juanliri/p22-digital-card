import json
import urllib.request

API_KEY = "ww_live_c53af8aef96ea8b3b2d0bbea899798aa"

REP_CONFIGS = {
    "pedro": {
        "color": "#1D3557",
        "header": "SAM.gov ACTIVE",
        "specialization": "Medium-Voltage Switchgear, Utility Substations, Division 26 Electrical Packages"
    },
    "eduardo": {
        "color": "#1D3557",
        "header": "SAM.gov ACTIVE",
        "specialization": "Commercial Supply Sales, Manufacturer Allocation, Prime Vendor Networks"
    },
    "marleni": {
        "color": "#1D3557",
        "header": "SAM.gov ACTIVE",
        "specialization": "DCAA Invoicing, WAWF Military Vouchers, GAAP Defense Accounting, NIST Compliance"
    },
    "bids": {
        "color": "#0B1528",
        "header": "24HR RFQ DESK",
        "specialization": "Rapid Federal Contracting Takeoffs, Simplified Acquisitions, FAR/DFARS & TAA"
    },
    "logistics": {
        "color": "#0B1528",
        "header": "DFW DISPATCH",
        "specialization": "Dallas-Fort Worth Staging Facility, Hot-Shot Flatbeds, Nationwide Direct-to-Jobsite"
    }
}

with open("team.json", "r", encoding="utf-8") as f:
    team_data = json.load(f)

for slug, member in team_data.items():
    serial = member.get("walletSerial")
    if not serial:
        continue
    
    cfg = REP_CONFIGS.get(slug, {
        "color": "#1D3557",
        "header": "SAM.gov ACTIVE",
        "specialization": "Government Contracting & Commercial Materials"
    })
    
    print(f"Triggering COMPLETE WalletWallet APNs & Google Wallet live push update for {member['name']} (Serial: {serial})...")
    
    payload = {
        "organizationName": "P-22 Corp Construction Material Solutions LLC",
        "logoText": "P-22 CORP",
        "logoURL": "https://card.p22corp.com/assets/branding/wallet-logo.png",
        "iconURL": f"https://card.p22corp.com/assets/staff/{slug}-badge-icon-192.png",
        "thumbnailURL": f"https://card.p22corp.com/assets/branding/pass-thumbs/{slug}-thumb.png",
        "description": f"{member['name']} - P-22 Corp Federal Contracting Credential",
        "barcodeValue": f"https://card.p22corp.com/{slug}",
        "barcodeFormat": "QR",
        "barcodeAltText": "CAGE: 169D8 | Scan for Verified Credentials",
        "color": cfg["color"],
        "primaryFields": [
            {"label": "STAFF IDENTITY", "value": member["name"]}
        ],
        "secondaryFields": [
            {"label": "CAGE CODE", "value": "169D8"},
            {"label": "UEI NUMBER", "value": "X3HUQZ66P6N3"}
        ],
        "headerFields": [
            {"label": "STATUS", "value": cfg["header"]}
        ],
        "backFields": [
            {"label": "OFFICIAL TITLE", "value": member.get("title", "")},
            {"label": "DIRECT INQUIRIES", "value": member.get("directPhone", member.get("phone", ""))},
            {"label": "TOLL FREE HQ", "value": "1-888-722-2675"},
            {"label": "OFFICIAL EMAIL", "value": member.get("email", "")},
            {"label": "GOVERNMENT PORTAL", "value": f"https://card.p22corp.com/{slug}"},
            {"label": "DALLAS FACILITY", "value": "18383 Preston Rd, Suite 202, Dallas, TX 75252"},
            {"label": "CORE SCOPE", "value": cfg["specialization"]},
            {"label": "FEDERAL COMPLIANCE", "value": "FAR/DFARS, TAA Compliant, NIST SP 800-171"}
        ]
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.walletwallet.dev/api/passes/{serial}",
        data=req_data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "P22Corp-ExecutivePass/2.0"
        },
        method="PUT"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            print(f"  [OK] Updated: {res_json}")
    except Exception as e:
        print(f"  [ERROR] {e}")

print("\nDone triggering complete live pass updates!")
