/**
 * sast_scanner.js
 * ================
 * Static Application Security Testing (SAST) Scanner for SpareGrow
 * Scans JavaScript, HTML, SQL, and configuration files for vulnerabilities.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const RULES = [
  {
    id: 'SAST-001',
    name: 'Hardcoded High-Entropy Secrets / Private Keys',
    severity: 'High',
    pattern: /(?:service_role|private_key|aws_secret_access_key|secret_key)\s*[:=]\s*['"][a-zA-Z0-9_/+=-]{20,}['"]/i,
    remediation: 'Move private keys to environment variables and do not commit to source control.'
  },
  {
    id: 'SAST-002',
    name: 'Dangerous DOM Sinks / Raw innerHTML Usage',
    severity: 'Medium',
    pattern: /\.innerHTML\s*=\s*(?!['"`][^$]*['"`])[^;]+/i,
    remediation: 'Sanitize user-controlled input or use textContent to avoid XSS.'
  },
  {
    id: 'SAST-003',
    name: 'Row Level Security (RLS) Verification',
    severity: 'High',
    pattern: /CREATE\s+TABLE\s+([a-zA-Z0-9_]+)/gi,
    check: (sqlContent) => {
      const tables = [];
      const regex = /CREATE\s+TABLE\s+([a-zA-Z0-9_]+)/gi;
      let match;
      while ((match = regex.exec(sqlContent)) !== null) {
        tables.push(match[1]);
      }
      const missingRLS = [];
      for (const t of tables) {
        if (!sqlContent.includes(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`)) {
          missingRLS.push(t);
        }
      }
      return missingRLS;
    }
  },
  {
    id: 'SAST-004',
    name: 'Insecure eval() or Function Constructor Usage',
    severity: 'Critical',
    pattern: /\b(?:eval|Function)\s*\([^)]+\)/i,
    remediation: 'Avoid eval() and dynamic code execution.'
  },
  {
    id: 'SAST-005',
    name: 'Unvalidated window.location Redirects',
    severity: 'Medium',
    pattern: /window\.location\.href\s*=\s*(?!['"`#\/])[^;]+/i,
    remediation: 'Validate destination URLs against an allowlist before redirecting.'
  }
];

export async function runSASTScan() {
  console.log('======================================================================');
  console.log('  🔍  RUNNING STATIC APPLICATION SECURITY TESTING (SAST) SCAN');
  console.log('======================================================================');

  const findings = [];
  const scannedFiles = [];

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (['node_modules', '.git', 'dist', 'reports'].includes(file)) continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(js|html|sql|json|env)$/i.test(file)) {
        scannedFiles.push(fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Check rules
        for (const rule of RULES) {
          if (rule.pattern && rule.pattern.test(content)) {
            findings.push({
              ruleId: rule.id,
              ruleName: rule.name,
              severity: rule.severity,
              file: path.relative(rootDir, fullPath),
              remediation: rule.remediation
            });
          }
          if (rule.check && file.endsWith('.sql')) {
            const missing = rule.check(content);
            if (missing.length > 0) {
              findings.push({
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                file: path.relative(rootDir, fullPath),
                remediation: `Enable RLS on tables: ${missing.join(', ')}`
              });
            }
          }
        }
      }
    }
  }

  scanDir(rootDir);

  console.log(`[SAST] Scanned ${scannedFiles.length} files across repository.`);
  console.log(`[SAST] Detected ${findings.length} findings.`);
  if (findings.length === 0) {
    console.log('  ✅  SAST SCAN PASSED: Zero Critical or High vulnerabilities detected.');
  } else {
    findings.forEach(f => {
      console.log(`  • [${f.severity}] ${f.ruleName} in ${f.file}`);
    });
  }
  return { scannedFilesCount: scannedFiles.length, findings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSASTScan();
}
