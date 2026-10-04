"""
Fixes Safe Area Padding across all badges and public cards to prevent camera cutout,
Dynamic Island, and status bar collision on iOS & Android.
"""
import os, re, glob

safe_area_css = """    /* Standalone PWA Safe Areas: Guarantees generous breathing room below Dynamic Island, camera notch, & home bar */
    body {
      padding-top: calc(env(safe-area-inset-top, 44px) + 1.25rem) !important;
      padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 1.5rem) !important;
      padding-left: calc(env(safe-area-inset-left, 0px) + 0.75rem) !important;
      padding-right: calc(env(safe-area-inset-right, 0px) + 0.75rem) !important;
    }"""

badge_files = glob.glob("badge*.html")
card_files = ["index.html", "pedro.html", "eduardo.html", "marleni.html", "bids.html", "logistics.html"]

all_files = list(set(badge_files + card_files))

for fn in all_files:
    if not os.path.exists(fn):
        continue
    with open(fn, "r", encoding="utf-8") as f:
        content = f.read()

    # If the file already has a body safe-area style block:
    old_style_pat = r'/\*\s*iOS & Android Standalone Native Safe Areas\s*\*/\s*body\s*\{[^}]*\}'
    if re.search(old_style_pat, content):
        content = re.sub(old_style_pat, safe_area_css.strip(), content)
        print(f"[+] Replaced existing safe area style in {fn}")
    elif "</head>" in content:
        # Inject style before </head>
        inject = f"  <style>\n{safe_area_css}\n  </style>\n</head>"
        content = content.replace("</head>", inject, 1)
        print(f"[+] Injected safe area style before </head> in {fn}")

    with open(fn, "w", encoding="utf-8") as f:
        f.write(content)

print("[✓] All badges and cards updated with iPhone Dynamic Island & notch safe padding!")
