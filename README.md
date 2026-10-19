# Erikli native chat host

This Expo application embeds the Erikli chat widget in a native WebView. The web frontend owns conversations REST calls and the conversation stream; this host authenticates the user, injects the resulting CereMeet bearer token, enforces the WebView boundary, and handles a small navigation bridge.

Authentication is mandatory. The backend gate validates every session's token against CereMeet and derives the CRM customer from it, so the chat screen is reachable only after a successful sign-in.

## Prerequisites

- Node.js and npm compatible with Expo SDK 57 (Node.js 24 LTS recommended).
- An Android emulator, iOS simulator, or device running Expo Go for SDK 57.
- The CereMeet watersLogin service key, and at least one CRM customer id belonging to a Waters-flagged account.
- A reachable deployment (or local run) of the Erikli backend and widget from the `nestle-waters-tr-go` repository.

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

Edit .env before starting Expo. The supported fields are:

| Field | Purpose |
| --- | --- |
| EXPO_PUBLIC_CAI_FRONTEND_URL | Required URL loaded directly by the WebView. Point it at the deployed Erikli widget or a local Vite run. |
| EXPO_PUBLIC_CAI_API_BASE_URL | Optional backend override injected as window.__CAI_API_BASE_URL__. Omit it when the frontend should use its own same-origin/default API resolution. |
| EXPO_PUBLIC_CAI_LANGUAGE | Optional public locale, such as tr-TR. Without it the widget falls back to the device locale, which answers English users in English. |
| EXPO_PUBLIC_CAI_COUNTRY | Optional public country code, such as TR. |
| EXPO_PUBLIC_CAI_WATERS_LOGIN_KEY | Required service key for the watersLogin exchange that mints a customer's token. |
| EXPO_PUBLIC_CAI_SAMPLE_USER_{1..5}_LABEL | Optional display name for a sample user on the login screen. |
| EXPO_PUBLIC_CAI_SAMPLE_USER_{1..5}_CUSTOMER_ID | The sample user's CRM customer id. A slot with a blank id is skipped. |

The customer ids are identifiers rather than credentials — the access token is minted at sign-in — and any customer id can be typed straight into the login screen instead of being configured.

The login key is a credential, and Expo embeds every EXPO_PUBLIC_ value in the client bundle, so anyone holding a build can sign in as any customer id. Use the **pre-production key only**, keep .env out of git, and do not distribute a build of this host. A production app must move the watersLogin exchange behind its own backend rather than shipping the key.

Restart Expo with --clear after changing .env.

## Device and emulator host resolution

The configured frontend URL, and any optional direct API override, must resolve from the device or emulator back to the development host. Device-local localhost points at the device itself.

- Android Emulator: use 10.0.2.2 for services bound on the host.
- Physical device: use the development machine's LAN address and ensure the firewall and service bind address permit access.
- iOS Simulator: localhost normally resolves to the Mac host; use the LAN address when that is not true for the selected setup.

A deployed HTTPS widget URL resolves everywhere and needs none of the above.

## Authentication flow

1. The app starts on the login screen and takes a customer id: either a configured sample user or one typed in.
2. `services/ceremeetAuth.ts` posts that id to `https://api.ceremeet.com/api/auth/watersLogin` with the service key and receives the customer's `access_token`.
3. The same module then calls `GET https://api.ceremeet.com/api/users/me` with the minted token. This is a pre-flight of the backend gate, using the same reason codes; it is what catches a token that logs in but would be refused mid-conversation, and it confirms `isWatersUser` and the derived `consumer_id` before the chat opens.
4. On success the session — token, email, derived `consumer_id` — is held in React state only. It is never written to storage, a route param, or a log, so relaunching the app returns to the login screen.
5. The chat screen redirects to the login screen whenever there is no session, so the WebView is only ever mounted with a verified token.
6. `ChatWebView` injects the token into `window.__CHAT_BACKEND_CONTEXT__` before the widget bundle runs. The widget forwards it as `Authorization: Bearer` on every API call and keeps it out of the conversation metadata it persists.
7. The backend validates the token again, checks `isWatersUser`, derives the customer id, and runs every CRM lookup as that customer. A session without a valid token is rejected with the pre-approved unauthorized message and makes zero CRM calls.

Sign out from the chat screen clears the session and returns to the login screen.

The injection contract is specified by the backend repository's `docs/mobile-app-widget-integration.md`. The token must be set through `injectedJavaScriptBeforeContentLoaded`, not `injectedJavaScript`, which runs after the widget has already read the global.

No browser-redirect login is involved, so no system-browser handoff is needed. A redirect-based identity provider would still be unsupported here, because cross-origin HTTP(S) navigation leaves the WebView and would need a separately designed system-browser/deep-link callback.

## Run the backend stack

Sign-in works against CereMeet alone, but chat requires the Erikli backend and widget. Use the `nestle-waters-tr-go` checkout:

~~~bash
cd /path/to/nestle-waters-tr-go
docker compose up -d --build caicore webfrontend
~~~

That stack serves the widget and the backend behind their configured hostnames, with `WATERS_WIDGET_TEST_MODE` defaulting to `0` — the state this host expects. Setting it to `1` re-enables a shared bypass marker that authorizes a fixed test customer with no token, which makes the sign-in exercised here meaningless; leave it off.

Secrets for that stack live in its own git-ignored .env files; see its README.

## Runtime ownership

- ChatWebView loads EXPO_PUBLIC_CAI_FRONTEND_URL directly. It does not generate an HTML wrapper or inject an SDK.
- This host owns the token: it verifies it, holds it in memory, and injects it. It does not open the conversation stream, fetch conversation history, or parse chat payloads.
- The widget owns conversation transport and remains the only component that attaches the bearer to backend calls.
- The native host listens only for current WebView bridge messages; restored or refetched history cannot replay native navigation.

## Native navigation bridge

The accepted message is exact and case-sensitive:

~~~json
{
  "output_type": "navigation",
  "process": "GotoPage",
  "data": {
    "page_name": "MainPage",
    "case_id": "optional CRM incident id",
    "address_id": "optional consumer address id the main page should open on"
  }
}
~~~

All key names are lowercase exactly as shown. Extra keys, unknown values, malformed JSON, and a non-string case_id or address_id are rejected. The two ids are independently optional: a missing or blank one still navigates and is simply omitted from the native route.

An accepted action calls router.replace for /main-page after a 5 second wait, so the flow's closing message stays readable before the screen changes. A screen-lifetime guard ignores repeated delivery, so the action does not stack or replace twice, and a redirect still pending when the chat screen unmounts is dropped rather than firing later. The destination displays the exact nonblank incident ID and address ID, or Not provided for whichever is absent. Back to chat replaces the route with /(tabs)/chat.

## URL and cache policy

- Same-origin HTTP(S) navigation stays inside the WebView.
- Cross-origin HTTP(S), tel, and mailto links are sent to the operating system.
- Malformed URLs and unsupported schemes such as data, blob, about, and custom schemes are blocked.
- The configured frontend URL must itself be valid HTTP(S).
- WebView document caching is disabled with cacheEnabled=false and cacheMode=LOAD_NO_CACHE. DOM storage remains enabled so the frontend can maintain its live session.
- `mixedContentMode="compatibility"` and `thirdPartyCookiesEnabled={true}` are retained intentionally for current compatibility. They are production-hardening concerns and must not change without a separately designed and device-tested policy.

## Verification and smoke checks

Automated coverage lives in __tests__ and exercises sample-user projection, the watersLogin exchange and the CereMeet verification with their reason codes, login success and rejection paths, the unauthenticated chat redirect, bootstrap projection including the token field, strict action parsing, immediate duplicate-safe routing, incident display/back behavior, URL classification, WebView wiring, and cache flags.

Before handoff, run the install and verification commands above plus:

~~~bash
npx expo config --type public >/dev/null
chat_test_export_dir=$(mktemp -d .expo-export.XXXXXX)
npx expo export --platform android --output-dir "$chat_test_export_dir"
mv "$chat_test_export_dir" /tmp/
git diff --check
~~~

Live device status: not completed in this environment. Automated checks do not substitute for this matrix.

When a suitable environment is available, verify: sign-in with a valid sample user; sign-in with a typed customer id; rejection messages for an unknown customer id, a missing login key, and a non-Waters account; that the chat tab redirects to login before sign-in and after sign-out; that CRM answers reflect the signed-in customer rather than a shared test customer; actions with and without case_id and address_id; duplicate suppression; Back to chat; same-origin, external, and blocked link behavior; and no redirect after leaving and re-entering chat or restoring history.
