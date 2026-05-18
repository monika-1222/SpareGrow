const fs = require('fs');

const html = fs.readFileSync('test.html', 'utf8');
const configStr = html.split('tailwind.config = ')[1].split('</script>')[0].trim();
const config = new Function('return (' + configStr + ')')();
const theme = config.theme.extend;

let css = `@source "./screens";
@import "tailwindcss";

@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/container-queries";

@theme {
`;

for (const [k, v] of Object.entries(theme.colors)) {
    css += `  --color-${k}: ${v};\n`;
}

for (const [k, v] of Object.entries(theme.fontFamily)) {
    css += `  --font-${k}: "${v.join('", "')}", sans-serif;\n`;
}

if (theme.spacing) {
    for (const [k, v] of Object.entries(theme.spacing)) {
        css += `  --spacing-${k}: ${v};\n`;
    }
}

if (theme.fontSize) {
    for (const [k, v] of Object.entries(theme.fontSize)) {
        css += `  --text-${k}: ${v[0]};\n`;
        css += `  --text-${k}--line-height: ${v[1].lineHeight};\n`;
        if (v[1].letterSpacing) css += `  --text-${k}--letter-spacing: ${v[1].letterSpacing};\n`;
        if (v[1].fontWeight) css += `  --text-${k}--font-weight: ${v[1].fontWeight};\n`;
    }
}

css += `}

body {
  background-color: #f8faf7;
  font-family: 'Manrope', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.wealth-card-accent {
  border-left: 4px solid #C5A059;
}
`;

fs.writeFileSync('src/index.css', css);
console.log('Wrote src/index.css');
