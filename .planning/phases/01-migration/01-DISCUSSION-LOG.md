# Phase 1: Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 01-migration
**Areas discussed:** Auth object shape, Retained behavior, Cleanup scope

---

## Auth Object Shape

### Q1: What fields should window.__CHAT_BACKEND_AUTH__ contain?

| Option | Description | Selected |
|--------|-------------|----------|
| Token + type only | `{ type: "ceremeet", token: ACCESS_TOKEN }` — minimal, WebFrontend handles the rest | |
| Token + type + userId | `{ type: "ceremeet", token: ACCESS_TOKEN, userId: USER_ID }` — auth includes identity | |
| I have a spec | I know the exact shape — let me describe it | ✓ |

**User's choice:** "I have a spec" — provided: `{ type: "ceremeet", token: ACCESS_TOKEN }`
**Notes:** Matches "Token + type only" option. User confirmed the exact shape.

### Q2: What fields should window.__CHAT_BACKEND_CONTEXT__ contain?

| Option | Description | Selected |
|--------|-------------|----------|
| userId + language | `{ userId: USER_ID, language: LANGUAGE }` — matches ENV-03 | |
| userId only | `{ userId: USER_ID }` — language handled elsewhere | |
| I have a spec | I know the exact shape — let me describe it | ✓ |

**User's choice:** "I have a spec" — provided: `{ userId?: string, userName?: string, language?: string, country?: string }` (all optional)
**Notes:** Broader than expected — 4 optional fields. Follow-up confirmed only userId + language populated in Phase 1.

### Q3: Which __CHAT_BACKEND_CONTEXT__ fields to populate from env vars?

| Option | Description | Selected |
|--------|-------------|----------|
| userId + language (Recommended) | Match ENV-03 scope | ✓ |
| All four fields | Add userName and country env vars too | |
| userId only | Just user ID for now | |

**User's choice:** userId + language (Recommended)
**Notes:** None

---

## Retained Behavior

### Q4: Should the message bridge stay exactly as-is?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is (Recommended) | Same protocol, no changes | |
| Simplify it | Strip to just GotoPage handling | ✓ |
| Let me explain | WebFrontend uses different protocol | |

**User's choice:** Simplify it
**Notes:** Led to follow-up about which message types to keep.

### Q5: Which message types should the bridge handle?

| Option | Description | Selected |
|--------|-------------|----------|
| GotoPage only (Recommended) | Just navigation | ✓ |
| GotoPage + ChatMessage | Navigation + chat forwarding | |
| GotoPage + Error | Navigation + error reporting | |

**User's choice:** GotoPage only (Recommended)
**Notes:** None

### Q6: Should external link interception stay?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it (Recommended) | Update host comparison to Waters Bot | ✓ |
| Remove it | Let WebFrontend handle external links | |

**User's choice:** Keep it (Recommended)
**Notes:** Matches WEB-05 requirement.

---

## Cleanup Scope

### Q7: Should WebViewMessageHandler.ts be simplified?

| Option | Description | Selected |
|--------|-------------|----------|
| Simplify with ChatWebView (Recommended) | Remove ChatMessage/Log/Error dispatch | ✓ |
| Leave as-is | Harmless, clean up in Phase 2 | |
| Remove entirely | Inline GotoPage logic in ChatWebView | |

**User's choice:** Simplify with ChatWebView (Recommended)
**Notes:** None

### Q8: Should types/webview.ts be trimmed?

| Option | Description | Selected |
|--------|-------------|----------|
| Trim to match (Recommended) | Keep only GotoPage + base envelope | ✓ |
| Leave types broad | Full union for future use | |
| You decide | Claude's discretion | |

**User's choice:** Trim to match (Recommended)
**Notes:** None

### Q9: Should chat.tsx be updated?

| Option | Description | Selected |
|--------|-------------|----------|
| Simplify screen too (Recommended) | Remove handler useRef, history, stats | ✓ |
| Minimal screen changes | Only update prop wiring | |

**User's choice:** Simplify screen too (Recommended)
**Notes:** None

---

## Claude's Discretion

- WebView props to retain vs remove (userAgent, cookies, mixedContentMode, etc.)
- Console logging approach in simplified component

## Deferred Ideas

None — discussion stayed within phase scope
