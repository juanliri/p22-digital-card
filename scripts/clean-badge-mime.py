"""
Clean vCard MIME type in all badge files to ensure Android Web Share API Level 2 accepts the file.
"""
import glob

badge_files = glob.glob("badge*.html")

for fn in badge_files:
    with open(fn, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False
    if "type: 'text/vcard;charset=utf-8'" in content:
        content = content.replace("type: 'text/vcard;charset=utf-8'", "type: 'text/vcard'")
        changed = True
    if "type: 'text/vcard;charset=utf-8;'" in content:
        content = content.replace("type: 'text/vcard;charset=utf-8;'", "type: 'text/vcard'")
        changed = True

    if changed:
        with open(fn, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[+] Cleaned MIME type in {fn}")

print("Done cleaning badge MIME types.")
