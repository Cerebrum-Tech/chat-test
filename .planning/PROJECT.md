# Chat-Test Expo App — Waters Bot Migration

## What This Is

An Expo (React Native) mobile app that embeds a chat interface via WebView. Currently loads the Chatwoot JS SDK inline; migrating to load the Waters Bot WebFrontend (watersbot.footgolflegends.com) directly as a URL — simpler, no inline HTML or DOM hacks needed.

## Core Value

The WebView must load the Waters Bot frontend and pass authentication context so users can chat seamlessly within the native app.

## Requirements

### Validated

- ✓ WebView-based chat embedded in tab navigation — existing
- ✓ Message bridge via ReactNativeWebView.postMessage (GotoPage, ChatMessage) — existing
- ✓ External links open in system browser — existing
- ✓ Dark-themed UI with tab-based navigation — existing
- ✓ Chat history viewing and clearing — existing

### Active

- [ ] Replace Chatwoot env vars with Waters Bot env vars in env.sample
- [ ] Rewrite ChatWebView.tsx to load WebFrontend URL directly (no inline HTML)
- [ ] Inject auth context via window.__CHAT_BACKEND_AUTH__ before React app boots
- [ ] Inject user context via window.__CHAT_BACKEND_CONTEXT__ before React app boots
- [ ] Verify TypeScript build succeeds after migration

### Out of Scope

- Backend/API changes — handled by the WebFrontend and caicore backend
- WebFrontend (watersbot.footgolflegends.com) changes — separate project
- New features beyond the migration — just replacing the chat provider

## Context

- The old approach uses inline HTML with the Chatwoot JS SDK, requiring ~300 lines of DOM manipulation (bubble hiding, back button override, MutationObserver)
- The new approach loads a deployed URL directly, reducing ChatWebView.tsx to ~90 lines
- Auth flow: Expo injects window.__CHAT_BACKEND_AUTH__ → WebFrontend reads it → passes to caicore backend → validates against api.ceremeet.com
- Message bridge pattern (ReactNativeWebView.postMessage) remains identical
- Types (webview.ts), services (WebViewMessageHandler.ts), and screens (chat.tsx) require no changes

## Constraints

- **Tech stack**: Must remain Expo/React Native with react-native-webview — existing app infrastructure
- **Auth**: Must use Ceremeet token-based auth (type: "ceremeet") — backend requirement
- **Compatibility**: WebFrontend expects window.__CHAT_BACKEND_AUTH__ and window.__CHAT_BACKEND_CONTEXT__ globals

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Load URL directly instead of inline HTML | Eliminates ~200 lines of DOM hacks, Chatwoot SDK dependency | — Pending |
| Inject auth via injectedJavaScriptBeforeContentLoaded | Runs before React app boots, ensuring config.ts picks up auth | — Pending |
| Keep same message bridge protocol | No changes needed to types, services, or screens | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after initialization*
