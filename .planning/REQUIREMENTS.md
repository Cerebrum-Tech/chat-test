# Requirements: Chat-Test Waters Bot Migration

**Defined:** 2026-04-05
**Core Value:** The WebView must load the Waters Bot frontend and pass authentication context so users can chat seamlessly within the native app.

## v1 Requirements

### Environment Config

- [ ] **ENV-01**: Replace 5 Chatwoot env vars with 4 Waters Bot env vars in env.sample
- [ ] **ENV-02**: Configure EXPO_PUBLIC_WATERS_BOT_URL pointing to watersbot.footgolflegends.com
- [ ] **ENV-03**: Configure EXPO_PUBLIC_WATERS_USER_ID, EXPO_PUBLIC_WATERS_ACCESS_TOKEN, EXPO_PUBLIC_WATERS_LANGUAGE

### WebView Migration

- [ ] **WEB-01**: Load WebFrontend URL directly via `source={{ uri }}` instead of inline HTML
- [ ] **WEB-02**: Inject `window.__CHAT_BACKEND_AUTH__` with Ceremeet token before page load
- [ ] **WEB-03**: Inject `window.__CHAT_BACKEND_CONTEXT__` with userId/language before page load
- [ ] **WEB-04**: Maintain ReactNativeWebView.postMessage bridge for GotoPage navigation
- [ ] **WEB-05**: External links continue opening in system browser

### Verification

- [ ] **VER-01**: TypeScript compilation succeeds with no errors
- [ ] **VER-02**: No references to old Chatwoot SDK or inline HTML remain

## v2 Requirements

(None — this is a focused migration)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/API changes | Handled by WebFrontend and caicore backend |
| WebFrontend changes | Separate project (watersbot.footgolflegends.com) |
| New chat features | Migration only, no feature additions |
| Types/services refactor | Existing interfaces and handlers work as-is |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENV-01 | — | Pending |
| ENV-02 | — | Pending |
| ENV-03 | — | Pending |
| WEB-01 | — | Pending |
| WEB-02 | — | Pending |
| WEB-03 | — | Pending |
| WEB-04 | — | Pending |
| WEB-05 | — | Pending |
| VER-01 | — | Pending |
| VER-02 | — | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 ⚠️

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after initial definition*
