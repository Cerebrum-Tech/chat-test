# CAICore native chat host

This Expo application embeds the global CAICore Vite frontend in a native WebView. The web frontend owns conversations REST calls and the conversation SSE stream. The current Erikli global channel has `auth.enabled: false`, so the smoke checklist targets direct loading and REST/SSE without a login. The native application supplies public runtime context, enforces the WebView boundary, and handles a small navigation bridge.

## Prerequisites

- Node.js and npm compatible with Expo SDK 53.
- An Android emulator, iOS simulator, or device that can run Expo Go.
- A checkout or deployment of the global CAICore `feat/native-client-actions` revision at commit `4bb5772` or a merged descendant when exercising the complete stack.

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

Every EXPO_PUBLIC_ value is embedded in the client bundle. Do not put secrets, access credentials, or bearer values in these fields. The native host injects only window.__CAI_API_BASE_URL__ and the allowlisted userId, userName, language, and country properties in window.__CHAT_BACKEND_CONTEXT__. The allowlist rejects unsupported property names; it does not inspect allowed string values for token-like content, so callers remain responsible for keeping every allowed value public. The host injects no authentication object or token. If authentication is enabled in a future global configuration, the frontend AuthProvider remains the only permitted token owner.

## Device and emulator host resolution

The configured frontend URL, and any optional direct API override, must resolve from the device or emulator back to the development host. Device-local localhost points at the device itself.

- Android Emulator: use 10.0.2.2 for services bound on the host.
- Physical device: use the development machine's LAN address and ensure the firewall and service bind address permit access.
- iOS Simulator: localhost normally resolves to the Mac host; use the LAN address when that is not true for the selected setup.

The sample is immediately usable for host-browser development on Vite port 5174 and leaves the optional API override blank. For the recommended Android Emulator configuration, change only the host address to 10.0.2.2 and keep the API base blank. Browser requests then stay on the Vite origin and its /v1 proxy forwards them to the API on host port 8000:

~~~dotenv
EXPO_PUBLIC_CAI_FRONTEND_URL=http://10.0.2.2:5174
EXPO_PUBLIC_CAI_API_BASE_URL=
EXPO_PUBLIC_CAI_USER_ID=test-user
EXPO_PUBLIC_CAI_USER_NAME=Test User
EXPO_PUBLIC_CAI_LANGUAGE=tr-TR
EXPO_PUBLIC_CAI_COUNTRY=TR
~~~

If a direct API override is needed instead, set EXPO_PUBLIC_CAI_API_BASE_URL to the device-reachable backend URL and add the WebView's exact scheme, host, and Vite port to CAICore/.env. For the Android Emulator example, preserve the existing localhost entries and add http://10.0.2.2:5174:

~~~dotenv
# This native repository's .env
EXPO_PUBLIC_CAI_API_BASE_URL=http://10.0.2.2:8000

# The global repository's CAICore/.env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://10.0.2.2:5174
~~~

Restart Expo with --clear after changing .env.

## Run the global stack

Complete-stack, Vite, and live-action smoke require the companion global native-action producer and dispatcher. Use a global checkout of `feat/native-client-actions` at `4bb5772`, or any descendant that contains it. Replace the placeholder below with that checkout and verify the ancestry before starting services:

~~~bash
cd /path/to/global-checkout-containing-4bb5772
git merge-base --is-ancestor 4bb5772 HEAD
~~~

An ancestry-check failure means that checkout cannot produce the live native action and is not a valid smoke target. For rollout, deploy the global revision first and this native host second; deploying the native host first leaves it without the required producer/dispatcher.

The verified global checkout requires local secret files before Compose or Vite smoke. Create both backend files first:

~~~bash
cd /path/to/global-checkout-containing-4bb5772
cp CAICore/.env.example CAICore/.env
cp WatersMCPServer/.env.example WatersMCPServer/.env
~~~

For direct local CAICore credentials, remove or comment the sample KEY_VAULT_URL unless it names a reachable vault, then add valid NesGen values to CAICore/.env:

~~~dotenv
NESGEN_ENDPOINT=<NesGen base endpoint>
NESGEN_CLIENT_ID=<NesGen client id>
NESGEN_CLIENT_SECRET=<NesGen client secret>
~~~

Alternatively, configure a real KEY_VAULT_URL plus the Azure service-principal credentials required by the local container. In WatersMCPServer/.env, confirm WATERS_API_URL and fill WATERS_API_USER, WATERS_API_PASSWORD, WATERS_API_SK, TEMP_CUSTOMER_ID, and TEMP_CONSUMER_CONNECTION_ID with the approved pre-production values. Never commit either populated file.

The Compose stack provides Cosmos, the CRM tool service, and CAICore. Start it only after those files are ready:

~~~bash
cd /path/to/global-checkout-containing-4bb5772
docker compose -f docker-compose.dev.yaml up --build
~~~

The Vite frontend is a separate development process. Before starting it, create WebFrontend/.env.local with exactly one agent selector. The current global configuration uses the erikli request key and sets `auth.enabled: false`, so the recommended file is:

~~~dotenv
VITE_AGENT_KEY=erikli
~~~

WEB_ENTRY_POINT_ID=erikli is the entry-point alternative; do not set both selectors. For the recommended same-origin development path, leave VITE_API_BASE_URL and WEB_API_BASE_URL unset so /v1 uses Vite's proxy. Then run:

~~~bash
cd /path/to/global-checkout-containing-4bb5772/WebFrontend
npm ci
npm run dev -- --host 0.0.0.0
~~~

Use the actual Vite port printed by that command in EXPO_PUBLIC_CAI_FRONTEND_URL. Then start this native host with npx expo start --clear.

## Runtime ownership

- ChatWebView loads EXPO_PUBLIC_CAI_FRONTEND_URL directly. It does not generate an HTML wrapper or inject an SDK.
- The current Erikli target has `auth.enabled: false`; direct load and REST/SSE run without login.
- If authentication is enabled in a future target, the global frontend's AuthProvider remains the only permitted token owner.
- The global frontend creates conversations through REST and consumes live assistant activity through SSE.
- The native host never fetches conversation history, opens the SSE stream, or owns tokens.
- The native host listens only for current WebView bridge messages; restored or refetched history cannot replay native navigation.

Auth-enabled Expo hosting is currently unsupported. Cross-origin HTTP(S) navigation leaves the WebView, so a production auth design must separately implement and test a system-browser/deep-link callback that returns the auth result while preserving the WebView session context. Retaining third-party cookies does not supply that handoff.

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
- `mixedContentMode="compatibility"` and `thirdPartyCookiesEnabled={true}` are retained intentionally for current compatibility. They are production-hardening concerns and must not change without a separately designed and device-tested policy.

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

Live device status: not completed in this environment. Automated checks do not substitute for this matrix.

When a suitable environment is available, use the verified companion global revision and the current auth-disabled Erikli target. Verify direct frontend loading; conversation REST and SSE without login; actions with and without case_id; duplicate suppression; Back to chat; same-origin, external, and blocked link behavior; and no redirect after leaving and re-entering chat or restoring history.
