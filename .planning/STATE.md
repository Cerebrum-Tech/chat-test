# Project state

**Updated:** 2026-07-21

**Milestone:** Global frontend native host

**Status:** Implementation and automated verification complete; live Docker/device smoke not completed in this environment

## Implemented

- Direct loading of the global CAICore Vite frontend from EXPO_PUBLIC_CAI_FRONTEND_URL.
- Pre-content bootstrap of optional window.__CAI_API_BASE_URL__ and allowlisted public user context.
- Frontend-owned conversations REST/SSE clients with no native token injection; AuthProvider remains the only possible token owner if auth is enabled later.
- Current Erikli target documented as `auth.enabled: false`, with direct load and REST/SSE smoke requiring no login.
- Exact lowercase GotoPage/MainPage bridge parsing.
- Immediate duplicate-safe replacement to /main-page.
- Optional incident display with Not provided as the empty state.
- Back to chat route replacement.
- Same-origin, external-link, unsupported-scheme, and no-cache WebView policy.
- Jest and React Native Testing Library suites plus typecheck and lint scripts.

## Key decisions

- Expo public environment values are configuration, never secrets.
- The native layer is a host and route boundary, not an authentication or conversation client.
- Restored history is a frontend concern and must not replay bridge actions.
- A bridge envelope must match the exact allowlist; permissive compatibility parsing is intentionally excluded.
- Bootstrap allowlisting rejects unsupported property names but does not inspect content inside allowed string values.
- Blank case_id values preserve navigation but produce no route param.
- A valid action replaces rather than pushes, and Back to chat also replaces.
- DOM storage remains available even though document caching is disabled.
- `mixedContentMode="compatibility"` and `thirdPartyCookiesEnabled={true}` remain intentional current settings and production-hardening concerns.
- Auth-enabled Expo hosting requires a separately designed/tested system-browser/deep-link callback that preserves WebView auth-result/session context.
- Global `feat/native-client-actions` at `4bb5772` or a merged descendant must be deployed before this native host.

## Supported environment

The six supported fields are EXPO_PUBLIC_CAI_FRONTEND_URL, EXPO_PUBLIC_CAI_API_BASE_URL, EXPO_PUBLIC_CAI_USER_ID, EXPO_PUBLIC_CAI_USER_NAME, EXPO_PUBLIC_CAI_LANGUAGE, and EXPO_PUBLIC_CAI_COUNTRY. The frontend URL is required; the API base and four public context fields are optional. env.sample uses Vite port 5174 and a blank API base so the same-origin proxy is the copied default.

Device URLs must address the development host. Android Emulator uses 10.0.2.2 for host services; physical devices use a reachable LAN address.

## Verification baseline

- npm ci is the deterministic install command.
- npm test -- --runInBand runs the complete Jest suite.
- npm run typecheck runs strict TypeScript checking.
- npm run lint runs Expo ESLint.
- npx expo config --type public validates public app configuration.
- npx expo export --platform android validates an Android production bundle.
- The Docker/device matrix is defined but was not completed in this environment. Its auth-disabled target covers direct load, REST/SSE without login, live action, routing, URL, cache, and history behavior.

## Historical records

.planning/phases/01-migration is intentionally frozen. Its dated plans and outcomes are historical records and are excluded from active-document scans.
