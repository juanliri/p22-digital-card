import json
import urllib.request

API_KEY = "ww_live_c53af8aef96ea8b3b2d0bbea899798aa"

with open("team.json", "r", encoding="utf-8") as f:
    team_data = json.load(f)

for slug, member in team_data.items():
    serial = member.get("walletSerial")
    if not serial:
        continue
    
    print(f"Triggering WalletWallet APNs & Google Wallet live push update for {member['name']} (Serial: {serial})...")
    
    payload = {
        "organizationName": "P-22 Corp Construction Material Solutions LLC",
        "logoText": "P-22 CORP",
        "logoURL": "https://card.p22corp.com/assets/branding/wallet-logo.png",
        "headerFields": [
            {"label": "STATUS", "value": "SAM.gov ACTIVE"}
        ],
        "secondaryFields": [
            {"label": "CAGE CODE", "value": "169D8"},
            {"label": "UEI NUMBER", "value": "X3HUQZ66P6N3"}
        ],
        "backFields": [
            {"label": "OFFICIAL TITLE", "value": member.get("title", "")},
            {"label": "DIRECT INQUIRIES", "value": member.get("directPhone", member.get("phone", ""))},
            {"label": "TOLL FREE HQ", "value": "1-888-722-2675"},
            {"label": "OFFICIAL EMAIL", "value": member.get("email", "")},
            {"label": "GOVERNMENT PORTAL", "value": f"https://card.p22corp.com/{slug}"},
            {"label": "DALLAS FACILITY", "value": "18383 Preston Rd, Suite 202, Dallas, TX 75252"},
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

print("\nDone triggering live pass updates!")
