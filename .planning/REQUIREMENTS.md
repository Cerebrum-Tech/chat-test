# Requirements

## Environment and bootstrap

- [x] RUNTIME-01: EXPO_PUBLIC_CAI_FRONTEND_URL is the direct WebView source.
- [x] RUNTIME-02: EXPO_PUBLIC_CAI_API_BASE_URL is optional and maps only to window.__CAI_API_BASE_URL__.
- [x] RUNTIME-03: EXPO_PUBLIC_CAI_USER_ID, EXPO_PUBLIC_CAI_USER_NAME, EXPO_PUBLIC_CAI_LANGUAGE, and EXPO_PUBLIC_CAI_COUNTRY map only to allowlisted public context properties.
- [x] RUNTIME-04: Unsupported context properties are discarded and serialized values are JSON-escaped.
- [x] RUNTIME-05: The native host injects no authentication credential or token.
- [x] RUNTIME-06: Device and emulator configuration uses a host-resolvable address.

## Frontend ownership

- [x] WEB-01: The global Vite frontend loads directly, without a generated wrapper.
- [x] WEB-02: The frontend AuthProvider remains the authentication owner.
- [x] WEB-03: The frontend owns conversation creation/history REST calls and live SSE consumption.
- [x] WEB-04: Native actions originate from current live frontend delivery, not restored or refetched history.

## Native action

- [x] NAV-01: The native parser accepts only output_type=navigation, process=GotoPage, and data.page_name=MainPage with exact lowercase keys.
- [x] NAV-02: The envelope and data objects reject extra keys.
- [x] NAV-03: case_id is optional; a nonblank string is preserved exactly and blank strings are omitted.
- [x] NAV-04: Malformed JSON, unknown values, and non-string case_id values are ignored.
- [x] NAV-05: A valid action immediately replaces the route with /main-page.
- [x] NAV-06: Repeated callbacks before unmount cause only one replacement.
- [x] NAV-07: MainPage displays the incident ID or Not provided.
- [x] NAV-08: Back to chat replaces the route with /(tabs)/chat.

## WebView boundary

- [x] URL-01: Same-origin HTTP(S) requests stay inside the WebView.
- [x] URL-02: Cross-origin HTTP(S), tel, and mailto requests open externally.
- [x] URL-03: Malformed and unsupported schemes are blocked.
- [x] URL-04: An invalid configured frontend origin blocks navigation.
- [x] CACHE-01: WebView document caching is disabled.
- [x] CACHE-02: DOM storage remains enabled for the frontend session.

## Quality

- [x] TEST-01: Jest with the Expo preset is configured.
- [x] TEST-02: Pure bootstrap, parser, and URL policy branches are covered.
- [x] TEST-03: WebView integration, immediate navigation, duplicate suppression, optional display, and back behavior are covered.
- [x] TEST-04: TypeScript strict checking and Expo lint are runnable package scripts.
- [x] TEST-05: Expo public config and Android export are part of verification.
- [x] DOC-01: Maintained documentation describes current behavior and excludes archived phase records from active guidance.
