import glob
import re
import os

html_files = glob.glob('**/*.html', recursive=True)
html_files = [f for f in html_files if not f.startswith('node_modules') and not f.startswith('.next')]

for f in html_files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    
    modified = False
    
    # 1. Ensure viewport-fit=cover
    if 'viewport-fit=cover' not in content:
        if 'name="viewport"' in content or "name='viewport'" in content:
            def repl_vp(m):
                tag = m.group(0)
                if 'viewport-fit=cover' not in tag:
                    tag = re.sub(r'content=["\']([^"\']+)["\']', r'content="\1, viewport-fit=cover"', tag)
                return tag
            content = re.sub(r'<meta\s+name=["\']viewport["\'][^>]*>', repl_vp, content, flags=re.IGNORECASE)
            modified = True
            print(f, 'Added viewport-fit=cover')

    # 2. Ensure apple-mobile-web-app-capable
    if 'apple-mobile-web-app-capable' not in content:
        meta_tags = """  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
"""
        if '<head>' in content:
            content = content.replace('<head>', '<head>\n' + meta_tags, 1)
            modified = True
            print(f, 'Added apple-mobile-web-app-capable')
            
    if modified:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(content)

print('All HTML files verified and updated.')
