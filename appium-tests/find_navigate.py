import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

screen_dir = 'c:/Users/monika/SpareGrow/src/screens'
screens = {}
for f in sorted(os.listdir(screen_dir)):
    if f.endswith('.html'):
        content = open(os.path.join(screen_dir, f), encoding='utf-8', errors='ignore').read()
        ids = re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', content)
        inputs = re.findall(r'<input[^>]+id=["\']([a-zA-Z0-9_\-]+)["\']', content)
        clicks = re.findall(r'onclick=["\']([^"\']+)["\']', content)
        screens[f] = {
            'ids': list(dict.fromkeys(ids))[:15],
            'inputs': list(dict.fromkeys(inputs)),
            'onclick_count': len(clicks)
        }

for name, info in screens.items():
    print(f"\n=== {name} ===")
    print(f"  inputs:  {info['inputs']}")
    print(f"  ids:     {info['ids']}")
    print(f"  onclick: {info['onclick_count']}")
