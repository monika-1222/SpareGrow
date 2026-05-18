import fs from 'fs';
import path from 'path';

const screensDir = path.join(import.meta.dirname, 'src', 'screens');
const indexPath = path.join(screensDir, 'index.json');

const screensToKeep = [
    'SplashScreen',
    'Login',
    'SignUp',
    'WalletOverview',
    'GoalsDashboard',
    'TransactionHistory',
    'FundDiscovery',
    'ProfileSettings',
    'CreateGoal'
];

if (fs.existsSync(indexPath)) {
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const keptScreens = [];
    const keptTitles = new Set();
    const keptFilenames = new Set();

    for (const screen of data) {
        if (screensToKeep.includes(screen.title) && !keptTitles.has(screen.title)) {
            keptScreens.push(screen);
            keptTitles.add(screen.title);
            keptFilenames.add(screen.filename);
        }
    }

    // Now delete HTML files that are not in keptFilenames
    const files = fs.readdirSync(screensDir);
    let deletedCount = 0;
    for (const file of files) {
        if (file.endsWith('.html') && !keptFilenames.has(file)) {
            fs.unlinkSync(path.join(screensDir, file));
            deletedCount++;
        }
    }

    // Write back index.json
    fs.writeFileSync(indexPath, JSON.stringify(keptScreens, null, 2));

    console.log(`Cleanup complete. Kept ${keptScreens.length} screens. Deleted ${deletedCount} unwanted HTML files.`);
} else {
    console.log('index.json not found');
}
