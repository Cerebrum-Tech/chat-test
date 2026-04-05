# Architecture

**Analysis Date:** 2026-04-05

## Pattern Overview

**Overall:** React Native (Expo) mobile app with file-based routing and an embedded WebView that bridges a Chatwoot chat widget to native navigation.

**Key Characteristics:**
- File-based routing via `expo-router` — screens are defined by filesystem structure under `app/`
- Thin screen layer delegates WebView message processing to a dedicated service class
- Bidirectional message bridge: React Native injects JavaScript into the WebView; the WebView posts structured messages back via `ReactNativeWebView.postMessage`
- Platform-adaptive UI using dark/light theming with a `useThemeColor` hook

## Layers

**Routing / Screen Layer:**
- Purpose: Define navigable screens; own top-level state for the screen lifecycle
- Location: `app/` and `app/(tabs)/`
- Contains: Screen components (`chat.tsx`, `index.tsx`, `explore.tsx`), layout files (`_layout.tsx`)
- Depends on: `components/`, `services/`, `types/`
- Used by: `expo-router` file-system router

**Component Layer:**
- Purpose: Reusable, presentational React Native components
- Location: `components/` and `components/ui/`
- Contains: `ChatWebView.tsx` (WebView shell + injected JS), `ConfirmationModal.tsx`, themed primitives (`ThemedText`, `ThemedView`), platform UI helpers (`IconSymbol`, `TabBarBackground`, `HapticTab`)
- Depends on: `types/`, `constants/`, `hooks/`
- Used by: Screen layer

**Service Layer:**
- Purpose: Business logic for processing WebView messages, maintaining a message log, and dispatching typed callbacks
- Location: `services/`
- Contains: `WebViewMessageHandler.ts` (class-based, instantiated via `useRef` in screens)
- Depends on: `types/`
- Used by: Screen layer (`app/(tabs)/chat.tsx`)

**Types Layer:**
- Purpose: Shared TypeScript interfaces for the WebView message protocol
- Location: `types/`
- Contains: `webview.ts` — `WebViewMessage`, `GotoPageMessage`, `ChatWebViewProps`
- Depends on: nothing
- Used by: all layers

**Constants / Hooks Layer:**
- Purpose: App-wide theming values and React hooks
- Location: `constants/`, `hooks/`
- Contains: `Colors.ts` (light/dark palettes), `useColorScheme.ts`, `useThemeColor.ts`
- Depends on: nothing
- Used by: Component layer, layout files

## Data Flow

**Inbound WebView Message (Chatwoot widget → React Native):**

1. Chatwoot widget (running inside `ChatWebView` HTML) fires `window.$chatwoot` events or intercepts back-button clicks
2. Injected JavaScript calls `safePostMessage({ Process, Data })` which calls `window.ReactNativeWebView.postMessage(JSON.stringify(...))`
3. `ChatWebView.handleWebViewMessage` (in `components/ChatWebView.tsx`) receives the raw `WebViewMessageEvent`, parses JSON, switches on `message.Process`
4. The parsed `WebViewMessage` is passed up via the `onMessage` prop callback to the screen
5. `ChatScreen` (`app/(tabs)/chat.tsx`) delegates to `WebViewMessageHandler.handleMessage()` (service class held in `useRef`)
6. The handler invokes the appropriate typed callback (`onGotoPage`, `onChatMessage`, etc.) and appends to its internal `messageLog`
7. `onGotoPage` sets `pendingNavigation` state and opens `ConfirmationModal` for user confirmation

**Outbound Navigation Confirmation:**

1. User confirms in `ConfirmationModal`
2. `handleConfirmNavigation` in `chat.tsx` receives `pendingNavigation` and executes native navigation (currently `console.log` stub — actual router call to be implemented)

**Theme Application:**

1. `RootLayout` (`app/_layout.tsx`) reads `useColorScheme`, wraps the app in `@react-navigation/native` `ThemeProvider`
2. Themed components call `useThemeColor` which reads from `constants/Colors.ts`

**State Management:**
- No global state store. All state is local React `useState` within individual screen components.
- `WebViewMessageHandler` instance is persisted across renders via `useRef` in `chat.tsx`.

## Key Abstractions

**WebViewMessage protocol:**
- Purpose: Typed envelope for all messages between the Chatwoot widget and React Native
- Examples: `types/webview.ts`
- Pattern: `{ Process: string, Data: any }` — discriminated by `Process` values: `'GotoPage'`, `'ChatMessage'`, `'Log'`, `'Error'`

**ChatWebView:**
- Purpose: Encapsulates the WebView shell, injects the Chatwoot SDK HTML, registers JavaScript handlers, and intercepts navigation requests to route external links via `Linking`
- Examples: `components/ChatWebView.tsx`
- Pattern: Functional component with `useRef<WebView>` for imperative access; reads env vars directly from `process.env.EXPO_PUBLIC_*`

**WebViewMessageHandler (service class):**
- Purpose: Stateful message dispatcher; maintains a capped log of the last 100 messages and provides `getMessageHistory()` / `getMessageStats()` for debugging
- Examples: `services/WebViewMessageHandler.ts`
- Pattern: Plain TypeScript class instantiated once per screen via `useRef`

**Themed primitives:**
- Purpose: `ThemedText` and `ThemedView` automatically apply light/dark colors from the palette
- Examples: `components/ThemedText.tsx`, `components/ThemedView.tsx`
- Pattern: Wrap native RN primitives; accept `lightColor`/`darkColor` overrides; fall back to `useThemeColor`

## Entry Points

**App Bootstrap:**
- Location: `app/_layout.tsx`
- Triggers: Expo Router mounts this as the root Stack navigator
- Responsibilities: Load fonts, apply theme provider, define root stack screens

**Tab Navigation:**
- Location: `app/(tabs)/_layout.tsx`
- Triggers: Root Stack renders the `(tabs)` group
- Responsibilities: Configure three tab screens (Home, Chat, Explore) with icons and haptic feedback

**Chat Screen (primary feature):**
- Location: `app/(tabs)/chat.tsx`
- Triggers: User taps the Chat tab
- Responsibilities: Render `ChatWebView`, manage visibility toggle, own `WebViewMessageHandler` instance, handle navigation confirmation flow

**404 Handler:**
- Location: `app/+not-found.tsx`
- Triggers: `expo-router` navigates to an unrecognised route
- Responsibilities: Display error message and link back to home

## Error Handling

**Strategy:** Local, per-component with `console.error` logging; surface errors to users via `Alert.alert`.

**Patterns:**
- `ChatWebView` wraps `JSON.parse` in try/catch and logs raw message on failure
- `WebViewMessageHandler.handleMessage` wraps the entire dispatch in try/catch, marks the log entry as `handled: false` on exception
- WebView load errors (`onError`, `onHttpError`) log to console
- External link failures (`Linking.openURL`) log via `console.error`
- Chatwoot widget errors are forwarded as `Process: 'Error'` messages back to the native layer

## Cross-Cutting Concerns

**Logging:** `console.log` / `console.error` throughout; no structured logging library. `WebViewMessageHandler` keeps an in-memory ring buffer (100 entries) accessible via `getMessageHistory()`.

**Validation:** None beyond TypeScript types; `WebViewMessage.Data` is typed `any`.

**Authentication:** Chatwoot user identity set via `window.$chatwoot.setUser()` and `setCustomAttributes()` inside injected JS, sourced from `EXPO_PUBLIC_*` env vars at build time.

---

*Architecture analysis: 2026-04-05*
