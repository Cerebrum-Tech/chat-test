# Roadmap

## Milestone: global frontend native host

Status: implementation and automated verification complete; live device validation pending

### 1. Automated baseline

- [x] Configure Jest with the Expo preset.
- [x] Add React Native Testing Library and test scripts.
- [x] Establish a passing harness.

### 2. Direct frontend and public context

- [x] Replace generated WebView content with direct Vite frontend loading.
- [x] Define the six supported Expo environment fields.
- [x] Inject only an optional API URL and allowlisted public context.
- [x] Keep REST/SSE ownership in the frontend and AuthProvider as the only possible token owner.
- [x] Ensure no native token injection.
- [x] Record the current Erikli `auth.enabled: false` direct-load/REST/SSE smoke target.
- [x] Mark auth-enabled Expo hosting unsupported pending a tested browser/deep-link session handoff.

### 3. WebView navigation and cache policy

- [x] Add a pure same-origin and scheme classifier.
- [x] Keep same-origin HTTP(S) internal.
- [x] Open supported external URLs through Linking.
- [x] Block malformed and unsupported URLs.
- [x] Disable document caching and retain DOM storage.
- [x] Retain mixed-content compatibility and third-party cookies as explicit production-hardening concerns.

### 4. Immediate native navigation

- [x] Parse the exact lowercase action.
- [x] Reject malformed, unknown, extra, and incorrectly typed input.
- [x] Replace immediately with /main-page.
- [x] Suppress duplicate callbacks before unmount.
- [x] Display the optional incident ID and implement Back to chat.

### 5. Maintained documentation and host verification

- [x] Refresh setup, architecture, integration, convention, structure, concern, and testing documents.
- [x] Keep .planning/phases/01-migration unchanged as historical evidence.
- [x] Define automated verification, Android export, Docker stack, and device smoke procedures.
- [x] Require global `feat/native-client-actions` commit `66c88d5` or a merged descendant before complete-stack smoke and native rollout.
- [ ] Execute the live Docker/device smoke; it was not completed in the implementation environment.

## Future work

Dependency maintenance, platform E2E automation, production WebView hardening, and auth-enabled browser/deep-link callback support should be planned separately.
