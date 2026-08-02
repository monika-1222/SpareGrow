import os

# Root and SDK Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APK_PATH = os.path.join(ROOT_DIR, "SpareGrow.apk")
ANDROID_SDK = os.environ.get("ANDROID_HOME", r"C:\Users\monika\AppData\Local\Android\Sdk")
os.environ["ANDROID_HOME"] = ANDROID_SDK
os.environ["ANDROID_SDK_ROOT"] = ANDROID_SDK

# Appium Server Configuration
APPIUM_HOST = "127.0.0.1"
APPIUM_PORT = 4723
APPIUM_URL = f"http://{APPIUM_HOST}:{APPIUM_PORT}"

# Emulator Name
EMULATOR_NAME = "Pixel_5"

# Appium Capabilities for SpareGrow (Capacitor App)
CAPABILITIES = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": "Android Emulator",
    "app": APK_PATH,
    "appPackage": "com.sparegrow.app",
    "appActivity": "com.sparegrow.app.MainActivity",
    "newCommandTimeout": 300,
    "autoGrantPermissions": True,
    "gpsEnabled": True,
    "ensureWebviewsHavePages": True,
    "nativeWebScreenshot": True,
    # Increase timeouts for slow/warm emulators
    "uiautomator2ServerLaunchTimeout": 120000,
    "uiautomator2ServerInstallTimeout": 120000,
    "androidDeviceReadyTimeout": 120,
    "adbExecTimeout": 60000,
}
