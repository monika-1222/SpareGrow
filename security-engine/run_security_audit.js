/**
 * run_security_audit.js
 * =====================
 * Master DevSecOps & Security Assessment Orchestrator
 */

import { runSASTScan } from './sast_scanner.js';
import { runDASTScan } from './dast_scanner.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMasterAudit() {
  console.log('======================================================================');
  console.log('  🛡️  SPAREGROW FULL-SPECTRUM APPLICATION SECURITY ASSESSMENT');
  console.log('======================================================================');
  console.log('  Standard: OWASP Top 10 (2021) • API Security Top 10 • NIST SP 800-53');
  console.log('  Target  : SpareGrow Micro-Savings & Compounding App');
  console.log('======================================================================\n');

  // Step 1: SAST
  await runSASTScan();

  console.log('\n----------------------------------------------------------------------\n');

  // Step 2: DAST
  await runDASTScan();

  console.log('\n----------------------------------------------------------------------\n');

  // Step 3: Generate Excel & Markdown Reports
  console.log('Generating Excel Workbooks & Markdown Documentation...');
  execSync(`node "${path.join(__dirname, 'generate_all_reports.js')}"`, { stdio: 'inherit' });

  console.log('\n======================================================================');
  console.log('  🏆  SECURITY AUDIT COMPLETED WITH EXCELLENCE');
  console.log('======================================================================');
}

runMasterAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
