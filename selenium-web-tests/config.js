import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const TESTS_DIR = __dirname;
export const REPORTS_DIR = path.join(__dirname, 'reports');
export const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

export const SERVER_PORT = 3000;
export const BASE_URL = `http://localhost:${SERVER_PORT}`;

export const BROWSER_CONFIG = {
  browserName: 'chrome', // 'chrome' or 'MicrosoftEdge'
  headless: true,
  windowSize: { width: 1280, height: 960 },
  pageLoadTimeout: 30000,
  scriptTimeout: 30000,
  implicitWaitTimeout: 10000,
};
