# CAICore native chat host

## What this is

An Expo React Native application that presents the global CAICore Vite frontend inside a native WebView. It provides native tabs and a small, explicit navigation bridge without duplicating the frontend's authentication or conversation client.

## Core value

Users can run the global web chat in a device-resolved native host and move immediately to a native MainPage screen when the live frontend emits the supported action.

## Validated capabilities

- [x] Load EXPO_PUBLIC_CAI_FRONTEND_URL directly as the WebView source.
- [x] Inject an optional API base URL and only userId, userName, language, and country as public browser context.
- [x] Keep the native host token-free; if auth is enabled later, leave token ownership with the global frontend AuthProvider.
- [x] Leave conversations REST and SSE ownership with the global frontend.
- [x] Accept an exact lowercase navigation envelope for GotoPage and MainPage.
- [x] Replace immediately with /main-page and suppress repeat callbacks before the chat screen unmounts.
- [x] Display an optional incident ID, otherwise Not provided.
- [x] Replace back to the chat tab from MainPage.
- [x] Keep same-origin HTTP(S) in the WebView, open supported external links through the operating system, and block unsupported schemes.
- [x] Disable the WebView document cache while preserving DOM storage.
- [x] Cover the host boundary with Jest, React Native Testing Library, TypeScript, lint, Expo config, and Android export checks.

## Runtime boundary

The native host supplies public bootstrap configuration and handles native routing. The global frontend creates and reads conversations through REST, consumes live SSE messages, and ensures restored history does not post old native actions. The current Erikli channel has `auth.enabled: false`, so its supported smoke path uses REST/SSE without login. AuthProvider remains the conceptual token owner for a future auth-enabled target, not a login requirement for this target.

## Constraints

- Keep Expo, React Native, expo-router, and react-native-webview.
- Treat every EXPO_PUBLIC_ value as visible client configuration.
- Do not add credentials or tokens to the native bootstrap.
- Treat allowlisting as property-name projection, not content inspection; callers must keep allowed string values public.
- Use global `feat/native-client-actions` at `66c88d5` or a merged descendant before complete-stack/live-action smoke, and roll out that global revision before this host.
- Preserve exact case-sensitive bridge keys and values.
- Do not persist or replay received bridge actions.
- Preserve .planning/phases/01-migration as dated historical evidence.

## Current milestone

The global frontend host migration and automated verification are complete. Live Docker/device smoke was not completed in this environment and remains a release-candidate check. Auth-enabled Expo hosting also remains future work pending a tested system-browser/deep-link callback that preserves the WebView auth-result/session context. Archived migration records remain unchanged.
