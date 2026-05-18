const fs = require('fs');
const path = require('path');
const screensDir = path.join(process.cwd(), 'src/screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));
files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/src="https:\/\/lh3\.googleusercontent\.com\/aida\/[^"]+"/g, 'src="/logo.png"');
    fs.writeFileSync(filePath, content);
});
console.log('Fixed images!');
