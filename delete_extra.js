import fs from 'fs';
import path from 'path';

const screensDir = path.join(import.meta.dirname, 'src', 'screens');
const indexPath = path.join(screensDir, 'index.json');

const filesToKeep = [
    'SplashScreen_b37f5eee45654168824003cd0baf2abc.html',
    'Login_7b98119117794e4a97e4c84627fe9615.html',
    'SignUp_269b2120f5b24d358d9b93ef54b498c3.html',
    'WalletOverview_5609f92e5e924a72a75b627360229f5f.html',
    'GoalsDashboard_d2c4550afb8042819ff8ba97840a52bf.html',
    'TransactionHistory_f88ed653be0e4a189aa4a4ff33200138.html',
    'FundDiscovery_51b394d0132a49678292c68d6f05e315.html',
    'ProfileSettings_dbb3792156614cb5ae492572ff792679.html',
    'CreateGoal_482d0dbe0cdc4c869fdca13c8c94d606.html'
];

const keptScreens = [
    { title: 'SplashScreen', filename: 'SplashScreen_b37f5eee45654168824003cd0baf2abc.html' },
    { title: 'Login', filename: 'Login_7b98119117794e4a97e4c84627fe9615.html' },
    { title: 'SignUp', filename: 'SignUp_269b2120f5b24d358d9b93ef54b498c3.html' },
    { title: 'WalletOverview', filename: 'WalletOverview_5609f92e5e924a72a75b627360229f5f.html' },
    { title: 'GoalsDashboard', filename: 'GoalsDashboard_d2c4550afb8042819ff8ba97840a52bf.html' },
    { title: 'TransactionHistory', filename: 'TransactionHistory_f88ed653be0e4a189aa4a4ff33200138.html' },
    { title: 'FundDiscovery', filename: 'FundDiscovery_51b394d0132a49678292c68d6f05e315.html' },
    { title: 'ProfileSettings', filename: 'ProfileSettings_dbb3792156614cb5ae492572ff792679.html' },
    { title: 'CreateGoal', filename: 'CreateGoal_482d0dbe0cdc4c869fdca13c8c94d606.html' }
];

const files = fs.readdirSync(screensDir);
let deletedCount = 0;
for (const file of files) {
    if (file.endsWith('.html') && !filesToKeep.includes(file)) {
        fs.unlinkSync(path.join(screensDir, file));
        deletedCount++;
    }
}

fs.writeFileSync(indexPath, JSON.stringify(keptScreens, null, 2));

console.log(`Force cleanup complete. Deleted ${deletedCount} unwanted HTML files. Kept ${filesToKeep.length} files.`);
