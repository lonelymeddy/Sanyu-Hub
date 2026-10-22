# SanyuHub Android Application — Build & Installation Guide

This document outlines the requirements and procedures for opening, compiling, configuring, and installing the **sanyuhub** Android application.

---

## 1. Environment & Tools Requirements

To build the project locally or in CI/CD, ensure you have the following installed:

* **Android Studio**: Android Studio Jellyfish (2023.3.1) or newer recommended.
* **JDK**: JDK 17 or JDK 21 (configured as the Gradle JVM in Android Studio settings).
* **Android SDK**:
  * **Compile SDK**: 34 (Android 14)
  * **Min SDK**: 24 (Android 7.0)
  * **Target SDK**: 34
  * **SDK Build-Tools**: 34.0.0
* **Gradle**: Gradle 8.8 (configured via Gradle wrapper or system Gradle).

---

## 2. Opening the Project in Android Studio

1. Launch **Android Studio**.
2. Select **Open** and choose the `android/` directory inside this repository (`/path/to/sanyu-hub/android`).
3. Allow Android Studio to import the project and sync Gradle dependencies automatically.

---

## 3. Building the Debug APK

### Using Command Line (Terminal)

Navigate to the `android/` directory and run:

```bash
cd android
gradle assembleDebug
```

*(Or `./gradlew assembleDebug` if using wrapper scripts on your system)*

### Output Location

Upon successful completion, the generated debug APK is located at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. Installing the APK on an Android Device

### Option A: Via ADB (Android Debug Bridge)

1. Enable **Developer Options** and **USB Debugging** on your Android mobile device.
2. Connect the phone via USB.
3. Run:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Direct Installation

1. Copy `app-debug.apk` directly to your Android device (via storage, Drive, or email).
2. Open the file on the phone and select **Install** (allow "Install from Unknown Sources" if prompted).

---

## 5. Building a Signed Release APK / Android App Bundle (AAB)

### Generating a KeyStore

If you do not already have a release signing key, create one:

```bash
keytool -genkey -v -keystore sanyuhub-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sanyuhub
```

### Configuring Signing in Gradle

Add your release signing configuration in `android/app/build.gradle` (or via environment variables/`gradle.properties`):

```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file("path/to/sanyuhub-release-key.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "sanyuhub"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Building the Release APK or AAB

```bash
cd android
# Build Release APK
gradle assembleRelease

# Build Google Play Android App Bundle (AAB)
gradle bundleRelease
```

Output locations:
* **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`
* **Release Bundle**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 6. Project Architecture & Web Integration

The Android application is built as a native Android project hosting an optimized `WebView` container (`MainActivity.java`).

* **Application ID**: `ug.sanyuhub.app`
* **App Name**: `sanyuhub`
* **Target Production URL**: `https://sanyuhub.onrender.com` (can be customized dynamically via Intent string extra `APP_URL`).
* **Media Playback**: Configured with hardware acceleration, `WebChromeClient` custom view handlers for full-screen HTML5 video (HLS / MP4), custom Back-button stack navigation, and Swipe-to-Refresh.
* **Branding Assets**: Adaptive launcher icons and vector drawables derived directly from the official SanyuHub logo (`file_00000000027081fa85b9c7fb563cd10a.png`).

---

## 7. Future Website Updates & Application Maintenance

Since the Android application directly renders the production SanyuHub web platform using native WebView acceleration:

1. **Content & UI Updates**: Any update deployed to the SanyuHub web backend/frontend is reflected instantly in the Android application without requiring an APK re-compilation or app store update.
2. **Native Asset Updates**: When changing launcher icons, app permissions, or native configurations, re-run `gradle assembleDebug` / `gradle assembleRelease` and increment `versionCode` and `versionName` in `android/app/build.gradle`.
