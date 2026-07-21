# CAICore native chat host

This Expo application embeds the global CAICore Vite frontend in a native WebView. The web frontend owns authentication, conversations REST calls, and the conversation SSE stream. The native application supplies public runtime context, enforces the WebView boundary, and handles a small navigation bridge.

## Prerequisites

- Node.js and npm compatible with Expo SDK 53.
- An Android emulator, iOS simulator, or device that can run Expo Go.
- The global CAICore repository at /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr when exercising the complete stack.

## Install, configure, and verify

Run these commands from this repository:

~~~bash
cp env.sample .env
npm ci
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo start --clear
~~~

Edit .env before starting Expo. The six supported fields are:

| Field | Purpose |
| --- | --- |
| EXPO_PUBLIC_CAI_FRONTEND_URL | Required URL loaded directly by the WebView. Point it at the global Vite frontend or its deployed equivalent. |
| EXPO_PUBLIC_CAI_API_BASE_URL | Optional backend override injected as window.__CAI_API_BASE_URL__. Omit it when the frontend should use its own same-origin/default API resolution. |
| EXPO_PUBLIC_CAI_USER_ID | Optional public user identifier exposed in the allowlisted browser context. |
| EXPO_PUBLIC_CAI_USER_NAME | Optional public display name exposed in the allowlisted browser context. |
| EXPO_PUBLIC_CAI_LANGUAGE | Optional public locale, such as tr-TR. |
| EXPO_PUBLIC_CAI_COUNTRY | Optional public country code, such as TR. |

Every EXPO_PUBLIC_ value is embedded in the client bundle. Do not put secrets, access credentials, or bearer values in these fields. The native host injects only window.__CAI_API_BASE_URL__ and the allowlisted userId, userName, language, and country properties in window.__CHAT_BACKEND_CONTEXT__. It injects no authentication object or token. The frontend AuthProvider remains the sole authentication owner.

## Device and emulator host resolution

The two configured URLs must resolve from the device or emulator back to the development host. Device-local localhost points at the device itself.

- Android Emulator: use 10.0.2.2 for services bound on the host.
- Physical device: use the development machine's LAN address and ensure the firewall and service bind address permit access.
- iOS Simulator: localhost normally resolves to the Mac host; use the LAN address when that is not true for the selected setup.

For example, when the global frontend is on host port 5174 and the API is on port 8000, an Android Emulator configuration is:

~~~dotenv
EXPO_PUBLIC_CAI_FRONTEND_URL=http://10.0.2.2:5174
EXPO_PUBLIC_CAI_API_BASE_URL=http://10.0.2.2:8000
EXPO_PUBLIC_CAI_USER_ID=test-user
EXPO_PUBLIC_CAI_USER_NAME=Test User
EXPO_PUBLIC_CAI_LANGUAGE=tr-TR
EXPO_PUBLIC_CAI_COUNTRY=TR
~~~

Restart Expo with --clear after changing .env.

## Run the global stack

The global repository documents a Compose stack for Cosmos, the CRM tool service, and CAICore. Start it from that repository:

~~~bash
cd /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr
docker compose -f docker-compose.dev.yaml up --build
~~~

The Vite frontend is a separate development process:

~~~bash
cd /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr/WebFrontend
npm ci
npm run dev -- --host 0.0.0.0
~~~

Use the actual Vite port printed by that command in EXPO_PUBLIC_CAI_FRONTEND_URL. Then start this native host with npx expo start --clear.

## Runtime ownership

- ChatWebView loads EXPO_PUBLIC_CAI_FRONTEND_URL directly. It does not generate an HTML wrapper or inject an SDK.
- The global frontend's AuthProvider establishes and stores authentication.
- The global frontend creates conversations through REST and consumes live assistant activity through SSE.
- The native host never fetches conversation history, opens the SSE stream, or owns frontend authentication.
- The native host listens only for current WebView bridge messages; restored or refetched history cannot replay native navigation.

## Native navigation bridge

The accepted message is exact and case-sensitive:

~~~json
{
  "output_type": "navigation",
  "process": "GotoPage",
  "data": {
    "page_name": "MainPage",
    "case_id": "optional CRM incident id"
  }
}
~~~

All key names are lowercase exactly as shown. Extra keys, unknown values, malformed JSON, and a non-string case_id are rejected. A missing or blank case_id still navigates but is omitted from the native route.

An accepted action immediately calls router.replace for /main-page. A screen-lifetime guard ignores repeated delivery while the chat screen unmounts, so the action does not stack or replace twice. The destination displays the exact nonblank incident ID, or Not provided when it is absent. Back to chat replaces the route with /(tabs)/chat.

## URL and cache policy

- Same-origin HTTP(S) navigation stays inside the WebView.
- Cross-origin HTTP(S), tel, and mailto links are sent to the operating system.
- Malformed URLs and unsupported schemes such as data, blob, about, and custom schemes are blocked.
- The configured frontend URL must itself be valid HTTP(S).
- WebView document caching is disabled with cacheEnabled=false and cacheMode=LOAD_NO_CACHE. DOM storage remains enabled so the frontend can maintain its live session.

## Verification and smoke checks

Automated coverage lives in __tests__ and exercises bootstrap projection, strict action parsing, immediate duplicate-safe routing, incident display/back behavior, URL classification, WebView wiring, and cache flags.

Before handoff, run the install and verification commands above plus:

~~~bash
npx expo config --type public >/dev/null
chat_test_export_dir=$(mktemp -d .expo-export.XXXXXX)
npx expo export --platform android --output-dir "$chat_test_export_dir"
mv "$chat_test_export_dir" /tmp/
git diff --check
~~~

For a device smoke, verify direct frontend loading and AuthProvider login; actions with and without case_id; duplicate suppression; Back to chat; same-origin, external, and blocked link behavior; and no redirect after leaving and re-entering chat or restoring history.
