# Technology stack

**Updated:** 2026-07-21

## Runtime

- Node.js with npm and package-lock.json.
- Expo SDK ~53.0.20.
- React 19.0.0.
- React Native 0.79.5.
- TypeScript ~5.8.3 in strict mode.

No Node version file is committed. Use an actively supported Node release compatible with Expo SDK 53 and npm ci.

## Navigation and native UI

- expo-router ~5.1.4 provides file-based routing and the expo-router/entry application entry.
- @react-navigation/native ^7.1.6 and @react-navigation/bottom-tabs ^7.3.10 support the root stack and tabs.
- react-native-screens, react-native-safe-area-context, react-native-gesture-handler, and react-native-reanimated support native navigation and layout.
- Expo UI packages provide fonts, splash screen, status bar, haptics, blur, images, symbols, and system UI.

## Web host integration

- react-native-webview 13.13.5 loads the global Vite frontend directly.
- React Native Linking opens supported external URLs.
- injectedJavaScriptBeforeContentLoaded supplies optional API configuration and public user context.
- No native REST, SSE, or authentication client is installed for chat; the loaded frontend owns those capabilities.

## Testing and quality

- Jest 29.7.0.
- jest-expo ~53.0.9.
- @types/jest 29.5.14.
- @testing-library/react-native 13.3.3.
- ESLint ^9.25.0 with eslint-config-expo ~9.2.0.
- TypeScript no-emit checking.
- Expo public config and Android static export.

package.json scripts:

~~~text
npm test -- --runInBand
npm run typecheck
npm run lint
~~~

## Configuration

- app.json defines app metadata, platform configuration, expo-router, splash behavior, the chattest scheme, and the React Native New Architecture.
- tsconfig.json extends expo/tsconfig.base, enables strict checking, and maps @/* to the project root.
- eslint.config.js uses Expo's flat configuration and ignores dist.
- env.sample documents the six public CAICore host fields.
- .env is local and gitignored.

## Targets

- Android, including edge-to-edge layout.
- iOS, including tablet support.
- Expo's web target for general project compatibility, though the primary feature is the native WebView host.

## Related global stack

The global repository uses a React Vite WebFrontend, FastAPI CAICore backend, conversations REST/SSE, Cosmos persistence, a CRM tool service, and Docker Compose for local services. Those packages are external runtime dependencies of the device smoke, not dependencies imported by this native project.
