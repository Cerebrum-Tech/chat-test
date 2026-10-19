# Erikli native host guidance

## Project

This Expo SDK 57 application is the native host for the Erikli chat widget. The chat tab loads that frontend directly through react-native-webview.

The native boundary has five responsibilities:

1. take a CRM customer id, exchange it for that customer's CereMeet token, and hold the resulting session;
2. inject the optional API URL, the allowlisted public user context, and the session token before frontend code runs;
3. classify WebView navigation by URL origin and scheme;
4. parse one of two exact lowercase native actions (MainPage, ProfileScreen);
5. replace the native route with /main-page or /profile-screen and provide a route back to chat.

The widget owns conversation transport and rendering, and is the only component that attaches the bearer to backend calls. Do not move conversation transport into this repository.

This host does own the token, because the backend gate requires one per session and the widget has no login of its own. Ownership stops at verify-hold-inject: never persist a token, put it in a route param, log it, or send it anywhere other than `window.__CHAT_BACKEND_CONTEXT__.token`. A redirect-based identity provider is still unsupported — cross-origin HTTP(S) navigation leaves the WebView and would need a separately designed system-browser/deep-link callback.

## Environment contract

env.sample defines the supported Expo fields:

- EXPO_PUBLIC_CAI_FRONTEND_URL: required WebView source;
- EXPO_PUBLIC_CAI_API_BASE_URL: optional window.__CAI_API_BASE_URL__ override;
- EXPO_PUBLIC_CAI_LANGUAGE: optional public language context;
- EXPO_PUBLIC_CAI_COUNTRY: optional public country context;
- EXPO_PUBLIC_CAI_WATERS_LOGIN_KEY: required service key for the watersLogin exchange;
- EXPO_PUBLIC_CAI_SAMPLE_USER_{1..5}_LABEL: optional login-screen display name;
- EXPO_PUBLIC_CAI_SAMPLE_USER_{1..5}_CUSTOMER_ID: that sample user's CRM customer id.

There is no userId/userName field: identity is derived from the token server-side, and the host injects the derived `consumer_id` so a configured value can never disagree with the signed-in user. The sample-user customer ids are identifiers, not credentials.

The login key is the sole exception to "no credentials in EXPO_PUBLIC_ fields", and it is a deliberate, bounded one: this is a test harness, Expo bakes the key into the bundle, and a bundle holder can then sign in as any customer id. Only the pre-production key belongs there, no build of this host may be distributed, and a production app must move the exchange behind its own backend. Add no other credential field.

Expo inlines `process.env.EXPO_PUBLIC_*` through a build-time Babel transform, so every variable must be referenced as a static literal — `process.env[name]` is undefined in a bundled app. That is why services/sampleUsers.ts declares five fixed slots instead of looping.

Device and emulator URLs must resolve back to the development host; Android Emulator host services use 10.0.2.2 rather than device-local localhost. The bootstrap allowlist discards unsupported property names, but it does not inspect the content of the values it does allow; callers own the safety of those.

## Bridge contract

Accept only these exact, case-sensitive shapes. The flow's closing redirect:

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

The widget's X (close) button:

~~~json
{
  "output_type": "navigation",
  "process": "GotoPage",
  "data": {
    "page_name": "ProfileScreen",
    "address_id": "optional id of the address the user picked in the conversation"
  }
}
~~~

The parser uses a per-page exact key allowlist, held in `PAGE_ROUTES` in services/navigationAction.ts: MainPage → /main-page with {case_id, address_id}; ProfileScreen → /profile-screen with {address_id} only. It rejects malformed input, extra keys, unknown action or page values, and a non-string id. A case_id on ProfileScreen is an unknown key and fatal — the X button never carries an incident. Every id is independently optional: missing, empty, or whitespace-only values are dropped from the route params while navigation still happens, and an envelope carrying none still maps to its page's route. Preserve a nonblank value byte-for-byte. Adding a page or id does not widen any page to unknown keys — anything outside that page's list remains fatal.

Navigation is deferred by NAVIGATION_DELAY_MS (5s), exported from app/(tabs)/chat.tsx, so the flow's closing message can be read before the route changes. The in-flight flag is claimed when the envelope arrives, not when the timer fires, so repeat deliveries during the wait are suppressed rather than queueing a second redirect; the pending timer is cleared on unmount so it cannot fire against a screen the user has already left. Both pages share this one delay and guard. app/main-page.tsx displays the incident ID and the address ID, each or Not provided; app/profile-screen.tsx displays the address ID or Not provided; both replace with /(tabs)/chat from Back to chat.

The wait is not a confirmation step: it is unattended and has no prompt or cancel affordance. Do not add one, and do not persist bridge messages for replay.

## URL and cache contract

services/webViewUrlPolicy.ts is the source of URL decisions:

- valid same-origin HTTP(S): allow in the WebView;
- cross-origin HTTP(S), tel, and mailto: open through Linking;
- malformed, unsupported, or unsafe schemes: block.

`originWhitelist` on components/ChatWebView.tsx is what decides *who* classifies a URL, not what is permitted. react-native-webview consults `onShouldStartLoadWithRequest` only for schemes on that list; everything else it opens itself behind a `Linking.canOpenURL` check (`WebViewShared.createOnShouldStartLoadWithRequest` — our handler is the `else if`). With the default `['http://*','https://*']` a `tel:` URL never reached this repo's policy at all, and `canOpenURL` reports false on Android 11+ unless the app declares a `<queries>` entry for the dial intent, so the customer-service chip only ever logged `Can't open url: tel:4440222,1`. `openURL` itself succeeds in that case — package visibility filters the query, not the launch. The list therefore carries `tel:*` and `mailto:*`; classifyWebViewUrl still makes the actual decision, so nothing is widened.

Opening an external URL is not a single attempt. `Linking.openURL` is typed `Promise<void>`, but iOS signals a declined open by resolving **false** rather than rejecting, and RCTLinkingManager does exactly that for every `tel:` URL on the Simulator. Treat a resolved `false` as failure; treat a resolved `undefined` as success so a platform that reports nothing is not read as a refusal.

services/dialUrl.ts then supplies the retry order for `tel:`. The catalog authors the customer-service number with a post-dial suffix (`tel:4440222,1` — dial, then send DTMF 1 for the IVR branch), which is approved content pinned byte-identical across seven locales and must not be rewritten upstream. iOS refuses `tel:` numbers containing a pause character, so the host tries the authored URL first and falls back to the bare number. Other schemes yield exactly one candidate and are never rewritten — a comma is legal in a query string.

No `tel:` URL can dial on the iOS Simulator; that path is only testable on a device.

components/ChatWebView.tsx disables the WebView document cache with cacheEnabled=false and cacheMode=LOAD_NO_CACHE. DOM storage stays enabled for the frontend session. Log fixed diagnostic text only; do not log URLs, identity context, route params, or credentials.

The current component intentionally retains mixedContentMode="compatibility" and thirdPartyCookiesEnabled={true}. Treat both as production-hardening concerns; do not change them without a separately designed and device-tested WebView policy.

## Auth contract

Sign-in is two CereMeet calls, both in `services/ceremeetAuth.ts`:

`watersLogin` posts `{customer_id}` to `https://api.ceremeet.com/api/auth/watersLogin` with the service key as the bearer and returns `access_token` from the response. Its reason codes are prefixed `ceremeet_login_*` to stay distinguishable from the gate's.

`verifyCereMeetUser` then calls `GET https://api.ceremeet.com/api/users/me` with the minted token and authorizes on `HTTP 200 + a user object + isWatersUser`, deriving `consumer_id` from the email local part. It is a pre-flight mirror of the backend gate (`CAICore/src/infra/external/ceremeet/widget_auth.verify_widget_user`) and its `ceremeet_api_*` reason codes are kept byte-identical to that gate's, so a failure shown at sign-in matches what the backend would have reported. Keep them in sync; add a reason code in both or neither.

Do not collapse the second call away because watersLogin already returns `userInfo.isWatersUser`: verifying the minted token is what catches a token that logs in but would be refused mid-conversation.

`hooks/useAuthSession.tsx` holds the session in React state only — no AsyncStorage, no SecureStore, no route param. Relaunching returns to the login screen by design.

`app/(tabs)/chat.tsx` redirects to /login whenever the session is null, so the WebView is never mounted without a verified token. Do not add a bypass, a guest mode, or a default token: the backend now rejects tokenless sessions, and a bypass here would only hide that.

The token reaches the widget through `injectedJavaScriptBeforeContentLoaded`, never `injectedJavaScript`, which runs after the widget has read the global. The contract is specified by the backend repository's `docs/mobile-app-widget-integration.md`.

## Code ownership

- components/ChatWebView.tsx: direct widget loading, bootstrap injection, URL enforcement, bridge event entry point;
- services/ceremeetAuth.ts: the watersLogin exchange, CereMeet verification, and consumer-id derivation;
- services/sampleUsers.ts: pure projection of the configured sample-user slots;
- hooks/useAuthSession.tsx: in-memory session state and the sign-in/sign-out actions;
- services/webViewBootstrap.ts: allowlisted serialization into browser globals;
- services/webViewUrlPolicy.ts: pure URL classifier;
- services/dialUrl.ts: pure `tel:` fallback-candidate builder;
- services/navigationAction.ts: pure strict bridge parser and route mapping;
- app/login.tsx: sample-user and typed-customer-id sign-in;
- app/(tabs)/chat.tsx: auth guard and immediate one-shot route replacement;
- app/main-page.tsx: optional incident and address display, and return-to-chat behavior;
- app/profile-screen.tsx: optional address display for the X-button redirect, and return-to-chat behavior;
- types/auth.ts: session, sample-user, and verification contracts;
- types/webview.ts: bridge and native route types;
- __tests__/: Jest and React Native Testing Library coverage.

Keep screens and the WebView component thin. Put deterministic parsing, projection, and policy logic in services. Keep shared contracts in types. Use strict TypeScript, two-space indentation, single-quoted TypeScript strings, trailing commas in multiline values, named exports for reusable modules, and default exports for Expo Router screens.

## Development commands

~~~bash
cp env.sample .env
npm ci
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo config --type public >/dev/null
chat_test_export_dir=$(mktemp -d .expo-export.XXXXXX)
npx expo export --platform android --output-dir "$chat_test_export_dir"
mv "$chat_test_export_dir" /tmp/
npx expo start --clear
~~~

Run npm ci before package checks.

Chat smoke needs the `nestle-waters-tr-go` stack (`docker compose up -d --build caicore webfrontend`), which serves both the backend and the widget. Leave its `WATERS_WIDGET_TEST_MODE` at the default `0`: setting it to `1` restores a shared bypass marker that authorizes a fixed test customer with no token, which makes the sign-in exercised here meaningless. Secrets for that stack live in its own git-ignored .env files.

Sign-in itself needs only network access to CereMeet, the watersLogin key, and a customer id for a Waters-flagged account.

A direct native API override (EXPO_PUBLIC_CAI_API_BASE_URL) also requires the backend to accept the WebView's exact frontend origin.

The live device smoke was not completed in this environment; do not infer it from passing automated checks.

## Documentation scope

README.md, this file, .planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md, .planning/STATE.md, and .planning/codebase describe the maintained implementation.

.planning/phases/01-migration contains dated historical records. Preserve those files as evidence; do not treat their superseded instructions as current guidance.

## GSD workflow

For future planned work, use the repository's GSD entry points:

- /gsd:quick for small fixes and documentation changes;
- /gsd:debug for investigation and bug fixing;
- /gsd:execute-phase for planned phase work.
