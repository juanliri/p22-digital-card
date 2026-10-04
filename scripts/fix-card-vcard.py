import os
import re

files = ['pedro.html', 'eduardo.html', 'marleni.html', 'bids.html', 'logistics.html', 'index.html']

old_block_pattern = re.compile(
    r'(\s*// 2\. Mobile Safari Native Contacts on iOS:.*?'
    r'if\s*\(\s*isIOS\s*\)\s*\{)'
    r'(\s*showIosContactGuidanceToast\(\);'
    r'\s*setTimeout\(\(\)\s*=>\s*\{'
    r'\s*window\.location\.href\s*=\s*staticVcfUrl;'
    r'\s*\}, \d+\);'
    r'\s*revealStep2Exchange\(false,\s*[\'"][^\'"]+[\'"]\);'
    r'\s*trackEvent\([\'"]VCard[\'"],\s*[\'"]DirectNavIOS[\'"],\s*rep\.name\);'
    r'\s*return;'
    r'\s*\})',
    re.DOTALL
)

for fn in files:
    if not os.path.exists(fn):
        print(f"File not found: {fn}")
        continue
    
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if target exists
    if 'showIosContactGuidanceToast();' in content:
        # Replacement that navigates synchronously without setTimeout delay
        new_ios_block = """      // 2. Mobile Safari Native Contacts on iOS:
      // Immediate synchronous navigation preserves active user-gesture token
      if (isIOS) {
        window.location.href = staticVcfUrl;
        revealStep2Exchange(false, 'Contact Saved ✓');
        trackEvent('VCard', 'DirectNavIOS', rep.name);
        return;
      }"""
        
        # Replace the setTimeout block
        sub_content = re.sub(
            r'showIosContactGuidanceToast\(\);\s*setTimeout\(\(\)\s*=>\s*\{\s*window\.location\.href\s*=\s*staticVcfUrl;\s*\}, \d+\);',
            'window.location.href = staticVcfUrl;',
            content
        )
        
        with open(fn, 'w', encoding='utf-8') as out:
            out.write(sub_content)
        print(f"Successfully updated {fn} (removed setTimeout for iOS vCard)")
    else:
        print(f"No setTimeout found in {fn}")
