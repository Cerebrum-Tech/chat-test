# CAICore native host guidance

## Project

This Expo SDK 53 application is the native host for the global CAICore Vite frontend. The chat tab loads that frontend directly through react-native-webview.

The native boundary has four responsibilities:

1. inject the optional API URL and allowlisted public user context before frontend code runs;
2. classify WebView navigation by URL origin and scheme;
3. parse one exact lowercase native action;
4. replace the native route with /main-page and provide a route back to chat.

The global frontend owns its AuthProvider, conversations REST requests, SSE ingestion, live-action deduplication, and rendering. Do not move authentication or conversation transport into this repository. The native host must not inject a token.

## Environment contract

env.sample defines the only six supported Expo fields:

- EXPO_PUBLIC_CAI_FRONTEND_URL: required WebView source;
- EXPO_PUBLIC_CAI_API_BASE_URL: optional window.__CAI_API_BASE_URL__ override;
- EXPO_PUBLIC_CAI_USER_ID: optional public userId context;
- EXPO_PUBLIC_CAI_USER_NAME: optional public userName context;
- EXPO_PUBLIC_CAI_LANGUAGE: optional public language context;
- EXPO_PUBLIC_CAI_COUNTRY: optional public country context.

All fields are public client configuration. Never add secrets or authentication credentials to an EXPO_PUBLIC_ field. Device and emulator URLs must resolve back to the development host; Android Emulator host services use 10.0.2.2 rather than device-local localhost.

## Bridge contract

Accept only this exact, case-sensitive shape:

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

The parser uses an exact key allowlist. It rejects malformed input, extra keys, unknown action values, and non-string case_id values. Missing, empty, or whitespace-only case_id values map to /main-page without route params. Preserve a nonblank value byte-for-byte.

Navigation is immediate. app/(tabs)/chat.tsx calls router.replace once and suppresses repeated callbacks during unmount. app/main-page.tsx displays the incident ID or Not provided and Back to chat replaces with /(tabs)/chat. Do not add a native confirmation step or persist bridge messages for replay.

## URL and cache contract

services/webViewUrlPolicy.ts is the source of URL decisions:

- valid same-origin HTTP(S): allow in the WebView;
- cross-origin HTTP(S), tel, and mailto: open through Linking;
- malformed, unsupported, or unsafe schemes: block.

components/ChatWebView.tsx disables the WebView document cache with cacheEnabled=false and cacheMode=LOAD_NO_CACHE. DOM storage stays enabled for the frontend session. Log fixed diagnostic text only; do not log URLs, identity context, route params, or credentials.

## Code ownership

- components/ChatWebView.tsx: direct Vite loading, bootstrap injection, URL enforcement, bridge event entry point;
- services/webViewBootstrap.ts: allowlisted serialization into browser globals;
- services/webViewUrlPolicy.ts: pure URL classifier;
- services/navigationAction.ts: pure strict bridge parser and route mapping;
- app/(tabs)/chat.tsx: immediate one-shot route replacement;
- app/main-page.tsx: optional incident display and return-to-chat behavior;
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

Run npm ci before package checks. Use the global repository's documented docker-compose.dev.yaml workflow and a separately running Vite frontend for a complete device smoke.

## Documentation scope

README.md, this file, .planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md, .planning/STATE.md, and .planning/codebase describe the maintained implementation.

.planning/phases/01-migration contains dated historical records. Preserve those files as evidence; do not treat their superseded instructions as current guidance.

## GSD workflow

For future planned work, use the repository's GSD entry points:

- /gsd:quick for small fixes and documentation changes;
- /gsd:debug for investigation and bug fixing;
- /gsd:execute-phase for planned phase work.
