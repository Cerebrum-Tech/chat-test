# Phase 1: Migration - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the inline Chatwoot HTML in ChatWebView.tsx with a direct URL load to the Waters Bot WebFrontend (watersbot.footgolflegends.com), injecting auth and user context globals before the page boots. Simplify the message bridge, handler service, types, and screen to match the reduced scope.

</domain>

<decisions>
## Implementation Decisions

### Auth Injection
- **D-01:** `window.__CHAT_BACKEND_AUTH__` shape is `{ type: "ceremeet", token: ACCESS_TOKEN }` — token comes from `EXPO_PUBLIC_WATERS_ACCESS_TOKEN` env var
- **D-02:** `window.__CHAT_BACKEND_CONTEXT__` shape is `{ userId?: string, userName?: string, language?: string, country?: string }` — all fields optional
- **D-03:** For Phase 1, populate only `userId` (from `EXPO_PUBLIC_WATERS_USER_ID`) and `language` (from `EXPO_PUBLIC_WATERS_LANGUAGE`). Leave `userName` and `country` undefined.

### Message Bridge
- **D-04:** Simplify message bridge to handle **GotoPage only** — drop ChatMessage, Log, Error, and unknown message type handling
- **D-05:** External link interception stays — `handleShouldStartLoadWithRequest` updated to compare against the Waters Bot host instead of Chatwoot base URL

### Cleanup Scope
- **D-06:** `WebViewMessageHandler.ts` (service class) simplified to match — remove ChatMessage/Log/Error dispatch branches
- **D-07:** `types/webview.ts` trimmed to GotoPage and base envelope only — remove ChatMessage, Log, Error process types
- **D-08:** `chat.tsx` (screen) simplified — remove WebViewMessageHandler useRef, message history toggle, stats display. Screen just renders ChatWebView and handles GotoPage navigation.
- **D-09:** All inline HTML removed — no Chatwoot SDK, no DOM hacks (bubble hiding, back button override, MutationObserver)

### Claude's Discretion
- WebView props to retain vs remove (userAgent, thirdPartyCookiesEnabled, mixedContentMode, etc.) — Claude decides based on what the Waters Bot URL needs
- Console logging approach in the simplified component

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and REQUIREMENTS.md.

### Project Docs
- `.planning/REQUIREMENTS.md` — ENV-01 through WEB-05 define the migration requirements
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 items)

### Key Source Files
- `components/ChatWebView.tsx` — Primary file being rewritten (~580 lines → ~90 lines)
- `services/WebViewMessageHandler.ts` — Handler service being simplified
- `types/webview.ts` — Type definitions being trimmed
- `app/(tabs)/chat.tsx` — Screen being simplified
- `env.sample` — Env vars being replaced (5 Chatwoot → 4 Waters Bot)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handleShouldStartLoadWithRequest` logic in ChatWebView.tsx — external link interception pattern stays, just needs host comparison update
- `handleWebViewMessage` pattern — JSON parse + switch on Process field stays, just fewer cases
- `ChatWebViewProps` interface — onMessage, onNavigationRequest, style props still relevant

### Established Patterns
- Env vars read via `process.env.EXPO_PUBLIC_*` directly in component — same pattern for new vars
- `injectedJavaScriptBeforeContentLoaded` prop on WebView — same mechanism for auth injection
- `StyleSheet.create` at bottom of file — keep this pattern

### Integration Points
- `app/(tabs)/chat.tsx` imports ChatWebView and wires callbacks — needs simplification
- `services/WebViewMessageHandler.ts` instantiated via useRef in chat.tsx — simplify or remove useRef
- `types/webview.ts` imported by ChatWebView, handler, and screen — trim union type

</code_context>

<specifics>
## Specific Ideas

- Auth object confirmed by user: `{ type: "ceremeet", token: ACCESS_TOKEN }` — no userId in auth, that goes in context
- Context object has 4 optional fields but Phase 1 only populates userId + language
- User wants a clean simplification pass across all layers, not just ChatWebView

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-migration*
*Context gathered: 2026-04-05*
