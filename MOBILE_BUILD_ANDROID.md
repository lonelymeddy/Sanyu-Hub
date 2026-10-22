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

## 7. Android Permissions & Rationale

The application requests only the minimal necessary permissions required for media streaming, web browsing, and system notification alerts:

* **`android.permission.INTERNET`**: Required to load SanyuHub web pages, media manifests, APIs, and video streams.
* **`android.permission.ACCESS_NETWORK_STATE`**: Allows detecting network connectivity status to gracefully handle network transitions and offline scenarios.
* **`android.permission.WAKE_LOCK`**: Keeps the screen active during HTML5 video and audio playback.
* **`android.permission.POST_NOTIFICATIONS`**: Required on Android 13+ (API level 33+) to display system notifications for new releases, live TV events, and announcements.
* **`android.permission.VIBRATE`**: Enables tactile haptic feedback during notification deliveries.

*Sensitive permissions (e.g., location, contacts, camera, microphone, SMS) are strictly avoided.*

---

## 8. Notification Architecture & Web Integration

### Notification Channel Infrastructure
* **Channel ID**: `sanyuhub_announcements`
* **Channel Name**: `SanyuHub Announcements`
* **Description**: Notifications for new movies, series, live TV events, and platform updates.
* **Default Importance**: `IMPORTANCE_DEFAULT` with system launcher badges and vibration.

### Android 13+ (API 33+) Permission Handling
* Notification permissions are requested contextually when the user interacts with notification settings or enables updates (e.g., in `settings-app.html`).
* Denying notification permission does not block app usage, web navigation, or video playback.
* Native App Notification Settings can be accessed directly from the in-app preferences page (`settings-app.html`) via `NotificationHelper.openNotificationSettings()`.

### Native JavaScript Bridge (`window.SanyuHubNative`)
The WebView injects a safe JavaScript interface `window.SanyuHubNative` providing:
* `isAndroidApp()`: Returns `true` when running inside the Android app wrapper.
* `isNotificationPermissionGranted()`: Returns `true` if system notifications are enabled.
* `requestNotificationPermission()`: Triggers the native Android 13+ permission dialog.
* `openNotificationSettings()`: Opens the system notification settings page for SanyuHub.
* `postNotification(title, message, targetUrl)`: Displays a local notification that deep-links directly to an internal SanyuHub route when tapped.

### Deep Linking & Notification Taps
* Tapping a notification launches or resumes `MainActivity` with the target route (e.g., `/movies`, `/series`, `/live-tv/watch/galaxy-tv`).
* All notification URLs are strictly validated to ensure navigation remains inside authorized SanyuHub domains (`sanyuhub.onrender.com`, `localhost`, or relative paths).

---

## 9. Testing Notifications

### A. Testing via JavaScript Console (In-App)
When running the Android application, execute in the WebView DevTools console:

```javascript
if (window.SanyuHubNative) {
  // Request notification permission
  window.SanyuHubNative.requestNotificationPermission();

  // Post a test notification with deep link
  window.SanyuHubNative.postNotification("New Movie Added!", "Watch the latest release on SanyuHub now.", "/movies");
}
```

### B. Testing via App Preferences
1. Open the Android application and navigate to **More > Preferences** (`/settings-app`).
2. The **Push Notifications** card will automatically appear when running inside the native Android app.
3. Tap **Enable Notifications** or **Notification Settings** to test permission requests and settings navigation.

---

## 10. Firebase Cloud Messaging (FCM) Integration Guide

If remote push notifications are added to the backend in the future:

1. **Firebase Project Setup**:
   * Create a Firebase Project in the [Firebase Console](https://console.firebase.google.com/).
   * Register the Android App with Package Name `ug.sanyuhub.app`.
   * Download `google-services.json` and place it in `android/app/google-services.json`.

2. **Gradle Dependency Setup**:
   * Add `com.google.gms:google-services` plugin to `android/build.gradle` and `android/app/build.gradle`.
   * Add dependency `implementation 'com.google.firebase:firebase-messaging:23.4.0'`.

3. **Service Implementation**:
   * Create `FirebaseMessagingService` subclass in `ug.sanyuhub.app`.
   * In `onMessageReceived(RemoteMessage message)`, pass payload data to `NotificationHelper.showNotification(context, title, body, targetUrl)`.

---

## 11. Future Website Updates & Application Maintenance

Since the Android application directly renders the production SanyuHub web platform using native WebView acceleration:

1. **Content & UI Updates**: Any update deployed to the SanyuHub web backend/frontend is reflected instantly in the Android application without requiring an APK re-compilation or app store update.
2. **Native Asset Updates**: When changing launcher icons, app permissions, or native configurations, re-run `gradle assembleDebug` / `gradle assembleRelease` and increment `versionCode` and `versionName` in `android/app/build.gradle`.
