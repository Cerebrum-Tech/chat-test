---
phase: 01-migration
plan: "01"
subsystem: chat-webview
tags: [migration, webview, auth-injection, waters-bot]
dependency_graph:
  requires: []
  provides: [waters-bot-webview-component, waters-bot-env-config]
  affects: [components/ChatWebView.tsx, env.sample, types/webview.ts]
tech_stack:
  added: []
  patterns: [injectedJavaScriptBeforeContentLoaded, uri-source-webview, ceremeet-auth]
key_files:
  created: []
  modified:
    - env.sample
    - types/webview.ts
    - components/ChatWebView.tsx
decisions:
  - "Load Waters Bot URL directly via source={{ uri }} — eliminates ~490 lines of inline HTML and DOM hacks"
  - "Inject auth via injectedJavaScriptBeforeContentLoaded — runs before React app boots, ceremeet type required"
  - "Remove WebViewMessageHandler interface from types — unused after migration (D-07)"
  - "Handle GotoPage messages only — ChatMessage/Log/Error branches removed (D-04)"
metrics:
  duration: "75s"
  completed: "2026-04-05"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements_fulfilled:
  - ENV-01
  - ENV-02
  - ENV-03
  - WEB-01
  - WEB-02
  - WEB-03
  - WEB-04
  - WEB-05
---

# Phase 01 Plan 01: Waters Bot WebView Migration Summary

JWT auth injection with ceremeet token type loading watersbot.footgolflegends.com via direct URL source, replacing 580-line inline Chatwoot HTML with a 119-line component.

## What Was Built

The core migration from Chatwoot SDK inline HTML to Waters Bot WebFrontend URL loading:

1. **env.sample** — Replaced 5 Chatwoot vars with 4 Waters Bot vars: `EXPO_PUBLIC_WATERS_BOT_URL`, `EXPO_PUBLIC_WATERS_USER_ID`, `EXPO_PUBLIC_WATERS_ACCESS_TOKEN`, `EXPO_PUBLIC_WATERS_LANGUAGE`

2. **types/webview.ts** — Removed unused `WebViewMessageHandler` interface (D-07). Retained `WebViewMessage`, `GotoPageMessage`, `ChatWebViewProps`.

3. **components/ChatWebView.tsx** — Complete rewrite from ~580 lines to 119 lines:
   - `source={{ uri: watersUrl }}` instead of `source={{ html: htmlContent }}`
   - `injectedJavaScriptBeforeContentLoaded` injects `window.__CHAT_BACKEND_AUTH__` (type: ceremeet, token) and `window.__CHAT_BACKEND_CONTEXT__` (userId, language) before React app boots
   - GotoPage message handling dispatches to `onNavigationRequest` callback
   - External link interception via `Linking.openURL` compares hosts against `watersUrl`
   - Zero Chatwoot references, no inline HTML, no MutationObserver, no DOM hacks

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 605f3fa | chore: replace Chatwoot env vars with Waters Bot vars and trim WebView types |
| Task 2 | 96d476b | feat: rewrite ChatWebView to load Waters Bot URL directly |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Load URL via `source={{ uri }}` | Eliminates need for inline HTML, Chatwoot SDK, and ~490 lines of DOM manipulation |
| Use `injectedJavaScriptBeforeContentLoaded` | Runs synchronously before React app boots — config.ts reads globals at startup |
| JSON.stringify for auth/context globals | Safe serialization; `|| undefined` coercion omits empty strings via JSON |
| Remove ChatMessage/Log/Error message branches | Waters Bot WebFrontend handles its own logging; only GotoPage navigation needed |
| Remove WebViewMessageHandler interface | Was unused in all callers; no screen or service referenced it |

## Deviations from Plan

None — plan executed exactly as written. File landed at 119 lines (plan estimated 90-110); the extra lines are the style comments and blank lines matching project conventions.

## Known Stubs

None. All environment variable reads are wired to real `process.env.EXPO_PUBLIC_WATERS_*` vars. The `|| ''` and `|| undefined` fallbacks are correct empty-state behavior, not placeholder stubs.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced. The `injectedJavaScriptBeforeContentLoaded` injection surface was pre-existing in the component; it now injects auth tokens instead of a WebView readiness check.

## Self-Check: PASSED

Files verified:
- FOUND: /home/alp-eren-zalp/git/chat-test/env.sample
- FOUND: /home/alp-eren-zalp/git/chat-test/types/webview.ts
- FOUND: /home/alp-eren-zalp/git/chat-test/components/ChatWebView.tsx
- FOUND: /home/alp-eren-zalp/git/chat-test/.planning/phases/01-migration/01-01-SUMMARY.md

Commits verified:
- FOUND: 605f3fa (Task 1)
- FOUND: 96d476b (Task 2)
