# Architecture

**Updated:** 2026-07-21

## Overview

The application is an Expo Router native shell around the global CAICore Vite frontend. The boundary is deliberately narrow: bootstrap public context before the page loads, enforce URL policy, parse one bridge action, and route to one native screen.

The browser application owns conversations REST calls, SSE ingestion, message rendering, and the rule that only newly ingested live actions are posted. If authentication is enabled, its AuthProvider is the only token owner. The current Erikli channel has `auth.enabled: false`, so the supported Expo path has no login. The native application owns the WebView container and native routing.

## Runtime layers

### Screens

Location: app/

- app/_layout.tsx declares the root stack, including main-page.
- app/(tabs)/_layout.tsx declares Home, Chat, and Explore tabs.
- app/(tabs)/chat.tsx renders ChatWebView and performs one immediate route replacement.
- app/main-page.tsx displays the optional incident ID and returns to chat.

Screens depend on components, service outputs, and shared types. They do not parse raw bridge JSON or classify URLs.

### WebView component

Location: components/ChatWebView.tsx

ChatWebView:

- reads the six supported Expo environment fields;
- loads EXPO_PUBLIC_CAI_FRONTEND_URL directly;
- injects the bootstrap string before page content runs;
- delegates raw bridge parsing to services/navigationAction.ts;
- delegates URL decisions to services/webViewUrlPolicy.ts;
- opens supported external links with React Native Linking;
- disables document caching and retains DOM storage.

### Pure policy services

Location: services/

- webViewBootstrap.ts projects only apiBaseUrl, userId, userName, language, and country into a safely serialized script. This allowlists property names and types; it does not inspect allowed string values for sensitive content.
- webViewUrlPolicy.ts converts a requested URL and configured frontend URL into allow, open-external, or block.
- navigationAction.ts parses the exact lowercase envelope and returns a typed /main-page route request or null.

These functions are framework-independent and directly unit tested.

### Shared contracts

Location: types/webview.ts

The type module defines the exact navigation envelope, the native route request, and ChatWebView props. It has no runtime side effects.

## Startup flow

1. Expo Router mounts app/_layout.tsx and the tab navigator.
2. The Chat tab mounts ChatWebView.
3. ChatWebView builds injectedJavaScriptBeforeContentLoaded.
4. The script optionally assigns window.__CAI_API_BASE_URL__ and assigns window.__CHAT_BACKEND_CONTEXT__ with allowlisted public values.
5. The WebView requests the configured global Vite frontend URL directly.
6. The current auth-disabled frontend uses REST plus SSE for conversations without login.

The native script never supplies a token or authentication object. For a future auth-enabled target, AuthProvider remains the only token owner, but auth-enabled Expo hosting is unsupported until a separate system-browser/deep-link callback is designed and tested to preserve the WebView auth-result/session context.

## Cross-repository runtime dependency

Live native actions depend on the producer and dispatcher from global `feat/native-client-actions` commit `66c88d5` or a merged descendant. That global revision must be checked out for complete-stack smoke and deployed before this native host; otherwise REST/SSE can run but no compatible live action is produced for the bridge.

## Navigation flow

1. The live frontend posts an exact lowercase navigation envelope through window.ReactNativeWebView.
2. ChatWebView receives the current onMessage event.
3. parseNavigationRequest validates exact keys, values, and case_id type.
4. ChatWebView emits a typed MainPageNavigationRequest.
5. ChatScreen ignores the callback if a replacement is already in flight.
6. ChatScreen immediately calls router.replace for /main-page.
7. MainPage displays the exact nonblank case_id or Not provided.
8. Back to chat calls router.replace for /(tabs)/chat.

There is no native confirmation stage and no native message-history store. Re-entering chat mounts a new WebView; restored browser history is not interpreted by the native host.

## URL flow

1. The WebView asks whether a URL should load.
2. classifyWebViewUrl parses both the configured frontend URL and the request.
3. Same-origin HTTP(S) returns allow.
4. Cross-origin HTTP(S), tel, and mailto return open-external.
5. Invalid input and every other scheme return block.
6. ChatWebView opens only open-external decisions through Linking and returns false for every external or blocked request.

Origin comparison includes scheme, hostname, and effective port.

## Cache and session boundary

cacheEnabled=false and cacheMode=LOAD_NO_CACHE prevent document-cache reuse. incognito mode is not enabled. domStorageEnabled=true preserves browser storage while mounted.

`mixedContentMode="compatibility"` and `thirdPartyCookiesEnabled={true}` are intentional current settings retained for compatibility. They expand the production WebView surface and remain hardening concerns; changing them requires a separate policy design and device test. They do not make the unsupported auth-enabled browser callback work.

## Error and logging boundary

Pure policy functions return null or block for untrusted input. Native failures emit fixed diagnostic text only. URLs, environment values, identities, credentials, raw bridge messages, and case_id values are not logged.
