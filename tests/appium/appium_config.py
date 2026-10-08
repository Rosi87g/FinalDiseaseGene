"""
Appium Mobile Testing Configuration & Desired Capabilities
Target: Android Mobile Application (Capacitor / Native Android APK for FinalDiseaseGene)
"""

APPIUM_SERVER_URL = "http://127.0.0.1:4723/wd/hub"

ANDROID_CAPABILITIES = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": "Android Emulator / Pixel_6_API_33",
    "app": "frontend/android/app/build/outputs/apk/debug/app-debug.apk",
    "appPackage": "com.getcapacitor.myapp",
    "appActivity": "com.getcapacitor.myapp.MainActivity",
    "noReset": False,
    "fullReset": False,
    "newCommandTimeout": 300,
    "autoGrantPermissions": True,
    "chromedriverExecutableDir": "./chromedriver"
}

TEST_DEVICES = [
    {"name": "Pixel 6 Pro", "resolution": "1440x3120", "density": "560dpi", "androidVersion": "13.0"},
    {"name": "Samsung Galaxy S22", "resolution": "1080x2340", "density": "420dpi", "androidVersion": "12.0"},
    {"name": "Pixel 4 Tablet", "resolution": "1600x2560", "density": "320dpi", "androidVersion": "11.0"}
]
