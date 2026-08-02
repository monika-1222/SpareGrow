import os, re, sys

screens = {
    'LinkBank': '../src/screens/LinkBank.html',
    'CreateGoal': '../src/screens/CreateGoal_482d0dbe0cdc4c869fdca13c8c94d606.html',
    'WalletOverview': '../src/screens/WalletOverview_5609f92e5e924a72a75b627360229f5f.html',
    'FundDiscovery': '../src/screens/FundDiscovery_51b394d0132a49678292c68d6f05e315.html',
    'InvestmentDetail': '../src/screens/InvestmentDetail_5.html',
    'WealthSimulator': '../src/screens/WealthSimulator.html',
    'LinkUPI': '../src/screens/LinkUPI_6.html',
    'AutoInvestSetup': '../src/screens/AutoInvestSetup.html',
    'GoalsDashboard': '../src/screens/GoalsDashboard_d2c4550afb8042819ff8ba97840a52bf.html',
    'ProfileSettings': '../src/screens/ProfileSettings_dbb3792156614cb5ae492572ff792679.html',
    'TransactionHistory': '../src/screens/TransactionHistory_f88ed653be0e4a189aa4a4ff33200138.html',
    'PaymentUPI': '../src/screens/PaymentUPI_7.html',
}

script_dir = os.path.dirname(os.path.abspath(__file__))
for name, rel_path in screens.items():
    path = os.path.join(script_dir, rel_path)
    try:
        content = open(path, encoding='utf-8', errors='ignore').read()
        ids = re.findall(r'id=["\']([\w-]+)["\']', content)
        btn_texts = re.findall(r'<button[^>]*>([^<]{1,50})', content)
        print(f"=== {name} ===")
        print(f"  IDs: {ids[:20]}")
        print(f"  Buttons: {[b.strip() for b in btn_texts[:10]]}")
        print()
    except Exception as e:
        print(f"{name}: ERROR {e}")
