# Roadmap: Chat-Test Waters Bot Migration

## Overview

A focused two-phase migration: rewrite ChatWebView.tsx to load the Waters Bot frontend URL directly (replacing inline Chatwoot HTML) and verify the result compiles cleanly with no old artifacts.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Migration** - Replace env vars and rewrite ChatWebView.tsx to load Waters Bot URL with injected auth context
- [ ] **Phase 2: Verification** - Confirm TypeScript build is clean and no Chatwoot artifacts remain

## Phase Details

### Phase 1: Migration
**Goal**: The app loads the Waters Bot WebFrontend URL with auth and user context injected, replacing all inline Chatwoot HTML
**Depends on**: Nothing (first phase)
**Requirements**: ENV-01, ENV-02, ENV-03, WEB-01, WEB-02, WEB-03, WEB-04, WEB-05
**Success Criteria** (what must be TRUE):
  1. env.sample contains the 4 Waters Bot vars (URL, USER_ID, ACCESS_TOKEN, LANGUAGE) and no Chatwoot vars
  2. ChatWebView.tsx loads the WebFrontend URL via `source={{ uri }}` with no inline HTML string
  3. `window.__CHAT_BACKEND_AUTH__` (Ceremeet token) and `window.__CHAT_BACKEND_CONTEXT__` (userId/language) are injected before page load via injectedJavaScriptBeforeContentLoaded
  4. GotoPage navigation messages from the WebFrontend are still handled by the existing ReactNativeWebView.postMessage bridge
  5. External links continue opening in the system browser
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Replace env vars, trim types, rewrite ChatWebView.tsx for URL loading with auth injection
- [ ] 01-02-PLAN.md — Simplify WebViewMessageHandler service and chat.tsx screen

### Phase 2: Verification
**Goal**: The migrated codebase compiles cleanly and contains no traces of the old Chatwoot integration
**Depends on**: Phase 1
**Requirements**: VER-01, VER-02
**Success Criteria** (what must be TRUE):
  1. `npx tsc --noEmit` exits with no errors
  2. No references to Chatwoot SDK URLs, inline HTML blobs, or old env var names exist anywhere in the codebase
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Migration | 0/2 | Planning complete | - |
| 2. Verification | 0/? | Not started | - |
