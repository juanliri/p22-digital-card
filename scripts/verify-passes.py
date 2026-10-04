import zipfile, glob, json

for p in sorted(glob.glob('assets/passes/*.pkpass')):
    with zipfile.ZipFile(p, 'r') as z:
        namelist = z.namelist()
        pass_json = {}
        if 'pass.json' in namelist:
            pass_json = json.loads(z.read('pass.json').decode('utf-8'))
        print(f"\nPass: {p}")
        print(f"  Files inside zip ({len(namelist)}): {namelist}")
        print(f"  passTypeIdentifier: {pass_json.get('passTypeIdentifier')}")
        print(f"  description: {pass_json.get('description')}")
        print(f"  organizationName: {pass_json.get('organizationName')}")
        print(f"  backgroundColor: {pass_json.get('backgroundColor')}")
        print(f"  barcode: {pass_json.get('barcode')}")
        if 'generic' in pass_json:
            for ftype in ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields']:
                fields = pass_json['generic'].get(ftype, [])
                field_strs = [f"{f.get('key')}='{f.get('value')}'" for f in fields]
                print(f"  {ftype}: {field_strs}")
