# SanyuHub Native iOS Project — Build & Integration Guide

This directory contains the complete native iOS application project for **SanyuHub**, built with **Swift** and **SwiftUI**.

---

## 1. Project Architecture & Structure

```
ios/
├── SanyuHub.xcodeproj/
│   ├── project.pbxproj
│   └── xcshareddata/
│       └── xcschemes/
│           └── SanyuHub.xcscheme
├── SanyuHub/
│   ├── App/
│   │   ├── SanyuHubApp.swift          # Main @main App Entry Point & TabView
│   │   └── AppEnvironment.swift       # Global Navigation & Player State Manager
│   ├── Core/
│   │   ├── Networking/
│   │   │   ├── APIEndpoint.swift       # Typed SanyuHub API Endpoints
│   │   │   ├── NetworkError.swift      # Localized Network Error Types
│   │   │   └── NetworkService.swift    # URLSession Async/Await Networking Engine
│   │   ├── Models/
│   │   │   ├── Movie.swift             # Movie Model
│   │   │   ├── Series.swift            # Series & Episode Models
│   │   │   ├── Concert.swift           # Concert/Event Model
│   │   │   ├── LiveChannel.swift       # Live TV & Radio Channel Model
│   │   │   ├── HeroItem.swift          # Carousel Slide Model
│   │   │   └── PaginatedResponse.swift # API Paginated Payloads
│   │   ├── Services/
│   │   │   ├── ContentRepository.swift # Movies, Series & Concert Data Access
│   │   │   ├── LiveTVRepository.swift  # Embedded Live TV & Radio Catalog
│   │   │   └── AudioSessionManager.swift # Background Audio Session Manager
│   │   ├── ImageLoading/
│   │   │   └── ImageLoader.swift       # Remote Image Fetcher & Cache
│   │   └── Utilities/
│   │       ├── Theme.swift             # SanyuHub Design System Colors & Spacing
│   │       └── Constants.swift         # Configuration Constants
│   ├── Features/
│   │   ├── Home/                       # 16:9 Hero Carousel & 5 Home Sections
│   │   ├── Library/                    # Movies, Series, Music, Concerts & VJ Selectors
│   │   ├── LiveTV/                     # TV Channels, Kids TV, Radio, Matches, Crusades
│   │   ├── Search/                     # Reactive Full-Screen Search Overlay
│   │   ├── Details/                    # Movie, Series & Concert Detail Screens
│   │   └── Player/                     # AVPlayer Native Video & Audio Player
│   ├── Components/                     # Navigation, Cards, Badges & Shimmer Skeletons
│   ├── Resources/
│   │   ├── Assets.xcassets/            # Official SanyuHub AppIcon & ColorSets
│   │   └── Info.plist                  # iOS App Permissions & Configuration
├── Configuration/
│   └── AppConfig.xcconfig              # XCConfig Build Settings
└── Tests/
    └── SanyuHubTests/                  # Swift Unit Tests (API, Decoding, ViewModels)
```

---

## 2. Prerequisites & Environment Setup

To compile, build, and run the SanyuHub iOS application, ensure your development setup meets the following requirements:

* **macOS:** macOS Ventura 13.0 or higher (macOS Sonoma 14.0+ recommended)
* **Xcode:** Xcode 15.0 or higher
* **iOS Deployment Target:** iOS 16.0 or higher
* **Swift Language Version:** Swift 5.0

---

## 3. How to Open and Build in Xcode

1. Open **Xcode** on macOS.
2. Choose **File > Open** and select the project file:
   ```
   ios/SanyuHub.xcodeproj
   ```
3. Select the **SanyuHub** scheme in the top toolbar.
4. Choose a target **iOS Simulator** (e.g., *iPhone 15 Pro*) or a connected physical iPhone.
5. Press `Cmd + R` or click the **Play** button to build and run the application.

---

## 4. Configuring Bundle Identifier & Backend URL

### Bundle Identifier
The bundle identifier is defined in `ios/Configuration/AppConfig.xcconfig` as:
```ini
PRODUCT_BUNDLE_IDENTIFIER = ug.sanyuhub.app
```
To customize the bundle identifier for your Apple Developer account:
1. Open `ios/Configuration/AppConfig.xcconfig`.
2. Update `PRODUCT_BUNDLE_IDENTIFIER` to your desired reverse-DNS ID (e.g., `com.yourcompany.sanyuhub`).

### Backend Base URL
The default API host is set in `ios/SanyuHub/Core/Networking/NetworkService.swift` and `ios/SanyuHub/Core/Utilities/Constants.swift`:
```swift
public static let defaultBaseURL = "https://sanyuhub.com"
```
To point the app to a local development server during testing (e.g., `http://localhost:3000`), update `defaultBaseURL` or pass a custom URL when instantiating `NetworkService(baseURL:)`.

---

## 5. Physical Device Deployment & Code Signing

To run SanyuHub on a physical iPhone:

1. Connect your iPhone via USB / Wi-Fi to your Mac.
2. In Xcode, select the top-level **SanyuHub** project in the Project Navigator.
3. Select the **SanyuHub** target under **Targets**.
4. Navigate to the **Signing & Capabilities** tab.
5. Check **Automatically manage signing**.
6. Select your **Apple Developer Team** in the Team dropdown.
7. Select your connected iPhone in the run destination menu and press `Cmd + R`.

---

## 6. Running Unit Tests

To run the native unit test suite:

1. Open `ios/SanyuHub.xcodeproj` in Xcode.
2. Press `Cmd + U` or select **Product > Test**.
3. Test suites in `ios/Tests/SanyuHubTests/` cover:
   * **APITests.swift:** Verification of endpoint URL construction and query parameter generation.
   * **ModelDecodingTests.swift:** Verification of JSON decoding for `Movie`, `Series`, and paginated responses.
   * **LiveChannelsTests.swift:** Verification of `LIVE_TV_CHANNELS` resolution, stream URLs, and category filtering.
   * **ViewModelTests.swift:** Verification of search and channel filter view model state.

---

## 7. Build and Verification Status

* **Native iOS Source Code:** 100% complete in Swift & SwiftUI.
* **WebView Dependency:** 0% (No `WKWebView` or web wrappers used).
* **Official Logo & Branding:** Official SanyuHub logo processed into all standard iOS `AppIcon.appiconset` resolutions.
* **Stream Playback:** Native HLS (.m3u8) video and audio streaming powered by `AVPlayer` and `AVPlayerViewController`.
* **Testing Status:** Source code and Xcode configuration created cleanly. Final compilation and iOS Simulator/device runtime testing remain to be executed on a macOS machine with Xcode installed.
