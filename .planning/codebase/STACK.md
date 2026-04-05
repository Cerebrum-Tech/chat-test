# Technology Stack

**Analysis Date:** 2026-04-05

## Languages

**Primary:**
- TypeScript ~5.8.3 - All application source files (`.ts`, `.tsx`)
- JavaScript - Build scripts (`scripts/reset-project.js`), ESLint config (`eslint.config.js`)

**Secondary:**
- HTML/CSS - Inline in `components/ChatWebView.tsx` (Chatwoot widget host page generated at runtime)

## Runtime

**Environment:**
- Node.js v24.11.0 (detected on host machine; no `.nvmrc` or `.node-version` pinned)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.0.0 - UI component model
- React Native 0.79.5 - Cross-platform mobile runtime
- Expo ~53.0.20 - Managed workflow, native module access, build tooling

**Routing:**
- expo-router ~5.1.4 - File-based routing; entry point is `expo-router/entry` (see `package.json` `main` field)
- @react-navigation/native ^7.1.6 - Navigation primitives (used by expo-router)
- @react-navigation/bottom-tabs ^7.3.10 - Tab bar navigator used in `app/(tabs)/_layout.tsx`

**UI / Animation:**
- react-native-reanimated ~3.17.4 - Animations
- react-native-gesture-handler ~2.24.0 - Gesture system
- react-native-safe-area-context 5.4.0 - Safe area insets
- react-native-screens ~4.11.1 - Native screen containers
- expo-blur ~14.1.5 - Blur effects
- expo-haptics ~14.1.4 - Haptic feedback
- expo-image ~2.4.0 - Optimised image component
- @expo/vector-icons ^14.1.0 - Icon sets
- expo-symbols ~0.4.5 - SF Symbols (iOS)

**WebView:**
- react-native-webview 13.13.5 - Embeds the Chatwoot chat widget; core integration component at `components/ChatWebView.tsx`

**Web (browser target):**
- react-dom 19.0.0
- react-native-web ~0.20.0
- Metro bundler (configured via `app.json` `web.bundler: "metro"`)

**Testing:**
- None detected

**Build/Dev:**
- Babel @babel/core ^7.25.2 - JS transpilation
- TypeScript strict mode with path alias `@/*` → `./*` (see `tsconfig.json`)
- ESLint ^9.25.0 with `eslint-config-expo ~9.2.0` (flat config at `eslint.config.js`)
- Expo CLI - `expo start`, `expo lint`

## Key Dependencies

**Critical:**
- `react-native-webview` 13.13.5 - The entire Chatwoot chat integration is built on top of this; removing or upgrading requires re-testing all message bridging logic in `components/ChatWebView.tsx`
- `expo-router` ~5.1.4 - File-based routing drives navigation; all screens live under `app/`
- `expo-linking` ~7.1.7 - Used indirectly via `Linking.openURL()` in `components/ChatWebView.tsx` to open external URLs in the system browser

**Infrastructure:**
- `expo-font` ~13.3.2 - Loads `SpaceMono-Regular.ttf` at app start (`app/_layout.tsx`)
- `expo-splash-screen` ~0.30.10 - Splash screen configuration
- `expo-constants` ~17.1.7 - App metadata access
- `expo-status-bar` ~2.2.3 - Status bar control
- `expo-system-ui` ~5.0.10 - System UI (Android edge-to-edge)
- `expo-web-browser` ~14.2.0 - Available but not directly invoked; `Linking` is used instead

## Configuration

**Environment:**
- Runtime env vars are read via `process.env.EXPO_PUBLIC_*` in `components/ChatWebView.tsx`
- Required variables (see `env.sample`):
  - `EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN`
  - `EXPO_PUBLIC_CHATWOOT_USER_ID`
  - `EXPO_PUBLIC_CHATWOOT_ACCESS_TOKEN`
  - `EXPO_PUBLIC_CHATWOOT_CUSTOMER_CONNECTION_ID`
  - `EXPO_PUBLIC_CHATWOOT_BASE_URL` (default: `https://chat.footgolflegends.com`)
- `.env` is gitignored; `env.sample` is committed as a reference template
- All `EXPO_PUBLIC_` vars are inlined into the client bundle at build time — they are not secret

**Build:**
- `app.json` - Expo app config (name, slug, icons, plugins, scheme `chattest`, `newArchEnabled: true`)
- `tsconfig.json` - Extends `expo/tsconfig.base`, strict mode, `@/` path alias
- `eslint.config.js` - Flat config extending `eslint-config-expo`

## Platform Requirements

**Development:**
- Node.js (v24 in use; no pinned version file)
- Expo CLI (`npx expo` or global install)
- iOS Simulator or Android Emulator, or Expo Go app on device
- Copy `env.sample` to `.env` and fill in Chatwoot credentials

**Production:**
- Expo managed workflow — build via `eas build` or `expo build`
- Targets: iOS (`ios.supportsTablet: true`), Android (edge-to-edge enabled), Web (static Metro output)
- App scheme: `chattest` (for deep linking)
- New Architecture enabled (`newArchEnabled: true` in `app.json`)

---

*Stack analysis: 2026-04-05*
