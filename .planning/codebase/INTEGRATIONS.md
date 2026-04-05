# External Integrations

**Analysis Date:** 2026-04-05

## APIs & External Services

**Chat / Customer Support:**
- Chatwoot - Self-hosted customer chat platform embedded as a web widget
  - SDK/Client: Chatwoot JavaScript SDK loaded at runtime from `{EXPO_PUBLIC_CHATWOOT_BASE_URL}/packs/js/sdk.js`
  - Auth: `EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN` (identifies the website/inbox), `EXPO_PUBLIC_CHATWOOT_ACCESS_TOKEN` (passed as a custom attribute), `EXPO_PUBLIC_CHATWOOT_CUSTOMER_CONNECTION_ID` (passed as a custom attribute)
  - User identity: `EXPO_PUBLIC_CHATWOOT_USER_ID` is passed to `window.$chatwoot.setUser()` on widget ready
  - Base URL: `EXPO_PUBLIC_CHATWOOT_BASE_URL` (default `https://chat.footgolflegends.com`)
  - Integration point: `components/ChatWebView.tsx` — the entire HTML page with embedded Chatwoot SDK is rendered inside a `react-native-webview` instance
  - Custom attributes set: `access_token`, `customer_connection_id`

## Data Storage

**Databases:**
- None — no database client detected

**File Storage:**
- Local filesystem only (font and image assets bundled in `assets/`)

**Caching:**
- None — `WebViewMessageHandler` (`services/WebViewMessageHandler.ts`) maintains an in-memory message log (capped at 100 entries) for debug purposes only

## Authentication & Identity

**Auth Provider:**
- None — no dedicated auth provider (no Supabase, Firebase Auth, Auth0, etc.)
- User identity is passed directly to Chatwoot via env vars (`EXPO_PUBLIC_CHATWOOT_USER_ID`, `EXPO_PUBLIC_CHATWOOT_ACCESS_TOKEN`) at widget initialisation time
- Implementation: values are interpolated as string literals into the HTML content inside `components/ChatWebView.tsx`

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar SDK detected

**Logs:**
- `console.log` / `console.error` / `console.warn` throughout
- WebView-side logs are forwarded to React Native via `postMessage` with `Process: 'Log'`; handled in `services/WebViewMessageHandler.ts`
- In-memory message history accessible via `WebViewMessageHandler.getMessageHistory()` (dev/debug use only)

## CI/CD & Deployment

**Hosting:**
- Not configured — no `eas.json`, no GitHub Actions workflows, no Vercel/Netlify config detected

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars (from `env.sample`):**
- `EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN` — Chatwoot inbox website token
- `EXPO_PUBLIC_CHATWOOT_USER_ID` — User identifier passed to Chatwoot
- `EXPO_PUBLIC_CHATWOOT_ACCESS_TOKEN` — Access token set as a Chatwoot custom attribute
- `EXPO_PUBLIC_CHATWOOT_CUSTOMER_CONNECTION_ID` — Customer connection ID set as a Chatwoot custom attribute
- `EXPO_PUBLIC_CHATWOOT_BASE_URL` — Base URL of the Chatwoot instance (default: `https://chat.footgolflegends.com`)

**Secrets location:**
- `.env` file at project root (gitignored); `env.sample` is the committed template
- All values are `EXPO_PUBLIC_` prefixed — they are bundled into the client and visible to users at runtime; treat as low-sensitivity configuration tokens, not high-security secrets

## Webhooks & Callbacks

**Incoming:**
- None — the app does not expose any server-side webhook endpoints

**Outgoing:**
- None — the app does not send webhooks to external services

## Message Bridge (Internal Integration)

The primary integration mechanism is a bidirectional message bridge between the React Native layer and the Chatwoot widget running inside the WebView.

**Inbound (WebView → React Native):**
- The widget HTML page listens for `window.addEventListener('message', ...)` events from the Chatwoot iframe
- Messages prefixed with `chatwoot-widget:` are parsed and forwarded to React Native via `window.ReactNativeWebView.postMessage()`
- Handled message types: `GotoPage`, `ChatMessage`, `Log`, `Error`
- Handler class: `services/WebViewMessageHandler.ts`

**Outbound (React Native → WebView):**
- Not currently implemented (no `webViewRef.current.injectJavaScript()` calls in the main flow)

**Navigation messages:**
- The Chatwoot widget can trigger navigation in the host app by posting `{ Process: 'GotoPage', Data: { PageName, CaseId } }`
- The back button inside the Chatwoot widget is intercepted via DOM manipulation to send `GotoPage` to React Native (hardcoded destination `AddressesScreen` / `CaseId: 'xxx'` — see `components/ChatWebView.tsx` ~line 459)

**External URL handling:**
- Any HTTP/HTTPS URL whose host differs from `EXPO_PUBLIC_CHATWOOT_BASE_URL` is intercepted in `onShouldStartLoadWithRequest` and opened via `Linking.openURL()` in the system browser rather than inside the WebView

---

*Integration audit: 2026-04-05*
