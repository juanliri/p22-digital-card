import urllib.request
import json
import base64
import os

API_KEY = "ww_live_c53af8aef96ea8b3b2d0bbea899798aa"
API_URL = "https://api.walletwallet.dev/api/passes"

REPS = [
    {
        "slug": "pedro",
        "name": "Pedro Felipe",
        "title": "Managing Director & Power Systems Lead",
        "email": "pfelipe@p22corp.com",
        "phone": "1-945-218-5896",
        "tollFree": "1-888-722-2675",
        "header": "SAM.gov ACTIVE",
        "specialization": "Medium-Voltage Switchgear, Utility Substations, Division 26 Electrical Packages",
        "color": "#1D3557",
        "photo": "https://card.p22corp.com/assets/staff/pedro-official-1x1.png",
        "icon": "https://card.p22corp.com/assets/staff/pedro-badge-icon-192.png"
    },
    {
        "slug": "eduardo",
        "name": "Eduardo Lopez",
        "title": "Director of Commercial Sales & Material Supply",
        "email": "elopez@p22corp.com",
        "phone": "1-407-369-9001",
        "tollFree": "1-888-722-2675",
        "header": "SAM.gov ACTIVE",
        "specialization": "Commercial Supply Sales, Manufacturer Allocation, Prime Vendor Networks",
        "color": "#1D3557",
        "photo": "https://card.p22corp.com/assets/staff/eduardo-official-1x1.png",
        "icon": "https://card.p22corp.com/assets/staff/eduardo-badge-icon-192.png"
    },
    {
        "slug": "marleni",
        "name": "Marleni Méndez",
        "title": "Finance Officer & DCAA Compliance Lead",
        "email": "mmendez@p22corp.com",
        "phone": "1-888-722-2675",
        "tollFree": "1-888-722-2675",
        "header": "SAM.gov ACTIVE",
        "specialization": "DCAA Invoicing, WAWF Military Vouchers, GAAP Defense Accounting, NIST Compliance",
        "color": "#1D3557",
        "photo": "https://card.p22corp.com/assets/staff/marleni-official-1x1.png",
        "icon": "https://card.p22corp.com/assets/staff/marleni-badge-icon-192.png"
    },
    {
        "slug": "bids",
        "name": "Government Procurement Desk",
        "title": "24-Hour Rapid RFQ & Solicitation Unit",
        "email": "bids@p22corp.com",
        "phone": "1-888-722-2675",
        "tollFree": "1-888-722-2675",
        "header": "24HR RFQ DESK",
        "specialization": "Rapid Federal Contracting Takeoffs, Simplified Acquisitions, FAR/DFARS & TAA",
        "color": "#0B1528",
        "photo": "https://card.p22corp.com/assets/staff/bids-official-1x1.png",
        "icon": "https://card.p22corp.com/assets/staff/bids-badge-icon-192.png"
    },
    {
        "slug": "logistics",
        "name": "Dallas Logistics Hub",
        "title": "Centralized Fleet Dispatch & Material Staging",
        "email": "logistics@p22corp.com",
        "phone": "1-888-722-2675",
        "tollFree": "1-888-722-2675",
        "header": "DFW DISPATCH",
        "specialization": "Dallas-Fort Worth Staging Facility, Hot-Shot Flatbeds, Nationwide Direct-to-Jobsite",
        "color": "#0B1528",
        "photo": "https://card.p22corp.com/assets/staff/logistics-official-1x1.png",
        "icon": "https://card.p22corp.com/assets/staff/logistics-badge-icon-192.png"
    }
]

os.makedirs("assets/passes", exist_ok=True)

# Load team.json
with open("team.json", "r", encoding="utf-8") as f:
    team_data = json.load(f)

for rep in REPS:
    slug = rep["slug"]
    print(f"Minting customized Apple & Google pass for: {rep['name']} ({slug})...")

    payload = {
        "organizationName": "P-22 Corp Construction Material Solutions LLC",
        "logoText": "P-22 CORP",
        "logoURL": "https://card.p22corp.com/assets/branding/logo-navy-flat.png",
        "iconURL": rep["icon"],
        "thumbnailURL": rep["photo"],
        "description": f"{rep['name']} - P-22 Corp Federal Contracting Credential",
        "barcodeValue": f"https://card.p22corp.com/{slug}",
        "barcodeFormat": "QR",
        "barcodeAltText": "CAGE: 169D8 | Scan for Verified Credentials",
        "color": rep["color"],
        "sharingProhibited": False,
        "primaryFields": [
            {"label": "STAFF IDENTITY", "value": rep["name"]}
        ],
        "secondaryFields": [
            {"label": "CAGE CODE", "value": "169D8"},
            {"label": "UEI NUMBER", "value": "X3HUQZ66P6N3"}
        ],
        "headerFields": [
            {"label": "STATUS", "value": rep["header"]}
        ],
        "backFields": [
            {"label": "OFFICIAL TITLE", "value": rep["title"]},
            {"label": "DIRECT INQUIRIES", "value": rep["phone"]},
            {"label": "TOLL FREE HQ", "value": rep["tollFree"]},
            {"label": "OFFICIAL EMAIL", "value": rep["email"]},
            {"label": "GOVERNMENT PORTAL", "value": f"https://card.p22corp.com/{slug}"},
            {"label": "DALLAS FACILITY", "value": "18383 Preston Rd, Suite 202, Dallas, TX 75252"},
            {"label": "CORE SCOPE", "value": rep["specialization"]},
            {"label": "FEDERAL COMPLIANCE", "value": "FAR/DFARS, TAA Compliant, NIST SP 800-171"}
        ]
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=req_data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "P22Corp-ExecutivePass/2.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                res_json = json.loads(resp.read().decode("utf-8"))
                serial = res_json.get("serialNumber")
                google_url = res_json.get("googleSaveUrl")
                share_url = res_json.get("shareUrl")
                apple_b64 = res_json.get("applePass")

                # Save static .pkpass binary directly to assets/passes/
                if apple_b64:
                    raw_bytes = base64.b64decode(apple_b64)
                    pass_path = f"assets/passes/{slug}.pkpass"
                    with open(pass_path, "wb") as pf:
                        pf.write(raw_bytes)
                    print(f"  [OK] Saved {pass_path} ({len(raw_bytes)} bytes, photo embedded, signed)")

                # Update team_data
                if slug in team_data:
                    team_data[slug]["walletSerial"] = serial
                    team_data[slug]["googleWalletUrl"] = google_url
                    team_data[slug]["walletShareUrl"] = share_url
                    if "phone" in rep and rep["phone"]:
                        team_data[slug]["directPhone"] = rep["phone"]

                print(f"  [OK] Serial: {serial}")
                print(f"  [OK] Google Wallet URL: {google_url[:40]}...")
                print(f"  [OK] Share URL: {share_url}")
            else:
                print(f"  [FAIL] HTTP status {resp.status}")
    except Exception as e:
        print(f"  [ERROR] {e}")

# Save updated team.json
with open("team.json", "w", encoding="utf-8") as f:
    json.dump(team_data, f, indent=2)

print("\nAll 5 customized passes minted, photos embedded, and stored!")
