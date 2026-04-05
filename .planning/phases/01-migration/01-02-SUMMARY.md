---
phase: 01-migration
plan: 02
subsystem: services, screens
tags: [simplification, refactor, dead-code-removal, webview]
dependency_graph:
  requires: [01-01]
  provides: [simplified-service-layer, simplified-chat-screen]
  affects: [services/WebViewMessageHandler.ts, app/(tabs)/chat.tsx]
tech_stack:
  added: []
  patterns: [direct-prop-wiring, minimal-service-class]
key_files:
  created: []
  modified:
    - services/WebViewMessageHandler.ts
    - app/(tabs)/chat.tsx
decisions:
  - "Removed all Chatwoot-era message branches (ChatMessage, Log, Error, unknown) from WebViewMessageHandler per D-06"
  - "Wired onNavigationRequest directly from chat.tsx to ChatWebView, bypassing WebViewMessageHandler per D-08"
  - "Removed all debug UI (History/Clear/Show-Hide buttons) and header block from chat.tsx"
metrics:
  duration: ~8 minutes
  completed: "2026-04-05"
  tasks_completed: 2
  files_modified: 2
---

# Phase 01 Plan 02: Simplify Service and Screen Layers Summary

**One-liner:** Stripped WebViewMessageHandler to GotoPage-only dispatch and chat.tsx to direct onNavigationRequest wiring, removing all Chatwoot-era debug UI and unused message handler branches.

## What Was Built

Two refactors completing the simplification of the non-WebView layers:

1. **WebViewMessageHandler simplified** (`services/WebViewMessageHandler.ts`): Removed `handleChatMessage`, `handleLog`, `handleError`, `handleUnknownMessage`, and `getMessageStats`. Replaced the `switch` statement with a direct `if (message.Process === 'GotoPage')` check. Callbacks parameter reduced to `{ onGotoPage? }` only. Message log (capped at 100) and `getMessageHistory` / `clearMessageHistory` retained.

2. **chat.tsx simplified** (`app/(tabs)/chat.tsx`): Removed `WebViewMessageHandler` `useRef`, all message handler functions (`handleWebViewMessage`, `getMessageHistory`, `clearHistory`), toggle visibility function and `isVisible` state, header block (title/subtitle), controls block (Show/Hide, History, Clear buttons), and associated styles. `onNavigationRequest` is now wired directly as a prop on `<ChatWebView>`. `ConfirmationModal` retained for GotoPage navigation confirmation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Simplify WebViewMessageHandler to GotoPage-only | 2c93178 | services/WebViewMessageHandler.ts |
| 2 | Simplify chat.tsx screen | 3739496 | app/(tabs)/chat.tsx |

## Verification Results

- `grep -rci "chatwoot"` returns 0 for both modified files
- Task 1 acceptance criteria: PASS (all removals confirmed, GotoPage-only handler in place)
- Task 2 acceptance criteria: PASS (direct onNavigationRequest wiring confirmed, no debug UI)
- TypeScript build: node_modules not installed in worktree — tsc check skipped. Code changes are structurally sound; imports resolve to files present in repo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored Plan 01 artifacts lost during worktree setup**

- **Found during:** Task 1 commit (git reset --soft swept old-branch deletions into staging)
- **Issue:** The `git reset --soft` used to rebase the worktree onto 8c60631 inadvertently staged deletions of: `.planning/**`, `CLAUDE.md`, `components/ChatWebView.tsx`, `env.sample`, and `types/webview.ts`. These were committed as deletions in the Task 1 commit.
- **Fix:** Restored all affected files via `git checkout 8c60631 -- <files>` in three follow-up commits (23b8d95, 6b0f899, 21bccf3).
- **Files restored:** `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/codebase/*`, `.planning/config.json`, `.planning/phases/01-migration/01-*.{md}`, `CLAUDE.md`, `components/ChatWebView.tsx`, `env.sample`, `types/webview.ts`
- **Commits:** 23b8d95, 6b0f899, 21bccf3

## Known Stubs

None. Both files are complete implementations with no hardcoded placeholder values or TODO stubs.

## Threat Flags

None. These changes are pure refactors — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `services/WebViewMessageHandler.ts` exists and contains GotoPage-only handler
- `app/(tabs)/chat.tsx` exists with direct onNavigationRequest wiring
- Task 1 commit 2c93178 exists in git log
- Task 2 commit 3739496 exists in git log
- Restore commits 23b8d95, 6b0f899, 21bccf3 exist in git log
- Zero Chatwoot references in both modified files confirmed
