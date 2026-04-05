# Phase 1: Migration - Research

**Researched:** 2026-04-05
**Domain:** react-native-webview URL loading, JavaScript injection, auth context passing
**Confidence:** HIGH

## Summary

This phase is a focused rewrite of `components/ChatWebView.tsx` (and supporting files) that replaces ~580 lines of inline HTML, Chatwoot SDK glue, and DOM-hack JavaScript with a ~90-line component that loads the Waters Bot WebFrontend URL directly. The entire Chatwoot-specific layer — SDK script injection, bubble hiding, back-button override, MutationObserver, ChatMessage/Log/Error bridge — is deleted. What remains is: load URL, inject two globals before boot, handle GotoPage messages, intercept external links.

The key technical mechanism is `injectedJavaScriptBeforeContentLoaded` on the `<WebView>` component. This prop accepts a JS string that executes in the WebView's JavaScript context before the page's own scripts run. That is exactly the right hook for setting `window.__CHAT_BACKEND_AUTH__` and `window.__CHAT_BACKEND_CONTEXT__` — the WebFrontend reads these globals during its React bootstrap, so they must exist before the app mounts.

The simplification is additive in confidence: fewer moving parts, no DOM-targeting heuristics, no polling loops. The risk surface is the JavaScript string injected for auth — it must produce valid JS, must `true`-terminate (react-native-webview requirement), and must serialize the env var values safely. Everything else in the migration is straightforward deletion and substitution.

**Primary recommendation:** Rewrite `ChatWebView.tsx` to load `source={{ uri }}`, inject auth globals via `injectedJavaScriptBeforeContentLoaded`, keep the existing `onShouldStartLoadWithRequest` external-link logic (updating host comparison to the Waters Bot URL), and keep the `onMessage` handler narrowed to GotoPage only.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `window.__CHAT_BACKEND_AUTH__` shape is `{ type: "ceremeet", token: ACCESS_TOKEN }` — token comes from `EXPO_PUBLIC_WATERS_ACCESS_TOKEN` env var
- **D-02:** `window.__CHAT_BACKEND_CONTEXT__` shape is `{ userId?: string, userName?: string, language?: string, country?: string }` — all fields optional
- **D-03:** For Phase 1, populate only `userId` (from `EXPO_PUBLIC_WATERS_USER_ID`) and `language` (from `EXPO_PUBLIC_WATERS_LANGUAGE`). Leave `userName` and `country` undefined.
- **D-04:** Simplify message bridge to handle **GotoPage only** — drop ChatMessage, Log, Error, and unknown message type handling
- **D-05:** External link interception stays — `handleShouldStartLoadWithRequest` updated to compare against the Waters Bot host instead of Chatwoot base URL
- **D-06:** `WebViewMessageHandler.ts` (service class) simplified to match — remove ChatMessage/Log/Error dispatch branches
- **D-07:** `types/webview.ts` trimmed to GotoPage and base envelope only — remove ChatMessage, Log, Error process types
- **D-08:** `chat.tsx` (screen) simplified — remove WebViewMessageHandler useRef, message history toggle, stats display. Screen just renders ChatWebView and handles GotoPage navigation.
- **D-09:** All inline HTML removed — no Chatwoot SDK, no DOM hacks (bubble hiding, back button override, MutationObserver)

### Claude's Discretion

- WebView props to retain vs remove (userAgent, thirdPartyCookiesEnabled, mixedContentMode, etc.) — Claude decides based on what the Waters Bot URL needs
- Console logging approach in the simplified component

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENV-01 | Replace 5 Chatwoot env vars with 4 Waters Bot env vars in env.sample | Direct substitution: remove CHATWOOT_* vars, add WATERS_BOT_URL, WATERS_USER_ID, WATERS_ACCESS_TOKEN, WATERS_LANGUAGE |
| ENV-02 | Configure EXPO_PUBLIC_WATERS_BOT_URL pointing to watersbot.footgolflegends.com | Standard EXPO_PUBLIC_ var pattern already in use; URL read directly in component |
| ENV-03 | Configure EXPO_PUBLIC_WATERS_USER_ID, EXPO_PUBLIC_WATERS_ACCESS_TOKEN, EXPO_PUBLIC_WATERS_LANGUAGE | Same pattern; all three read in component to build injection string |
| WEB-01 | Load WebFrontend URL directly via `source={{ uri }}` instead of inline HTML | Switch from `source={{ html: htmlContent }}` to `source={{ uri: watersUrl }}` — standard WebView prop |
| WEB-02 | Inject `window.__CHAT_BACKEND_AUTH__` with Ceremeet token before page load | Use existing `injectedJavaScriptBeforeContentLoaded` prop; append auth assignment to injection string |
| WEB-03 | Inject `window.__CHAT_BACKEND_CONTEXT__` with userId/language before page load | Same injection string block; serialize context object as JSON.stringify output |
| WEB-04 | Maintain ReactNativeWebView.postMessage bridge for GotoPage navigation | Existing `handleWebViewMessage` + `onMessage` prop already handles GotoPage; remove other branches |
| WEB-05 | External links continue opening in system browser | `handleShouldStartLoadWithRequest` logic unchanged; only update baseUrl variable to use EXPO_PUBLIC_WATERS_BOT_URL |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-webview | 13.13.5 (pinned) | WebView component | Already in project; no upgrade needed |
| expo-linking | ~7.1.7 (pinned) | Open external URLs in system browser | Already in project; used in current implementation |

No new dependencies needed. This phase is purely a rewrite within the existing stack.

**Version verification:** All versions confirmed from `package.json`. No package installs required for this phase.

## Architecture Patterns

### Recommended Project Structure

No structural changes. All files being modified already exist at their current paths:

```
components/
└── ChatWebView.tsx        # Primary rewrite (~580 lines → ~90 lines)
services/
└── WebViewMessageHandler.ts  # Simplified (remove ChatMessage/Log/Error branches)
types/
└── webview.ts             # Trimmed (remove unused process type variants)
app/(tabs)/
└── chat.tsx               # Simplified (remove messageHandler useRef, history UI)
env.sample                 # Updated (swap Chatwoot vars for Waters Bot vars)
```

### Pattern 1: URL Loading with Pre-Boot Global Injection

**What:** Load a remote URL in WebView while guaranteeing that two globals exist before the page's own JavaScript runs.

**When to use:** When the target web app reads configuration from globals set by the native host. The Waters Bot WebFrontend reads `window.__CHAT_BACKEND_AUTH__` and `window.__CHAT_BACKEND_CONTEXT__` during its React initialization.

**Example:**
```typescript
// Source: react-native-webview documentation — injectedJavaScriptBeforeContentLoaded
const injectedJavaScriptBeforeContentLoaded = `
  window.__CHAT_BACKEND_AUTH__ = ${JSON.stringify({
    type: 'ceremeet',
    token: accessToken
  })};
  window.__CHAT_BACKEND_CONTEXT__ = ${JSON.stringify({
    userId: userId || undefined,
    language: language || undefined
  })};
  true; // REQUIRED — react-native-webview discards injection if last expression is falsy
`;

<WebView
  source={{ uri: watersUrl }}
  injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
  onMessage={handleWebViewMessage}
  onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
  javaScriptEnabled={true}
  domStorageEnabled={true}
/>
```

**Critical detail:** The injection string MUST end with `true;`. react-native-webview evaluates the string and checks the return value. If falsy, the injection is silently discarded on some platforms (iOS in particular). The current code already follows this pattern — retain it.

### Pattern 2: GotoPage Message Handler (Narrowed)

**What:** Parse incoming WebView postMessage events and route GotoPage messages to the navigation callback. All other message types are ignored.

**When to use:** Post-migration — the Waters Bot WebFrontend only sends GotoPage messages; there is no Chatwoot-style ChatMessage/Log/Error protocol.

**Example:**
```typescript
const handleWebViewMessage = (event: WebViewMessageEvent) => {
  try {
    const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
    console.log('📥 WebView message:', {
      timestamp: new Date().toISOString(),
      process: message.Process,
    });
    if (message.Process === 'GotoPage' && onNavigationRequest) {
      onNavigationRequest(message.Data.PageName, message.Data.CaseId);
    }
    if (onMessage) {
      onMessage(message);
    }
  } catch (error) {
    console.error('❌ Error parsing WebView message:', error);
  }
};
```

### Pattern 3: External Link Interception (Host Swap Only)

**What:** `onShouldStartLoadWithRequest` checks whether a navigation request targets the same host as the Waters Bot URL. External hosts are opened in the system browser via `Linking.openURL`.

**When to use:** This logic is unchanged from the current implementation. Only the `baseUrl` variable name and source changes from `EXPO_PUBLIC_CHATWOOT_BASE_URL` to `EXPO_PUBLIC_WATERS_BOT_URL`.

**Example:**
```typescript
const watersUrl = process.env.EXPO_PUBLIC_WATERS_BOT_URL || '';

const handleShouldStartLoadWithRequest = (request: any) => {
  try {
    const url: string = request?.url || '';
    if (!url) return true;
    const isHttp = /^https?:\/\//i.test(url);
    const isDataOrAbout = /^(about:blank|data:|blob:)/i.test(url);
    if (!isHttp || isDataOrAbout) return true;
    const extractHost = (u: string) => u.replace(/^https?:\/\//i, '').split('/')[0];
    const baseHost = extractHost(watersUrl);
    const urlHost = extractHost(url);
    if (baseHost !== urlHost) {
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
      return false;
    }
    return true;
  } catch (e) {
    console.warn('onShouldStartLoadWithRequest guard failed, allowing navigation', e);
    return true;
  }
};
```

### Pattern 4: Simplified WebViewMessageHandler Service

**What:** Remove ChatMessage, Log, Error, and unknown-message branches. Retain GotoPage dispatch. Retain message log (capped at 100) and `getMessageHistory()` only if the screen still calls them — per D-08, the screen no longer exposes history UI, so the service can be reduced to a thin GotoPage dispatcher or removed entirely.

**Decision point (Claude's discretion — D-08):** The screen no longer needs `WebViewMessageHandler` at all once message history UI is removed. The GotoPage routing is two lines in ChatWebView's own `handleWebViewMessage`. However, D-06 says "simplified to match" rather than deleted. Keep the class but strip it to GotoPage-only; the screen can drop the `useRef` and call ChatWebView's `onNavigationRequest` directly.

### Anti-Patterns to Avoid

- **Keeping `source={{ html }}` and adding `uri` as a fallback:** The inline HTML must be completely removed per D-09. Having both would leave Chatwoot SDK references in the codebase.
- **Placing auth injection in `injectedJavaScript` (runs after load) instead of `injectedJavaScriptBeforeContentLoaded` (runs before):** The Waters Bot React app reads globals during mount. If injection runs after the page loads, the globals will be missing when the app initializes.
- **Serializing env vars with string interpolation instead of `JSON.stringify`:** Token values may contain characters that break JS syntax if interpolated directly. Always use `JSON.stringify(value)` for user-controlled values.
- **Omitting `true;` at end of injection string:** Silent failure on iOS — the injection appears to succeed but is discarded.
- **Leaving `userAgent` set to `"YourApp/1.0 (ReactNative)"`:** This is a placeholder from the original code. Either set it to an appropriate value or omit the prop entirely. Leaving placeholder text is noise.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pre-boot JS injection | Custom native module or postMessage handshake | `injectedJavaScriptBeforeContentLoaded` prop | Already supported; runs synchronously before page scripts |
| External URL routing | Custom navigation interceptor | `onShouldStartLoadWithRequest` + `Linking.openURL` | Already implemented; keep as-is |
| JSON serialization of auth object | String template with manual escaping | `JSON.stringify()` | Handles special characters, quotes, nulls correctly |

**Key insight:** The entire Chatwoot integration was hand-rolled because the SDK required DOM manipulation and iframe message forwarding. The Waters Bot WebFrontend exposes a clean globals API (`window.__CHAT_BACKEND_AUTH__`, `window.__CHAT_BACKEND_CONTEXT__`) — no hacks needed.

## Common Pitfalls

### Pitfall 1: `injectedJavaScriptBeforeContentLoaded` Missing `true;` Terminator

**What goes wrong:** Injection silently fails on iOS; the globals do not exist when the WebFrontend reads them. The chat interface loads but the user appears unauthenticated.

**Why it happens:** react-native-webview evaluates the injected string and checks the return value. If the last expression evaluates to a falsy value (e.g., an assignment expression returns `undefined` on some engines), the injection is dropped.

**How to avoid:** Always append `true;` as the final statement of any injection string. The current `injectedJavaScriptBeforeContentLoaded` in the codebase already does this — retain the pattern.

**Warning signs:** Globals are undefined when debugging the WebFrontend; no console errors on the native side.

### Pitfall 2: Env Vars Are Empty Strings When Not Set

**What goes wrong:** `process.env.EXPO_PUBLIC_WATERS_ACCESS_TOKEN` returns `undefined` at runtime if the var is not set, but the `|| ''` fallback silently converts it to an empty string. The auth object is serialized as `{ type: "ceremeet", token: "" }` — syntactically valid but semantically wrong.

**Why it happens:** Expo inlines `EXPO_PUBLIC_*` vars at build time. Missing vars become `undefined` in the bundle, coerced to empty string by `|| ''`.

**How to avoid:** For `watersUrl` specifically, if it's empty, skip rendering the WebView or show an error state. The token and userId being empty is a backend concern, but the URL being empty will cause a WebView load failure.

**Warning signs:** WebView loads `about:blank` or throws a load error with no URL.

### Pitfall 3: `WebViewMessageHandler` Interface Name Collision in `types/webview.ts`

**What goes wrong:** `types/webview.ts` currently exports both a `WebViewMessage` interface and a `WebViewMessageHandler` interface. `services/WebViewMessageHandler.ts` exports a class also named `WebViewMessageHandler`. TypeScript resolves them separately (interface vs. class), but the naming collision is confusing and may cause import ambiguity if both are in scope.

**Why it happens:** The types file was created with a handler interface that mirrors the service class name.

**How to avoid:** When trimming `types/webview.ts` per D-07, remove the `WebViewMessageHandler` interface — it duplicates the service class interface and is not imported anywhere in the current codebase.

**Warning signs:** TypeScript compiler errors mentioning `WebViewMessageHandler` with conflicting shapes.

### Pitfall 4: `onNavigationRequest` Prop Not Wired After Screen Simplification

**What goes wrong:** After removing `WebViewMessageHandler` from `chat.tsx` (D-08), the screen no longer passes `onNavigationRequest` to `ChatWebView`, so GotoPage messages are received but nothing happens.

**Why it happens:** The current `chat.tsx` routes through `messageHandler.handleMessage()` which calls `onGotoPage`. Once that is removed, the wiring must be direct: `ChatWebView`'s `onNavigationRequest` prop must be wired to the screen's navigation handler inline.

**How to avoid:** In simplified `chat.tsx`, pass `onNavigationRequest` directly:
```typescript
<ChatWebView
  onNavigationRequest={(pageName, caseId) => {
    setPendingNavigation({ pageName, caseId });
    setShowConfirmModal(true);
  }}
  style={styles.webview}
/>
```

**Warning signs:** GotoPage messages received (visible in console) but no modal appears.

## Code Examples

### Complete `injectedJavaScriptBeforeContentLoaded` block for auth injection

```typescript
// Source: CONTEXT.md D-01, D-02, D-03
const accessToken = process.env.EXPO_PUBLIC_WATERS_ACCESS_TOKEN || '';
const userId = process.env.EXPO_PUBLIC_WATERS_USER_ID || '';
const language = process.env.EXPO_PUBLIC_WATERS_LANGUAGE || '';

const injectedJavaScriptBeforeContentLoaded = `
  window.__CHAT_BACKEND_AUTH__ = ${JSON.stringify({
    type: 'ceremeet',
    token: accessToken,
  })};
  window.__CHAT_BACKEND_CONTEXT__ = ${JSON.stringify({
    userId: userId || undefined,
    language: language || undefined,
  })};
  true;
`;
```

**Note:** `JSON.stringify` of an object with `undefined` values omits those keys entirely — which matches D-03 (leave `userName` and `country` undefined, meaning absent). Verified: `JSON.stringify({ userId: undefined })` produces `"{}"`. If an empty string is passed for userId (env var not set), it will be serialized as `""` not omitted. The `|| undefined` coercion handles this: empty string `''` is falsy so it becomes `undefined` which is then omitted.

### Trimmed `types/webview.ts`

```typescript
// Keep only: base envelope + GotoPage. Remove: ChatMessage, Log, Error, WebViewMessageHandler interface.
export interface WebViewMessage {
  Process: string;
  Data: any;
}

export interface GotoPageMessage extends WebViewMessage {
  Process: 'GotoPage';
  Data: {
    PageName: string;
    CaseId: string;
  };
}

export interface ChatWebViewProps {
  onMessage?: (message: WebViewMessage) => void;
  onNavigationRequest?: (pageName: string, caseId: string) => void;
  style?: any;
}
```

### Updated `env.sample`

```bash
# Waters Bot Configuration
EXPO_PUBLIC_WATERS_BOT_URL=https://watersbot.footgolflegends.com
EXPO_PUBLIC_WATERS_USER_ID=your_user_id_here
EXPO_PUBLIC_WATERS_ACCESS_TOKEN=your_access_token_here
EXPO_PUBLIC_WATERS_LANGUAGE=en
```

## WebView Props: Retain vs Remove (Claude's Discretion)

The current `ChatWebView.tsx` sets several WebView props. Since the Waters Bot WebFrontend is a standard React web app (not a Chatwoot SDK iframe setup), the prop set can be simplified:

| Prop | Current Value | Recommendation | Reason |
|------|--------------|----------------|--------|
| `javaScriptEnabled` | `true` | **Retain** | Required — WebFrontend is a React app |
| `domStorageEnabled` | `true` | **Retain** | Required for localStorage/sessionStorage that web apps commonly use |
| `startInLoadingState` | `true` | **Retain** | Shows native loading indicator while URL loads |
| `bounces` | `false` | **Retain** | Prevents pull-to-refresh overscroll on iOS |
| `scrollEnabled` | `true` | **Retain** | WebFrontend controls its own scroll |
| `setSupportMultipleWindows` | `false` | **Retain** | Prevents target="_blank" popups hijacking navigation |
| `thirdPartyCookiesEnabled` | `true` | **Retain** | Waters Bot may use session cookies for auth state |
| `userAgent` | `"YourApp/1.0 (ReactNative)"` | **Remove or replace** | Placeholder value — either omit (default UA) or set to a meaningful value; leaving `YourApp` is misleading |
| `mixedContentMode` | `"compatibility"` | **Retain** | Defensive — allows mixed HTTP/HTTPS content if Waters Bot loads any HTTP resources |
| `scalesPageToFit` | `true` | **Remove** | Deprecated on Android (no-op); Waters Bot is a responsive web app that handles its own viewport |
| `onError` | logs to console | **Retain** | Defensive error logging |
| `onHttpError` | logs to console | **Retain** | Defensive error logging |
| `onLoadStart` / `onLoadEnd` | logs to console | **Retain** | Useful for debugging load lifecycle |

**Recommendation on `userAgent`:** Omit the prop entirely (use WebView default). The Waters Bot backend can identify React Native clients by the absence of a standard browser UA or by explicit detection if needed. Leaving a placeholder like `"YourApp/1.0"` provides no value and may confuse server-side logging.

## Console Logging Approach (Claude's Discretion)

The existing code uses emoji prefixes (`📥`, `🚀`, `❌`) on all console.log calls. This is an established project pattern (documented in CLAUDE.md). The simplified component should retain this convention for the remaining log points: message received, navigation request, load start/end, errors.

Recommended minimal log set for simplified ChatWebView:
- `console.log('📥 WebView message:', { ... })` — on every message received
- `console.log('🚀 Navigation request:', { pageName, caseId })` — on GotoPage
- `console.error('❌ Error parsing WebView message:', error)` — on JSON parse failure
- `console.log('🔄 WebView loading started')` / `console.log('✅ WebView loading completed')` — from existing onLoadStart/onLoadEnd

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline HTML with SDK script injection | Direct URL load with globals injection | This migration | Eliminates ~500 lines of DOM hacks; auth is declarative not imperative |
| Polling + MutationObserver to find DOM buttons | N/A (WebFrontend owns its own UI) | This migration | All button/bubble/back-button workarounds deleted entirely |
| `source={{ html: htmlContent }}` | `source={{ uri: watersUrl }}` | This migration | WebView loads a real URL with proper history, navigation events |

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — this phase is a code rewrite only; the Waters Bot URL is an external service but no tooling install is required to implement the changes).

## Open Questions

1. **Does Waters Bot WebFrontend send messages via `ReactNativeWebView.postMessage` directly, or via `window.parent.postMessage`?**
   - What we know: The current Chatwoot setup uses `window.parent.postMessage` (iframe → parent HTML page → native). The Waters Bot WebFrontend loads directly in the WebView (no parent HTML wrapper), so it must use `ReactNativeWebView.postMessage` directly for the bridge to work.
   - What's unclear: Whether the Waters Bot WebFrontend has been updated to use `ReactNativeWebView.postMessage` or still uses `window.parent.postMessage` from the previous integration.
   - Recommendation: If the Waters Bot WebFrontend uses `ReactNativeWebView.postMessage`, no action needed. If it uses `window.parent.postMessage`, the injection string should add a shim: `window.parent = { postMessage: (msg) => window.ReactNativeWebView?.postMessage(msg) }`. The planner should include a verification task that confirms GotoPage messages arrive after the migration is complete.

2. **Should `ConfirmationModal` and the navigation confirmation flow be retained in `chat.tsx`?**
   - What we know: D-08 says remove messageHandler useRef, message history toggle, stats display — it does not explicitly say remove ConfirmationModal.
   - What's unclear: Whether the ConfirmationModal confirmation step for GotoPage navigation is intentional UX or debug scaffolding.
   - Recommendation: Retain ConfirmationModal and navigation confirmation flow — it is functional UX behavior, not debug tooling. Remove only the message history buttons (History/Clear) and the `messageHandler` useRef.

## Sources

### Primary (HIGH confidence)
- Project source files (`components/ChatWebView.tsx`, `services/WebViewMessageHandler.ts`, `types/webview.ts`, `app/(tabs)/chat.tsx`, `env.sample`) — read directly; current implementation state confirmed
- `package.json` — dependency versions confirmed
- `.planning/phases/01-migration/01-CONTEXT.md` — locked decisions confirmed
- `.planning/REQUIREMENTS.md` — requirement IDs and descriptions confirmed

### Secondary (MEDIUM confidence)
- react-native-webview documentation behavior for `injectedJavaScriptBeforeContentLoaded` — established pattern; `true;` terminator requirement is well-documented community knowledge cross-referenced with project's existing usage of the same prop
- TypeScript behavior for `JSON.stringify` with `undefined` values — language specification behavior, HIGH confidence

### Tertiary (LOW confidence)
- Waters Bot WebFrontend's actual postMessage mechanism (`ReactNativeWebView.postMessage` vs `window.parent.postMessage`) — not verifiable from available files; flagged as Open Question

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries confirmed in package.json
- Architecture: HIGH — rewrite is a subtraction from existing code; patterns are well-established
- Pitfalls: HIGH — identified from direct code inspection of existing implementation
- Open questions: LOW — WebFrontend internals not accessible from this codebase

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable domain — react-native-webview 13.x API is stable)
