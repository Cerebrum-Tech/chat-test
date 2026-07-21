# Testing

**Updated:** 2026-07-21

## Framework

Jest 29 runs with the jest-expo preset. React Native Testing Library renders screens and the WebView boundary. clearMocks is enabled in package.json.

## Deterministic install and full checks

Run npm ci before tests or package checks:

~~~bash
npm ci
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo config --type public >/dev/null
chat_test_export_dir=$(mktemp -d .expo-export.XXXXXX)
npx expo export --platform android --output-dir "$chat_test_export_dir"
mv "$chat_test_export_dir" /tmp/
git diff --check
~~~

Do not run npm ci concurrently with Jest, TypeScript, lint, or Expo commands because it replaces node_modules.

## Suite map

| Suite | Coverage |
| --- | --- |
| test-setup-test.ts | Expo Jest preset baseline. |
| web-view-bootstrap-test.ts | API assignment, four public context fields, optional values, JSON escaping, allowlist projection, and absence of token data. |
| web-view-url-policy-test.ts | Same-origin allow, cross-origin and device-link external handling, invalid URLs, invalid frontend origin, and blocked schemes. |
| navigation-action-test.ts | Exact lowercase envelope, optional case_id, blank omission, strict keys, unknown values, bad types, and malformed JSON. |
| chat-web-view-test.tsx | Direct source, no-cache props, URL decision wiring, external Linking, and strict onMessage emission. |
| chat-screen-test.tsx | Immediate router.replace and repeated-callback suppression without an intermediate prompt. |
| main-page-test.tsx | Exact incident display, Not provided empty state, and Back to chat replacement. |

## Test design

- Prefer table-driven tests for policy matrices.
- Test both accepted and rejected untrusted input.
- Keep service tests free of React Native mocks.
- Mock only react-native-webview when asserting WebView props.
- Mock only expo-router when asserting route replacement and params.
- Preserve byte-for-byte nonblank case_id values in expectations.
- Assert fixed behavior rather than implementation-private helpers.

There is no enforced coverage threshold. Passing suites do not replace device-level integration checks.

## Docker and device smoke

Start the global services:

~~~bash
cd /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr
docker compose -f docker-compose.dev.yaml up --build
~~~

Run WebFrontend separately and bind Vite for device access:

~~~bash
cd /home/alp/alp-dev/glbl-cai-core-nestle-waters-tr/WebFrontend
npm ci
npm run dev -- --host 0.0.0.0
~~~

Configure all six native environment fields with device-reachable frontend and API URLs. Android Emulator uses 10.0.2.2 for host ports. Start this host with:

~~~bash
npx expo start --clear
~~~

Verify:

1. The Vite frontend loads directly and its AuthProvider authenticates.
2. A live action without case_id opens /main-page immediately and displays Not provided.
3. A new live action with a CRM incident ID displays that exact ID.
4. Repeated delivery before unmount does not stack or replace twice.
5. Back to chat returns to the chat tab.
6. Same-origin HTTP(S) stays internal.
7. Cross-origin HTTP(S), telephone, and email links open externally.
8. Malformed and unsupported schemes remain blocked.
9. Leaving and re-entering chat or restoring REST history does not redirect from an old action.

## Limits

The automated suite does not launch a simulator, exercise operating-system URL handlers, authenticate against a live backend, or inspect SSE frames. Record those device observations separately for a release candidate.
