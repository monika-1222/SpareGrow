/**
 * config.js
 * =========
 * Appium Mobile Automation Configuration for SpareGrow (Node.js / WebDriverIO)
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const APK_PATH = path.join(ROOT_DIR, 'SpareGrow.apk');
export const REPORTS_DIR = path.join(__dirname, 'reports');
export const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

export const APPIUM_HOST = '127.0.0.1';
export const APPIUM_PORT = 4723;

export const ANDROID_CAPABILITIES = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android Emulator',
  'appium:app': APK_PATH,
  'appium:appPackage': 'com.sparegrow.app',
  'appium:appActivity': 'com.sparegrow.app.MainActivity',
  'appium:noReset': false,
  'appium:fullReset': false,
  'appium:newCommandTimeout': 300,
  'appium:autoGrantPermissions': true,
  'appium:chromedriverAutodownload': true,
  'appium:ensureWebviewsHavePages': true,
};

export const WDIO_OPTIONS = {
  protocol: 'http',
  hostname: APPIUM_HOST,
  port: APPIUM_PORT,
  path: '/',
  capabilities: ANDROID_CAPABILITIES,
  logLevel: 'warn',
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,
};
