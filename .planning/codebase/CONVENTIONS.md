# Conventions

**Updated:** 2026-07-21

## TypeScript and formatting

- TypeScript strict mode is required.
- Use two-space indentation.
- Use single quotes in TypeScript.
- Use trailing commas for multiline objects, arrays, parameters, and imports.
- Prefer short guard clauses over deep nesting.
- Keep pure decisions in exported functions that return typed values.
- Avoid any unless an external test/mock boundary requires it.
- Use the @/ alias for stable project-root imports and relative imports for nearby feature files.

## Naming

- Expo Router screens and layouts use default exports.
- Reusable components use named exports and component-style file names, such as ChatWebView.tsx.
- Pure service modules use descriptive camel-case file names, such as navigationAction.ts and webViewUrlPolicy.ts.
- Interfaces and type aliases use descriptive type names without an I prefix.
- Event handlers start with handle.
- Boolean refs and state describe their condition, such as navigationInFlight.
- Platform variants use suffixes such as .ios.tsx and .web.ts.

Bridge naming is a wire contract, not a TypeScript naming preference. Its key names are lowercase and case-sensitive: output_type, process, data, page_name, and case_id.

## Module boundaries

- Screens compose components and invoke typed navigation.
- ChatWebView owns WebView props and delegates deterministic logic.
- services contains bootstrap projection, raw bridge parsing, and URL classification.
- types contains shared boundary shapes.
- Pure service modules do not import React Native or Expo Router.
- Do not put authentication, conversation REST, or SSE clients in the native host; those belong to the global frontend.

## Environment and security

- Read only the six documented EXPO_PUBLIC_CAI_* fields.
- Treat every Expo public field as user-visible configuration.
- Inject only window.__CAI_API_BASE_URL__ and allowlisted window.__CHAT_BACKEND_CONTEXT__ properties.
- Do not inject or log authentication credentials.
- JSON-serialize browser values; never concatenate unescaped input into JavaScript.
- Use fixed warning text. Do not log raw messages, URLs, identity, or route params.

## Bridge parsing

- Parse raw input inside try/catch.
- Require the exact top-level and data key sets.
- Require output_type=navigation, process=GotoPage, and page_name=MainPage.
- Reject extra properties and unknown values.
- Accept case_id only as a string.
- Use trim only to determine whether case_id is blank; preserve a nonblank value exactly.
- Return null for every unsupported input.
- Map through an explicit route allowlist. Never accept an arbitrary native pathname.

## Navigation

- Use router.replace for the bridge destination and Back to chat.
- Route immediately after validation.
- Suppress callbacks after the first replacement while the chat screen is still mounted.
- Do not add a confirmation stage or persist received bridge messages.

## URL and WebView policy

- Compare parsed URL origins, not hostname strings.
- Keep valid same-origin HTTP(S) inside the WebView.
- Send only cross-origin HTTP(S), tel, and mailto through Linking.
- Block malformed and unsupported schemes by default.
- Keep cacheEnabled=false, cacheMode=LOAD_NO_CACHE, and domStorageEnabled=true unless a reviewed requirement changes the session model.

## Tests

- Name Jest files *-test.ts or *-test.tsx under __tests__.
- Unit-test pure services with table-driven cases where policy inputs form a matrix.
- Component-test WebView wiring and Expo Router calls with narrow mocks.
- Assert rejected input as well as accepted input.
- Run npm test -- --runInBand, npm run typecheck, and npm run lint before commit.
- Run Expo public config and Android export for host-level changes.

## Documentation

Maintained guidance lives in README.md, CLAUDE.md, .planning top-level project documents, and .planning/codebase. Files below .planning/phases/01-migration are immutable historical records unless a separate archival correction is explicitly requested.
