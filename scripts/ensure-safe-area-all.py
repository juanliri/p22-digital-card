import glob

css_rule = """
    /* iOS & Android Safe Area Insets for Edge-to-Edge Standalone */
    @supports (padding-top: env(safe-area-inset-top)) {
      body {
        padding-top: max(0.5rem, env(safe-area-inset-top));
        padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        padding-left: max(0.5rem, env(safe-area-inset-left));
        padding-right: max(0.5rem, env(safe-area-inset-right));
      }
    }
"""

for f in sorted(glob.glob('*.html')):
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    if 'safe-area-inset-top' not in c:
        if '</style>' in c:
            c = c.replace('</style>', css_rule + '\n    </style>', 1)
        elif '</head>' in c:
            c = c.replace('</head>', f'<style>{css_rule}</style>\n</head>', 1)
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(c)
        print(f'Added safe-area CSS to {f}')
    else:
        print(f'Already has safe-area CSS: {f}')
