<div align="center">

<img src="assets/icon.png" width="96" alt="PixiMesh logo" />

# PixiMesh (Spatial3DApp)

Turn a single photo into an interactive 3D model on your phone.

[![Expo](https://img.shields.io/badge/Expo-SDK_58-000020?style=flat&logo=expo&logoColor=white)](https://docs.expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![Node](https://img.shields.io/badge/Backend-Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://github.com/Areehaafareed/scanner_backend)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)
[![Netlify](https://img.shields.io/badge/Hosted-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)](https://piximesh-backend-api.netlify.app/api/health)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?style=flat&logo=stripe&logoColor=white)](https://stripe.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## About

PixiMesh (`Spatial3DApp`) is a React Native / Expo mobile app that converts a standard camera photo into a `.glb` 3D model you can rotate, zoom, and store in your personal library.

This app does not use LiDAR or hardware depth sensors. It uses a simple capture flow: frame an object on camera, take a photo, and send the cropped image to the [Meshy AI](https://meshy.ai) image-to-3D API to generate a 3D mesh.

---

## Screenshots

<div align="center">

| Sign In / Sign Up | Permissions Onboarding | Scan Preview |
| :---: | :---: | :---: |
| <img src="docs/screenshots/auth.jpg" width="230" alt="Auth Screen" /> | <img src="docs/screenshots/onboarding.jpg" width="230" alt="Onboarding Screen" /> | <img src="docs/screenshots/scan-preview.jpg" width="230" alt="Scan Preview Screen" /> |

| Saved Models Library | Live Profile & Stats |
| :---: | :---: |
| <img src="docs/screenshots/library.jpg" width="230" alt="Library Screen" /> | <img src="docs/screenshots/profile.jpg" width="230" alt="Profile Screen" /> |

</div>

---

## Features

- **Camera Capture & Crop** — live camera view with framing corners, optional grid overlay, and flash toggle. Images are cropped to the framing box before upload.
- **Image-to-3D Generation** — generates `.glb` models via the Meshy AI API with live progress polling and local caching so already-generated tasks aren't re-run.
- **In-App 3D Viewer** — interactive `<model-viewer>` rendered inside `react-native-webview` with auto-rotate and touch orbit/zoom controls.
- **Local Library + Cloud Metadata** — `.glb` files are saved locally in device storage while model names and file sizes sync to MongoDB Atlas.
- **Accounts & Profile** — JWT authentication (bcrypt password hashing), live model count and storage usage bar, editable display name/email, password updates, and persistent app preferences.
- **Subscriptions** — Stripe monthly/annual checkout via `@stripe/stripe-react-native` (1 free model, Pro unlocks unlimited generations). Includes an Expo Go fallback guard in `StripeBridge.js` so scanning, 3D viewing, and profile features can still be tested in Expo Go.

---

## Architecture

```
┌──────────────────────┐        ┌──────────────────────────┐        ┌────────────┐
│    PixiMesh App      │        │  Backend (Express 5)     │        │  MongoDB   │
│  React Native / Expo │ ─────▶ │  Netlify Functions       │ ─────▶ │   Atlas    │
│                      │  JWT   │  auth · profile ·        │        └────────────┘
│  Meshy Image-to-3D   │        │  models · payments       │        ┌────────────┐
│  + Local GLB Storage │        └────────────┬─────────────┘        │   Stripe   │
└──────────┬───────────┘                     │ webhooks             │            │
           │ HTTPS (Meshy REST API)          └─────────────────────▶└────────────┘
           ▼
     ┌──────────┐
     │ Meshy AI │  photo -> 3D mesh (.glb), polled until ready
     └──────────┘
```

| Layer | Stack / Service |
| --- | --- |
| Mobile App | Expo SDK 58, React Native 0.88, React Navigation 7 |
| Backend API | [`Areehaafareed/scanner_backend`](https://github.com/Areehaafareed/scanner_backend) — Express 5 + Mongoose, hosted on Netlify Functions |
| 3D Generation | [Meshy AI Image-to-3D API](https://docs.meshy.ai/en/api) |
| Payments | Stripe Subscriptions + `@stripe/stripe-react-native` |
| Database | MongoDB Atlas |
| 3D Viewer | [`<model-viewer>`](https://modelviewer.dev) in `react-native-webview` |

---

## App Flow & Screens

```
AuthScreen ──▶ OnboardingScreen (Camera + Storage permissions)
                    │
                    ▼
                MainTabs
        ┌────────────┼──────────────┐
        ▼            ▼              ▼
     Library      Capture        Profile
  (saved models)  (camera)   (stats, edit, password, plan)
        │            │
        │            ▼
        │      ScanPreviewScreen ──▶ Meshy AI ──▶ ModelViewerScreen
        │            │
        │            ▼
        └──── CheckoutScreen (Stripe Pro upgrade)
```

| Screen | Description |
| --- | --- |
| `AuthScreen` | Sign In / Create Account with password strength meter and JWT session persistence |
| `OnboardingScreen` | Camera and Media Library permission prompt |
| `ScannnerScreen` | Live camera preview with framing guide, grid overlay, and torch toggle |
| `ScanPreviewScreen` | Cropped image preview, free-trial check, 3D generation progress, and model naming |
| `ModelListScreen` | List of saved `.glb` models with file size, date, and synced names |
| `ModelViewerScreen` | Interactive 3D `.glb` viewer |
| `ProfileScreen` | Live backend stats, storage bar, edit name/email, change password, toggles, and logout |
| `CheckoutScreen` | Stripe monthly/annual subscription checkout with card input and Apple/Google Pay |

---

## Getting Started

### Prerequisites

- Node.js `>= 18`
- [Expo Go](https://expo.dev/go) on iOS/Android for quick testing, or EAS CLI (`npx eas-cli@latest`) for native builds
- A [Meshy AI](https://dashboard.meshy.ai) API key
- A running backend instance ([`scanner_backend`](https://github.com/Areehaafareed/scanner_backend)) locally or on Netlify

### 1. Clone and Install

```bash
git clone https://github.com/Areehaafareed/Spatial3DApp.git
cd Spatial3DApp
npm install
cp .env.example .env
```

### 2. Environment Variables

Fill in `.env`:

```env
EXPO_PUBLIC_MESHY_KEY=your_meshy_api_key
EXPO_PUBLIC_API_URL=https://piximesh-backend-api.netlify.app/api
```

For local backend development, set `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5000/api`. Restart Expo with `-c` whenever `.env` changes.

### 3. Run on Your Phone

```bash
# Start Metro dev server and scan the QR code in Expo Go
npx expo start -c

# Or use tunnel mode if your phone and PC are on different networks
npx expo start --tunnel -c
```

Note: `@stripe/stripe-react-native` requires custom native code. [`StripeBridge.js`](src/services/StripeBridge.js) guards it so the rest of the app runs in Expo Go without crashing. Use an EAS build for full Stripe checkout testing.

### 4. Native Builds (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform ios --profile development
```

---

## Backend API Endpoints

Base URL: `EXPO_PUBLIC_API_URL` ([`scanner_backend`](https://github.com/Areehaafareed/scanner_backend))

| Action | Endpoint |
| --- | --- |
| Health check | `GET /health` |
| Create account | `POST /auth/signup` -> `{ token, user }` |
| Sign in | `POST /auth/login` -> `{ token, user }` |
| Current session | `GET /auth/me` -> `{ user }` |
| Change password | `PATCH /auth/password` -> `{ ok: true }` |
| Profile & stats | `GET /profile` -> `{ user, stats }` |
| Update name / email | `PATCH /profile` -> `{ user }` |
| Save model metadata | `POST /models` `{ taskId, name, sizeKb }` |
| List user models | `GET /models` |
| Start Pro subscription | `POST /payments/create-subscription` `{ plan }` |
| Subscription status | `GET /payments/status` -> `{ isPro, plan }` |

Protected routes send `Authorization: Bearer <jwt>` stored locally via `AsyncStorage`.

---

## Project Structure

```
Spatial3DApp/
├── App.js                        # Root stack navigator + StripeBridge provider
├── app.json                      # Expo config (plugins, icons, EAS project ID)
├── eas.json                      # EAS Build profiles (development, preview, production)
├── docs/
│   └── screenshots/              # App screenshots
├── assets/                       # App icons & splash screen
└── src/
    ├── navigation/
    │   └── MainTabs.js           # Bottom tabs: Library, Capture, Profile
    ├── screens/
    │   ├── AuthScreen.js         # Sign in / Create account (JWT)
    │   ├── OnboardingScreen.js   # Camera & storage permission modal
    │   ├── ScannnerScreen.js     # Camera capture + framing crop
    │   ├── ScanPreviewScreen.js  # Review + Meshy 3D generation + naming
    │   ├── ModelViewerScreen.js  # <model-viewer> WebView for .glb files
    │   ├── ModelListScreen.js    # Saved 3D models library
    │   ├── ProfileScreen.js      # Live stats, storage bar, edit profile & password
    │   └── CheckoutScreen.js     # Stripe Pro subscription checkout
    └── services/
        ├── Api.js                # Central fetch client (JWT + EXPO_PUBLIC_API_URL)
        ├── AuthService.js        # signup / login / changePassword / session
        ├── ProfileService.js     # profile + stats + subscription status
        ├── ModelService.js       # Meshy pipeline + local cache + backend sync
        └── StripeBridge.js       # Safe native Stripe wrapper with Expo Go fallback
```

---

## Security Notes

- Never commit `.env`. Keep API keys (`EXPO_PUBLIC_MESHY_KEY`, `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`) out of git history.
- The Stripe publishable key in `App.js` is safe for client apps; secret keys and webhook secrets belong only in backend environment variables.
- Passwords are hashed server-side with `bcryptjs`.

---

## License

[MIT](LICENSE)
