# Concerns

**Updated:** 2026-07-21

## Security and privacy

### Expo public configuration is visible

Every EXPO_PUBLIC_ value is bundled into the client. The six supported fields must contain only endpoint and public user context data. Adding credentials, bearer values, private storage keys, or unbounded context would expose them to users.

Mitigation: keep the allowlist in services/webViewBootstrap.ts, leave authentication with the frontend AuthProvider, and retain tests that reject unsupported properties and token-like data.

### Browser context contains identity hints

userId and userName may still be personal data even though they are not authentication. Do not log the injected script, environment, raw messages, or context. Production values should follow the organization's privacy policy.

## Networking and deployment

### Device-local localhost is usually wrong

An emulator or physical device must reach the development host. Android Emulator uses 10.0.2.2; a physical device needs a routable LAN address, an accepting service bind, and appropriate firewall rules.

Mitigation: test the frontend URL from the target device before diagnosing the WebView. Test a backend URL separately only when the optional direct API override is configured.

### Missing frontend URL fails at runtime

ChatWebView currently produces an empty source URI when EXPO_PUBLIC_CAI_FRONTEND_URL is absent. The WebView error callbacks log a fixed warning, but there is no user-facing configuration screen.

Mitigation: validate .env during setup and include npx expo config plus a device smoke in release checks. A future typed configuration boundary could fail earlier.

### Development ports are not universal

env.sample is illustrative. The global Vite server prints its actual port, and deployed environments may use a different origin.

Mitigation: configure the exact device-reachable URL rather than assuming a port.

### Direct API overrides require a matching CORS origin

The global backend's default development allowlist covers localhost Vite origins, not an Android Emulator WebView origin such as http://10.0.2.2:5174. Setting EXPO_PUBLIC_CAI_API_BASE_URL to http://10.0.2.2:8000 without updating the backend therefore makes browser API requests fail CORS.

Mitigation: omit the API override for local device smoke and let Vite's same-origin /v1 proxy reach CAICore. If a direct override is required, add the WebView's exact scheme, host, and port to ALLOWED_ORIGINS in the global CAICore/.env before starting Compose.

## Authentication and cache

### Session behavior spans two policies

Document caching is disabled, while DOM storage remains enabled so AuthProvider can maintain a mounted session. Re-entering chat remounts the WebView and may require the frontend to restore or establish authentication.

Mitigation: keep authentication tests in the frontend and exercise leave/re-enter behavior on a device.

## Native navigation

### The bridge is intentionally strict

Any spelling, casing, extra key, unknown destination, or incorrect case_id type is ignored. This prevents accidental native routing but requires coordinated contract changes across the global frontend and this host.

Mitigation: update types and parser tests together, and preserve exact contract examples in maintained docs.

### Duplicate suppression is screen-lifetime scoped

ChatScreen suppresses repeat callbacks after the first accepted request until unmount. It does not provide a durable cross-mount ledger.

Mitigation: the frontend must post only newly ingested SSE actions and must not replay restored REST history. Cover both frontend page-lifetime deduplication and native screen-lifetime suppression in integration smoke.

### Only one destination is supported

GotoPage/MainPage is an explicit allowlist, not a generic router bridge.

Mitigation: add future destinations through a reviewed type, parser, route-map, and test change. Never route an arbitrary path from WebView input.

## External URL handling

Same-origin checks compare URL origins. A scheme or port change is external even when the hostname matches. tel and mailto depend on installed device handlers, and Linking failures currently produce only a fixed warning.

Mitigation: exercise representative link types on each supported mobile platform.

## Test coverage

Unit and component tests cover the native boundary, but there is no automated device E2E suite. Live AuthProvider, REST/SSE, operating-system linking, network reachability, and history restoration require the Docker/device smoke matrix.

## Dependency health

The current deterministic install reports 29 dependency audit findings: 1 low, 15 moderate, 11 high, and 2 critical. These are not changed automatically because forced audit fixes may cross Expo compatibility boundaries.

Mitigation: triage dependency advisories separately, prefer Expo-compatible upgrades, and rerun all native checks after updates.

Expo startup also recommends newer SDK-compatible patch releases for expo, expo-constants, expo-image, expo-router, expo-system-ui, and react-native. The current versions pass Jest, TypeScript, lint, public config, Metro startup, and Android export, but the compatibility set should be updated as a separate dependency-maintenance change.
