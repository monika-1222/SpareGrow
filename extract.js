import fs from 'fs';
import https from 'https';
import path from 'path';

const outputTxtPath = "C:/Users/monika/.gemini/antigravity/brain/630381ed-d0c8-4b20-8743-818e01db9e3e/.system_generated/steps/13/output.txt";

const data = JSON.parse(fs.readFileSync(outputTxtPath, 'utf8'));

const screensDir = path.join(import.meta.dirname, 'src', 'screens');
if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
}

function download(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}

async function processScreens() {
    let tailwindConfigExtracted = false;
    const screens = data.screens;

    // We will also generate an index of screens for easy routing
    const screenIndex = [];

    for (const screen of screens) {
        const title = screen.title.replace(/[^a-zA-Z0-9]/g, '');
        const id = screen.name.split('/').pop();
        const filename = `${title}_${id}.html`;

        console.log(`Downloading ${filename}...`);
        const html = await download(screen.htmlCode.downloadUrl);

        if (!tailwindConfigExtracted) {
            const configMatch = html.match(/tailwind\.config = (\{[\s\S]*?\});/);
            if (configMatch) {
                const configStr = configMatch[1];
                const tailwindConfig = `/** @type {import('tailwindcss').Config} */\nexport default ${configStr};\nexport const content = ["./index.html", "./src/**/*.{js,ts,jsx,tsx,html}"];\nexport const plugins = [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')];`;
                fs.writeFileSync(path.join(import.meta.dirname, 'tailwind.config.js'), tailwindConfig);
                tailwindConfigExtracted = true;
                console.log("Extracted Tailwind Config.");
            }
        }

        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        let bodyContent = bodyMatch ? bodyMatch[1] : html;
        bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

        fs.writeFileSync(path.join(screensDir, filename), bodyContent);
        console.log(`Saved ${filename}`);

        screenIndex.push({ id, title, filename });
    }

    fs.writeFileSync(path.join(screensDir, 'index.json'), JSON.stringify(screenIndex, null, 2));
    console.log("Done extracting screens.");
}

processScreens().catch(console.error);