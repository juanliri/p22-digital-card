import os
import re
import json

# 1. Update build_vcf.py
with open('build_vcf.py', 'r', encoding='utf-8') as f:
    c = f.read()

eduardo_block_start = c.find("'slug': 'eduardo'")
eduardo_block_end = c.find("'slug': 'marleni'")
if eduardo_block_start != -1 and eduardo_block_end != -1:
    block = c[eduardo_block_start:eduardo_block_end]
    block = block.replace("'directPhone': '1-945-218-5896'", "'directPhone': '1-407-369-9001'")
    block = block.replace("Direct: 1-945-218-5896", "Direct: 1-407-369-9001")
    c = c[:eduardo_block_start] + block + c[eduardo_block_end:]
    with open('build_vcf.py', 'w', encoding='utf-8') as f:
        f.write(c)
    print("[OK] build_vcf.py updated for Eduardo")

# 2. Run build_vcf.py to regenerate vCards and team.json
os.system("python build_vcf.py")

# Ensure assets/vcf/eduardo-lopez.vcf is also updated
if os.path.exists("assets/vcf/eduardo.vcf"):
    with open("assets/vcf/eduardo.vcf", "r", encoding="utf-8") as f:
        vcf_content = f.read()
    with open("assets/vcf/eduardo-lopez.vcf", "w", encoding="utf-8") as f:
        f.write(vcf_content)
    print("[OK] assets/vcf/eduardo-lopez.vcf synced")

# 3. Update eduardo.html action links (callAction, smsAction, whatsappAction)
with open('eduardo.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(
    r'<a id="callAction" href="tel:[^"]*"',
    '<a id="callAction" href="tel:14073699001"',
    c
)
c = re.sub(
    r'<a id="smsAction" href="sms:[^"]*"',
    '<a id="smsAction" href="sms:14073699001"',
    c
)
c = re.sub(
    r'<a id="whatsappAction" href="https://wa\.me/[^"]*"',
    '<a id="whatsappAction" href="https://wa.me/14073699001"',
    c
)

with open('eduardo.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("[OK] eduardo.html action buttons updated with 14073699001")

# 4. Update TEAM_DATA in all 6 public card pages
files = ['index.html', 'pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html']
for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    
    edu_match = re.search(r'("eduardo":\s*\{[^}]*?"directPhone":\s*)"1-945-218-5896"', content, re.DOTALL)
    if edu_match:
        content = content[:edu_match.start(1)] + edu_match.group(1) + '"1-407-369-9001"' + content[edu_match.end():]
    
    edu_idx = content.find('"slug": "eduardo"')
    if edu_idx != -1:
        marleni_idx = content.find('"slug": "marleni"', edu_idx)
        if marleni_idx != -1:
            edu_sub = content[edu_idx:marleni_idx]
            edu_sub = edu_sub.replace("1-945-218-5896", "1-407-369-9001")
            content = content[:edu_idx] + edu_sub + content[marleni_idx:]

    with open(fn, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[OK] {fn} TEAM_DATA updated with Eduardo's direct phone")

# 5. Update badge-eduardo.html
with open('badge-eduardo.html', 'r', encoding='utf-8') as f:
    b_content = f.read()

b_content = re.sub(r'<a id="phoneLink" href="tel:[^"]*"', '<a id="phoneLink" href="tel:14073699001"', b_content)
b_content = re.sub(r'<span id="staffPhone"[^>]*>.*?</span>', '<span id="staffPhone" class="font-mono text-[11px]">(407) 369-9001</span>', b_content)
b_content = re.sub(r'href="/pedro"', 'href="/eduardo"', b_content)
b_content = re.sub(r'href="mailto:pfelipe@p22corp\.com"', 'href="mailto:elopez@p22corp.com"', b_content)
b_content = b_content.replace('pfelipe@p22corp.com', 'elopez@p22corp.com')
b_content = b_content.replace('1-888-722-2675', '(407) 369-9001')

with open('badge-eduardo.html', 'w', encoding='utf-8') as f:
    f.write(b_content)
print("[OK] badge-eduardo.html updated")

# 6. Update setup.html
with open('setup.html', 'r', encoding='utf-8') as f:
    s_content = f.read()

s_edu_idx = s_content.find('eduardo: {')
if s_edu_idx != -1:
    s_marleni_idx = s_content.find('marleni: {', s_edu_idx)
    if s_marleni_idx != -1:
        s_block = s_content[s_edu_idx:s_marleni_idx]
        s_block = s_block.replace('1-945-218-5896', '1-407-369-9001')
        s_content = s_content[:s_edu_idx] + s_block + s_content[s_marleni_idx:]

with open('setup.html', 'w', encoding='utf-8') as f:
    f.write(s_content)
print("[OK] setup.html updated")
