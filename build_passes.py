import os
import json
import hashlib
import zipfile
import datetime
from PIL import Image
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs7

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
PASSES_DIR = os.path.join(ASSETS_DIR, "passes")
os.makedirs(PASSES_DIR, exist_ok=True)

# Generate a signing key and self-signed certificate for Pass Type ID
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Texas"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, "Dallas"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "P-22 Corp Construction Material Solutions LLC"),
    x509.NameAttribute(NameOID.COMMON_NAME, "Pass Type ID: pass.com.p22corp.card"),
])
cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1))
    .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=730))
    .sign(key, hashes.SHA256())
)

# Prepare shared images
logo_src = os.path.join(ASSETS_DIR, "branding", "p22-logo-pdf.png")
if not os.path.exists(logo_src):
    logo_src = os.path.join(BASE_DIR, "favicon.png")

logo_img = Image.open(logo_src).convert("RGBA")

# Create standard Apple Wallet image assets
def create_image_assets(staff_photo_path, work_dir):
    # icon.png (29x29) and icon@2x.png (58x58)
    icon_img = logo_img.copy()
    icon_img.thumbnail((58, 58), Image.Resampling.LANCZOS)
    icon_canvas = Image.new("RGBA", (58, 58), (29, 53, 87, 255))
    x = (58 - icon_img.width) // 2
    y = (58 - icon_img.height) // 2
    icon_canvas.paste(icon_img, (x, y), icon_img)
    icon_canvas.save(os.path.join(work_dir, "icon@2x.png"), "PNG")
    
    icon_small = icon_canvas.resize((29, 29), Image.Resampling.LANCZOS)
    icon_small.save(os.path.join(work_dir, "icon.png"), "PNG")

    # logo.png (160x50) and logo@2x.png (320x100)
    logo_canvas = Image.new("RGBA", (320, 100), (0, 0, 0, 0))
    temp_logo = logo_img.copy()
    temp_logo.thumbnail((300, 90), Image.Resampling.LANCZOS)
    lx = (320 - temp_logo.width) // 2
    ly = (100 - temp_logo.height) // 2
    logo_canvas.paste(temp_logo, (lx, ly), temp_logo)
    logo_canvas.save(os.path.join(work_dir, "logo@2x.png"), "PNG")

    logo_small = logo_canvas.resize((160, 50), Image.Resampling.LANCZOS)
    logo_small.save(os.path.join(work_dir, "logo.png"), "PNG")

    # thumbnail.png (90x90) and thumbnail@2x.png (180x180) from staff photo
    thumb_canvas = Image.new("RGBA", (180, 180), (29, 53, 87, 255))
    if staff_photo_path and os.path.exists(staff_photo_path):
        simg = Image.open(staff_photo_path).convert("RGBA")
        simg = simg.resize((180, 180), Image.Resampling.LANCZOS)
        thumb_canvas.paste(simg, (0, 0))
    else:
        thumb_canvas.paste(temp_logo, (10, 45), temp_logo)
    
    thumb_canvas.save(os.path.join(work_dir, "thumbnail@2x.png"), "PNG")
    thumb_small = thumb_canvas.resize((90, 90), Image.Resampling.LANCZOS)
    thumb_small.save(os.path.join(work_dir, "thumbnail.png"), "PNG")

team_members = [
    {
        "slug": "pedro",
        "name": "Pedro Felipe",
        "title": "Managing Director",
        "subtitle": "Government Procurement Lead",
        "email": "pfelipe@p22corp.com",
        "photo": os.path.join(ASSETS_DIR, "staff", "pedro-felipe.png")
    },
    {
        "slug": "eduardo",
        "name": "Eduardo Lopez",
        "title": "Director of Gov Sales",
        "subtitle": "Estimating & Bids Desk",
        "email": "elopez@p22corp.com",
        "photo": os.path.join(ASSETS_DIR, "staff", "eduardo-lopez.jpg")
    },
    {
        "slug": "marleni",
        "name": "Marleni Mendez",
        "title": "Controller & Compliance",
        "subtitle": "WAWF / Accounting Desk",
        "email": "mmendez@p22corp.com",
        "photo": os.path.join(ASSETS_DIR, "staff", "marleni-mendez.jpg")
    },
    {
        "slug": "bids",
        "name": "Gov Procurement Desk",
        "title": "Rapid RFQ & Solicitations",
        "subtitle": "24-Hour Bids Desk",
        "email": "bids@p22corp.com",
        "photo": None
    },
    {
        "slug": "logistics",
        "name": "Dallas Logistics Hub",
        "title": "Director of Supply Chain",
        "subtitle": "Material Fulfillment",
        "email": "logistics@p22corp.com",
        "photo": None
    }
]

for member in team_members:
    slug = member["slug"]
    work_dir = os.path.join(PASSES_DIR, f"temp_{slug}")
    os.makedirs(work_dir, exist_ok=True)

    create_image_assets(member["photo"], work_dir)

    pass_json = {
        "formatVersion": 1,
        "passTypeIdentifier": "pass.com.p22corp.card",
        "serialNumber": f"P22-{slug.upper()}-2026",
        "teamIdentifier": "169D8",
        "organizationName": "P-22 Corp Construction Material Solutions LLC",
        "description": f"P-22 Corp Digital Pass - {member['name']}",
        "foregroundColor": "rgb(255, 255, 255)",
        "backgroundColor": "rgb(29, 53, 87)",
        "labelColor": "rgb(201, 162, 39)",
        "logoText": "P-22 CORP",
        "barcode": {
            "format": "PKBarcodeFormatQR",
            "message": f"https://p22-digital-card.vercel.app/{slug}",
            "messageEncoding": "iso-8859-1",
            "altText": f"{member['name']} • CAGE 169D8"
        },
        "barcodes": [
            {
                "format": "PKBarcodeFormatQR",
                "message": f"https://p22-digital-card.vercel.app/{slug}",
                "messageEncoding": "iso-8859-1",
                "altText": f"{member['name']} • CAGE 169D8"
            }
        ],
        "generic": {
            "primaryFields": [
                {
                    "key": "name",
                    "label": "REPRESENTATIVE",
                    "value": member["name"]
                }
            ],
            "secondaryFields": [
                {
                    "key": "title",
                    "label": "OFFICIAL TITLE",
                    "value": member["title"]
                },
                {
                    "key": "cage",
                    "label": "CAGE CODE",
                    "value": "169D8"
                }
            ],
            "auxiliaryFields": [
                {
                    "key": "phone",
                    "label": "DIRECT PHONE",
                    "value": "1-888-722-2675"
                },
                {
                    "key": "email",
                    "label": "DIRECT EMAIL",
                    "value": member["email"]
                }
            ],
            "backFields": [
                {
                    "key": "company",
                    "label": "Company",
                    "value": "P-22 Corp Construction Material Solutions LLC"
                },
                {
                    "key": "cage",
                    "label": "CAGE Code",
                    "value": "169D8"
                },
                {
                    "key": "uei",
                    "label": "SAM.gov UEI",
                    "value": "X3HUQZ66P6N3"
                },
                {
                    "key": "hq",
                    "label": "Headquarters",
                    "value": "18383 Preston Rd, Suite 202, Dallas, TX 75252"
                },
                {
                    "key": "card_url",
                    "label": "Live Interactive Digital Card",
                    "value": f"https://p22-digital-card.vercel.app/{slug}"
                },
                {
                    "key": "disclaimer",
                    "label": "SBA Certification & Scope",
                    "value": "SBA Certified Small Minority-Owned Business. Commercial & Heavy Civil Construction Material Solutions across all 50 US States."
                }
            ]
        }
    }

    pass_json_path = os.path.join(work_dir, "pass.json")
    with open(pass_json_path, "w", encoding="utf-8") as f:
        json.dump(pass_json, f, indent=2)

    # Calculate manifest.json (SHA1 hash of all files)
    manifest = {}
    files_to_hash = ["pass.json", "icon.png", "icon@2x.png", "logo.png", "logo@2x.png", "thumbnail.png", "thumbnail@2x.png"]
    for filename in files_to_hash:
        filepath = os.path.join(work_dir, filename)
        with open(filepath, "rb") as f:
            manifest[filename] = hashlib.sha1(f.read()).hexdigest()

    manifest_json_path = os.path.join(work_dir, "manifest.json")
    manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")
    with open(manifest_json_path, "wb") as f:
        f.write(manifest_bytes)

    # Generate PKCS#7 signature of manifest.json
    sig_builder = pkcs7.PKCS7SignatureBuilder().set_data(manifest_bytes)
    sig_builder = sig_builder.add_signer(cert, key, hashes.SHA256())
    sig_bytes = sig_builder.sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature])

    sig_path = os.path.join(work_dir, "signature")
    with open(sig_path, "wb") as f:
        f.write(sig_bytes)

    # Package into .pkpass (ZIP format)
    pkpass_filename = f"{slug}.pkpass"
    pkpass_path = os.path.join(PASSES_DIR, pkpass_filename)
    with zipfile.ZipFile(pkpass_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in files_to_hash + ["manifest.json", "signature"]:
            zf.write(os.path.join(work_dir, f), arcname=f)

    # Clean up temp dir
    for f in os.listdir(work_dir):
        os.remove(os.path.join(work_dir, f))
    os.rmdir(work_dir)

    print(f"Generated {pkpass_path} ({os.path.getsize(pkpass_path)} bytes)")

print("All passes generated successfully!")
