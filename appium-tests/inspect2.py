import re

content = open('../src/screens/LinkUPI_6.html', encoding='utf-8', errors='ignore').read()

# Show around key elements
for elem_id in ['inputState', 'successState', 'upi-id']:
    idx = content.find(f'id="{elem_id}"')
    if idx == -1:
        idx = content.find(f"id='{elem_id}'")
    if idx >= 0:
        print(f"\n=== {elem_id} ===")
        print(content[max(0,idx-80):idx+300])

# Show window.navigate if present
if 'window.navigate' in content:
    idx = content.find('window.navigate')
    print("\n=== window.navigate ===")
    print(content[max(0,idx-100):idx+200])
