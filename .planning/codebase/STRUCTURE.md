# Codebase structure

**Updated:** 2026-07-21

## Directory layout

~~~text
chat-test/
├── __tests__/
│   ├── chat-screen-test.tsx
│   ├── chat-web-view-test.tsx
│   ├── main-page-test.tsx
│   ├── navigation-action-test.ts
│   ├── test-setup-test.ts
│   ├── web-view-bootstrap-test.ts
│   └── web-view-url-policy-test.ts
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── chat.tsx
│   │   ├── explore.tsx
│   │   └── index.tsx
│   ├── +not-found.tsx
│   ├── _layout.tsx
│   └── main-page.tsx
├── components/
│   ├── ChatWebView.tsx
│   ├── Collapsible.tsx
│   ├── ExternalLink.tsx
│   ├── HapticTab.tsx
│   ├── HelloWave.tsx
│   ├── ParallaxScrollView.tsx
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   └── ui/
├── constants/
├── hooks/
├── services/
│   ├── navigationAction.ts
│   ├── webViewBootstrap.ts
│   └── webViewUrlPolicy.ts
├── types/
│   └── webview.ts
├── assets/
├── scripts/
├── .planning/
│   ├── codebase/
│   ├── phases/01-migration/
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   └── STATE.md
├── app.json
├── env.sample
├── eslint.config.js
├── package-lock.json
├── package.json
└── tsconfig.json
~~~

## Primary feature files

### app/(tabs)/chat.tsx

Owns the native chat screen lifecycle. It receives typed navigation requests, suppresses repeated callbacks after the first accepted request, and immediately calls router.replace.

### app/main-page.tsx

Owns the destination screen. It reads the optional case_id and address_id route params, displays the first value of each or Not provided, and replaces back to the chat tab.

### components/ChatWebView.tsx

Owns WebView configuration: direct frontend source, pre-content bootstrap, bridge event entry, URL enforcement, external Linking, and no-cache props.

### services/navigationAction.ts

Pure parser for the exact lowercase bridge action and explicit MainPage route allowlist.

### services/webViewBootstrap.ts

Pure serializer for the optional API URL and four allowlisted public context properties.

### services/webViewUrlPolicy.ts

Pure parsed-origin and scheme classifier.

### types/webview.ts

Shared action, route request, and component prop types.

## Test layout

All Jest suites live in the top-level __tests__ directory. Pure service suites cover branch matrices; component suites mock react-native-webview or expo-router only at their integration boundary.

## Where to add code

- Add Expo Router screens below app and register explicit stack or tab options where needed.
- Add reusable native components below components.
- Add deterministic WebView-boundary policies below services.
- Add shared bridge and route contracts below types.
- Add a focused top-level __tests__ suite for every new behavior.

Do not add authentication state, conversation REST calls, or SSE handling to the native folders. Those remain in the global frontend.

## Planning documents

Top-level .planning files and .planning/codebase are maintained descriptions. .planning/phases/01-migration contains historical plans and outcomes; it is deliberately not rewritten during current documentation maintenance.
