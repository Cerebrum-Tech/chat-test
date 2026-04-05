# Codebase Concerns

**Analysis Date:** 2026-04-05

## Tech Debt

**Hardcoded placeholder values in back button handler:**
- Issue: The back button override in injected JS sends a hardcoded `CaseId: 'xxx'` and hard-codes `PageName: 'AddressesScreen'`. This is a stub that was never replaced with dynamic values.
- Files: `components/ChatWebView.tsx` (line 463)
- Impact: Every back button press navigates to `AddressesScreen` with a fake case ID, regardless of context. The feature is non-functional in any real use case.
- Fix approach: The injected JS must receive real navigation context from the parent app, either via the Chatwoot widget message payload or a state variable injected at render time via `injectedJavaScript`.

**Fragile DOM-scraping back button detection:**
- Issue: `overrideBackButton()` uses five sequential heuristic strategies to locate a back button inside the Chatwoot widget iframe: CSS class guesses (`px-2`, `-ml-`), a specific SVG path string (`M15.53 4.22`), header-child discovery, arrow SVG path substrings, and a last-resort first-button fallback. If Chatwoot updates its widget markup, all strategies may silently fail or match the wrong element.
- Files: `components/ChatWebView.tsx` (lines 377–483)
- Impact: Navigation interception will break silently on any Chatwoot widget update. The last-resort fallback will bind to the wrong button.
- Fix approach: Push navigation events from the Chatwoot widget server side (via `forwardToReactNative` message), removing the need for DOM heuristics entirely. The message listener infrastructure for this already exists in the same file (lines 244–274).

**`WebViewMessageHandler` class is instantiated but duplicate logic lives in `ChatWebView`:**
- Issue: Navigation message parsing (including the `ChatMessage` → `content_attributes.navigation_action` path) is duplicated between `components/ChatWebView.tsx` (lines 62–86) and `services/WebViewMessageHandler.ts` (lines 56–88, 112–124). Both parse the same message shapes independently.
- Files: `components/ChatWebView.tsx`, `services/WebViewMessageHandler.ts`
- Impact: Bug fixes or message shape changes must be applied in two places; they can diverge silently.
- Fix approach: Remove the inline switch in `handleWebViewMessage` in `ChatWebView` and delegate entirely to `WebViewMessageHandler`.

**Boilerplate Expo template screens not removed:**
- Issue: `app/(tabs)/index.tsx` and `app/(tabs)/explore.tsx` contain the default Expo starter template content including "Step 1: Try it", "Step 2: Explore" instructions and a `reset-project` script reference. The `scripts/reset-project.js` and template components (`HelloWave`, `ParallaxScrollView`) are also still present.
- Files: `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`, `scripts/reset-project.js`, `components/HelloWave.tsx`, `components/ParallaxScrollView.tsx`, `components/Collapsible.tsx`
- Impact: Confusing dead code shipped with the app. Increases bundle size unnecessarily.
- Fix approach: Remove unused template screens and components, or replace `index.tsx` with a real home screen.

**Navigation confirmation modal does not actually navigate:**
- Issue: `handleConfirmNavigation` in `chat.tsx` logs the navigation intent but contains no actual navigation call. The comment says "Here you would implement your actual navigation logic".
- Files: `app/(tabs)/chat.tsx` (lines 45–52)
- Impact: Pressing "Navigate" in the confirmation modal does nothing beyond closing the modal. The entire `onNavigationRequest` integration is a no-op.
- Fix approach: Integrate expo-router's `useRouter` or `router.push()` with the `pageName`/`caseId` from `pendingNavigation`.

## Security Considerations

**Sensitive tokens exposed via `EXPO_PUBLIC_` prefix:**
- Risk: `EXPO_PUBLIC_CHATWOOT_ACCESS_TOKEN` and `EXPO_PUBLIC_CHATWOOT_CUSTOMER_CONNECTION_ID` use the `EXPO_PUBLIC_` prefix, which means they are **bundled into the client-side JavaScript** and visible to anyone who unpacks the app binary. An access token should never be public.
- Files: `components/ChatWebView.tsx` (lines 16–17), `env.sample`
- Current mitigation: None. The tokens are interpolated directly into the HTML string sent to the WebView.
- Recommendations: Access tokens must not use `EXPO_PUBLIC_`. They should be fetched at runtime from a backend endpoint that authenticates the user first, or at minimum be treated as short-lived tokens scoped to this user session. Review whether `access_token` and `customer_connection_id` values truly need to be in the widget at all.

**Wildcard `postMessage` origin (`*`) accepted without validation:**
- Risk: The WebView HTML listens for `window.addEventListener('message', ...)` and processes any message prefixed with `chatwoot-widget:` without checking `event.origin`. A malicious iframe or injected script on the same page could forge navigation messages.
- Files: `components/ChatWebView.tsx` (lines 244–274)
- Current mitigation: The prefix check (`chatwoot-widget:`) provides minimal filtering.
- Recommendations: Validate `event.origin` against the known `baseUrl` before processing any message.

**`thirdPartyCookiesEnabled={true}` and `mixedContentMode="compatibility"`:**
- Risk: These WebView settings reduce the security posture. `mixedContentMode="compatibility"` allows HTTP resources to load inside an HTTPS page.
- Files: `components/ChatWebView.tsx` (lines 561–562)
- Current mitigation: None documented.
- Recommendations: Set `mixedContentMode="never"` unless there is a confirmed requirement. Audit whether third-party cookies are actually necessary for the widget to function.

**Base URL hardcoded as a fallback in source:**
- Risk: `process.env.EXPO_PUBLIC_CHATWOOT_BASE_URL || 'https://chat.footgolflegends.com'` means if the env var is absent (e.g., in a CI build or misconfigured environment), the app silently falls back to the production domain. This can cause test/dev builds to connect to production.
- Files: `components/ChatWebView.tsx` (line 18)
- Recommendations: Remove the fallback and fail loudly (throw or show an error) when the env var is not set.

## Performance Bottlenecks

**`console.log` override broadcasts every log entry to React Native via `postMessage`:**
- Problem: Inside the injected HTML, `console.log` is overridden so every call sends a postMessage to the native layer. Chatwoot's widget likely logs extensively during its lifecycle.
- Files: `components/ChatWebView.tsx` (lines 219–231)
- Cause: All WebView `console.log` calls are serialized and round-tripped through the JS bridge on every invocation.
- Improvement path: Remove the console override entirely, or gate it behind a debug flag. Use `onConsoleMessage` if available, or accept that WebView logs are only visible via native devtools.

**MutationObserver triggers `overrideBackButton` on every DOM change:**
- Problem: `watchForBackButton` installs a `MutationObserver` on `document.body` with `subtree: true`. Any DOM mutation (e.g., typing in the chat input) that adds any button anywhere re-schedules `overrideBackButton` with a 100 ms timeout.
- Files: `components/ChatWebView.tsx` (lines 485–508)
- Cause: The observer condition checks for any new button node, which can fire many times per user interaction in a React-rendered widget.
- Improvement path: Disconnect the observer once the back button has been successfully located. Track in a flag and skip re-runs.

## Fragile Areas

**Injected HTML string with interpolated env vars:**
- Files: `components/ChatWebView.tsx` (lines 135–542)
- Why fragile: The entire WebView page is built as a template-literal string inside the React component render cycle. Any unclosed tag, escaping issue, or line break in an env var value can silently break the page. Env var values are interpolated without any sanitization.
- Safe modification: Keep interpolated values to the absolute minimum. Consider moving the HTML to a static asset file and injecting only the config via `injectedJavaScript`.
- Test coverage: None.

**Back button detection depends on undocumented Chatwoot internal CSS classes:**
- Files: `components/ChatWebView.tsx` (lines 388–444)
- Why fragile: Class names like `px-2` and `-ml-` are Tailwind utility classes used internally by Chatwoot's widget. They are subject to change on any Chatwoot upgrade without notice.
- Safe modification: Do not add more heuristic strategies. Invest in a server-side `forwardToReactNative` event from the Chatwoot widget instead.
- Test coverage: None.

**`WebViewMessage.Data` is typed as `any`:**
- Files: `types/webview.ts` (line 3), `services/WebViewMessageHandler.ts` (lines 7, 46–48)
- Why fragile: All message payloads beyond `GotoPage` are untyped. Accessing nested properties (e.g., `message.Data?.message?.content_attributes?.navigation_action`) can throw at runtime if the shape changes.
- Safe modification: Define discriminated union types for each `Process` value (`Log`, `Error`, `ChatMessage`).
- Test coverage: None.

## Test Coverage Gaps

**No tests exist:**
- What's not tested: The entire codebase has zero test files.
- Files: All files under `components/`, `services/`, `types/`, `app/`
- Risk: Any change to message parsing, back button logic, or navigation handling can break silently with no automated detection.
- Priority: High — particularly for `services/WebViewMessageHandler.ts` which contains pure logic that is straightforwardly unit-testable.

**`overrideBackButton` retry logic has no termination guarantee:**
- What's not tested: The function calls itself via `setTimeout(overrideBackButton, 100)` when no button is found (line 481), but also calls itself again from `watchForBackButton` on every DOM mutation. There is no guard preventing both paths from running concurrently, potentially double-binding click handlers. The `data-custom-handler` attribute check is the only guard, but the retry path continues even after success.
- Files: `components/ChatWebView.tsx` (lines 377–483, 485–508)
- Risk: In DOM-heavy interactions, multiple `overrideBackButton` calls could overlap, binding redundant or conflicting handlers.
- Priority: Medium.

## Dependencies at Risk

**No test runner or testing library declared:**
- Risk: `package.json` has no `jest`, `vitest`, `@testing-library/react-native`, or similar dependency. Adding tests requires a setup phase.
- Impact: Test coverage remains zero by default.
- Migration plan: Add `jest` + `@testing-library/react-native` via the Expo preset.

## Missing Critical Features

**Actual navigation is not implemented:**
- Problem: The `onNavigationRequest` callback and `handleConfirmNavigation` function are stubs. No screen transition occurs when the chat widget requests navigation.
- Blocks: The core advertised feature of the component (navigating to app screens from the chat widget) does not function end-to-end.

**No error boundary around the WebView:**
- Problem: There is no React error boundary wrapping `ChatWebView`. A render-time error inside the component will crash the entire tab.
- Files: `app/(tabs)/chat.tsx` (line 122)
- Blocks: Resilient error handling in production.

---

*Concerns audit: 2026-04-05*
