# Release Notes — Kruzty Dynamics v1.0

**Released:** November 24, 2026  
**Commit range:** `1c67bbf` → `6d04ba6` (`Phase 1` through `Phase 7`)

---

## Overview

Kruzty Dynamics v1.0 is the **complete ground-up rewrite** of the original [Kizzy](https://github.com/dead8309/Kizzy) Android Discord Rich Presence app. The original Kotlin + Jetpack Compose codebase was archived into `OLD-SOURCE/` and replaced with a modern hybrid architecture:

- **Rust backend** via [Tauri v2](https://tauri.app) (replacing the Kotlin app logic)
- **React 19 + TailwindCSS v4** frontend (replacing Jetpack Compose UI)
- **Native Android bridge** (Kotlin services, Kotlin↔Rust/JS interop) for features that require Android system APIs

This was developed across **7 build phases** between November 17–24, 2026.

---

## What's New (vs. the old Kizzy source)

### 🏗️ Architecture — Full Rewrite (Phase 1 → Phase 7)

The app was rebuilt from scratch in a Tauri v2 + React 19 stack:

- **Rust core** handles HTTP (reqwest + rustls), async tasks, and Tauri command dispatch
- **React 19 frontend** runs in Tauri's Android WebView for all UI rendering
- **Kotlin native bridge** provides system access that WebView cannot do: foreground app detection, media session reading, Discord Social SDK publishing, and encrypted credential storage
- Native ↔ JS communication via `window.AndroidNativeBridge` and custom WebView `JavascriptInterface`s

### 🎮 App Presence Configuration (Phase 2 + Phase 4 + Phase 7)

- **Application Catalogue** — full app list with search, activity-type filter, enabled-only filter, and per-app toggle
- **Per-app Customize modal** — set Projected Name, Activity Type (Global Default / Playing / Streaming / Listening / Watching / Competing), Activity Status (Global Default / Online / Idle / DND / Offline / Invisible), Platform Type (Android / PC / PlayStation / Xbox / Nintendo Switch), and Custom Buttons (with expression variables)
- **Batch Operations mode** — select multiple apps and apply activity type, status, and enabled state changes in bulk
- **Outside Detected App Policies** — Freeze (keep last presence), Custom Fallback (show a custom activity), or Drop (clear presence entirely)
- **App Timestamp Strategy** — Persistent (keep start time across app switches), Reset on Switch, Fixed Date/Time
- **Configurable App Presence Fields** (Phase 7) — per-field template for Activity Name, Details, State, Big Image, Small Image, and Buttons

### 🎵 Media Presence Configuration (Phase 3 + Phase 4 + Phase 7)

- **Live media detection** via Android `NotificationListenerService` + `MediaSessionManager` — reads title, artist, album, artwork, playback state, position, and duration
- **Priority Mode** — Media First, App First, or App Only
- **Media Detection Scope** — All sources or whitelisted sources only
- **Activity Type Resolution** — Auto-Adaptive (Listening for audio, Watching for video), Always Listening, or Always Watching
- **Time Remaining toggle** — show real start/end elapsed timestamps or fall back to the app's service-start timestamp
- **Paused Media Resolution** — Show Paused State, Fallback to Detected App, or Hide Paused State
- **Configurable Media Presence Fields** (Phase 7) — per-field templates for Big Image, Small Image, Details, State, and Custom Buttons; expression variables include `{{MediaTitle}}`, `{{MediaArtist}}`, `{{MediaAlbum}}`, `{{MediaApp}}`, etc.
- Automatic play/pause icon resolution using Discord app art asset keys: `MediaPlay`, `MediaPause`, `KruztyDynamicsLogo`

### 🔗 Accounts & Discord OAuth (Phase 2 + Phase 3)

- **Discord Social SDK** (PKCE authorization flow) replaces raw token injection
- Encrypted token storage with **AES-GCM** using Android Keystore — tokens never touch WebView storage
- **In-app Discord login portal** — full-screen WebView dialog at `discord.com/login` with request-header token capture
- Multi-account support — add, switch active account, and remove accounts

### ⚙️ Settings & Customization (Phase 2 + Phase 4 + Phase 6)

- **Themes and Display** — Light, Dark, AMOLED; 8 preset accent colors + custom hex picker; Android status bar icon adaptation
- **Language / Localization** — real-time language switching affecting all UI text; persists to app settings
- **Global Defaults** — set a default Activity Type and Activity Status applied across all app profiles
- **Custom ImgBB API Key** support for image hosting
- **Custom Discord Application ID** support
- **Permissions management** — in-app view of all permission statuses with deep-links to Android settings pages
- **Image cache management** — view count and clear cached image URLs

### 🌍 Localization — 25+ Languages (Phase 5)

Full UI translation across 25 standard locales and 4 playful/regional variants:

> Arabic, Bulgarian, Chinese (Simplified), Chinese (Traditional), Czech, Danish, Dutch, English (US), Filipino/Tagalog, Finnish, French, German, Greek, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Malay, Norwegian, Polish, Portuguese (Brazil), Portuguese (Portugal), Romanian, Russian, Spanish, Swedish, Thai, Turkish, Ukrainian, Vietnamese — plus playful variants (Pirate, UwU, etc.)

### 🛠️ Service & Background Operation (Phase 3 + Phase 4 + Phase 6 + Phase 7)

- **Android Foreground Service** (`KruztyDynamicsService`) for background presence publishing
- **Service shortcuts** — start/stop presence from the Android home screen (with permission guard: service cannot start without required permissions)
- **Battery optimization bypass** — optional exemption via `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
- **Customizable notification template** (Phase 7) — configure what text appears in the foreground service notification
- Foreground service types: `mediaPlayback` + `specialUse`
- Restart controls and status display on the Service Dashboard

### 🔄 Update Checker (Phase 6)

- Automatic version check against GitHub Releases at app launch
- Manual update check from Settings
- Localized update status indicator

### 📋 Onboarding (Phase 2 + Phase 3)

- Guided first-run flow: permission setup, theme selection, language selection, Discord account linking
- Onboarding state mirrors Settings — changes in onboarding take real effect immediately (e.g., language selection, theme, account login)
- Permission cards with real Android permission requests (notification access, usage access, battery optimization, post notifications)

---

## What Was Removed (from the old Kizzy source)

| Removed Feature                                     | Reason                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| **Jetpack Compose UI**                              | Replaced by React 19 + TailwindCSS v4 frontend in Tauri WebView    |
| **Kotlin-based app navigation / MVVM**              | Replaced by React component routing and Zustand-style hooks        |
| **Material You / Dynamic Color**                    | Replaced by custom theme system (8 presets + custom hex)           |
| **Hilt Dependency Injection**                       | Not applicable in Tauri/React architecture                         |
| **300+ predefined game presets**                    | Deferred — per-app catalogue is dynamic via installed apps         |
| **Console RPC (PS4, Xbox One hardware)**            | Deferred — platform type remains a UI field only for now           |
| **Custom RPC (fully manual presence entry)**        | Replaced by per-app and per-media configurable fields              |
| **Logs screen**                                     | Deferred to a future release; Tauri plugin-log handles log capture |
| **Save/Load presence configs (JSON export/import)** | Deferred to a future release                                       |
| **GIF support**                                     | Deferred — image URLs work; animated GIF hosting not yet wired     |
| **Kizzy docs / QuickStart integration**             | Replaced by this repository's own docs                             |
| **Monet palettes**                                  | Replaced by custom TailwindCSS accent color system                 |
| **Logra (logs UI library)**                         | Not carried over in this rewrite                                   |
| **Material Color Utilities**                        | Not carried over in this rewrite                                   |
| **Rich-Presence-U / Xbox data presets**             | Data not ported; credited in README                                |
| **Gradle multi-module build**                       | Replaced by Tauri + npm + Cargo build pipeline                     |
| **Translations via Crowdin**                        | Re-implemented via `src/i18n/translations.ts`                      |

---

## Build Phases Summary

| Phase      | Commit    | Description                                                                                                                                                                                        |
| ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transition | `7e49684` | Migrated Kizzy source to `OLD-SOURCE/`; scaffolded Tauri v2 + React 19 project                                                                                                                     |
| Phase 1    | `2eb9698` | Initial Tauri frontend wiring, basic navigation, theme system                                                                                                                                      |
| Phase 2    | `d6118ca` | App discovery, presence profiles, custom icon uploads, batch editing, Discord OAuth login, permissions, settings                                                                                   |
| Phase 3    | `7e86c53` | Native Android foreground service, app/media detection, Discord Social SDK publishing, PKCE account linking, encrypted token storage, dashboard live preview, image uploads, log export            |
| Phase 4    | `c8e2a0c` | Service shortcuts, restart controls, status/platform publishing, app/media presence field configuration, expanded UI localization, debug tooling                                                   |
| Phase 5    | `031a312` | 29 UI localization files (25 standard + 4 playful variants)                                                                                                                                        |
| Phase 6    | `e982c5e` | Update checker (GitHub Releases), service shortcut permission guards, GPL-3.0 license, version set to 1.0.0                                                                                        |
| Phase 7    | `6d04ba6` | Configurable app/media presence field templates, Streaming → Discord status migration, customizable foreground notification, Android SDK diagnostics, APK build options, legacy template migration |

---

## Upgrade / Migration

This is a **v1.0 initial release** — there is no prior Kruzty Dynamics version to upgrade from. If you used the original **Kizzy** app, your Kizzy data and settings are not automatically imported. You will need to re-link your Discord account and re-configure your app profiles.

---

## Related

- [Privacy Policy](PRIVACY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)
- [LICENSE](LICENSE) — GNU GPL-3.0-only
- [Original Kizzy Repository](https://github.com/dead8309/Kizzy) by @dead8309
