<!-- GSD:project-start source:PROJECT.md -->
## Project

**Chat-Test Expo App — Waters Bot Migration**

An Expo (React Native) mobile app that embeds a chat interface via WebView. Currently loads the Chatwoot JS SDK inline; migrating to load the Waters Bot WebFrontend (watersbot.footgolflegends.com) directly as a URL — simpler, no inline HTML or DOM hacks needed.

**Core Value:** The WebView must load the Waters Bot frontend and pass authentication context so users can chat seamlessly within the native app.

### Constraints

- **Tech stack**: Must remain Expo/React Native with react-native-webview — existing app infrastructure
- **Auth**: Must use Ceremeet token-based auth (type: "ceremeet") — backend requirement
- **Compatibility**: WebFrontend expects window.__CHAT_BACKEND_AUTH__ and window.__CHAT_BACKEND_CONTEXT__ globals
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ~5.8.3 - All application source files (`.ts`, `.tsx`)
- JavaScript - Build scripts (`scripts/reset-project.js`), ESLint config (`eslint.config.js`)
- HTML/CSS - Inline in `components/ChatWebView.tsx` (Chatwoot widget host page generated at runtime)
## Runtime
- Node.js v24.11.0 (detected on host machine; no `.nvmrc` or `.node-version` pinned)
- npm
- Lockfile: `package-lock.json` present
## Frameworks
- React 19.0.0 - UI component model
- React Native 0.79.5 - Cross-platform mobile runtime
- Expo ~53.0.20 - Managed workflow, native module access, build tooling
- expo-router ~5.1.4 - File-based routing; entry point is `expo-router/entry` (see `package.json` `main` field)
- @react-navigation/native ^7.1.6 - Navigation primitives (used by expo-router)
- @react-navigation/bottom-tabs ^7.3.10 - Tab bar navigator used in `app/(tabs)/_layout.tsx`
- react-native-reanimated ~3.17.4 - Animations
- react-native-gesture-handler ~2.24.0 - Gesture system
- react-native-safe-area-context 5.4.0 - Safe area insets
- react-native-screens ~4.11.1 - Native screen containers
- expo-blur ~14.1.5 - Blur effects
- expo-haptics ~14.1.4 - Haptic feedback
- expo-image ~2.4.0 - Optimised image component
- @expo/vector-icons ^14.1.0 - Icon sets
- expo-symbols ~0.4.5 - SF Symbols (iOS)
- react-native-webview 13.13.5 - Embeds the Chatwoot chat widget; core integration component at `components/ChatWebView.tsx`
- react-dom 19.0.0
- react-native-web ~0.20.0
- Metro bundler (configured via `app.json` `web.bundler: "metro"`)
- None detected
- Babel @babel/core ^7.25.2 - JS transpilation
- TypeScript strict mode with path alias `@/*` → `./*` (see `tsconfig.json`)
- ESLint ^9.25.0 with `eslint-config-expo ~9.2.0` (flat config at `eslint.config.js`)
- Expo CLI - `expo start`, `expo lint`
## Key Dependencies
- `react-native-webview` 13.13.5 - The entire Chatwoot chat integration is built on top of this; removing or upgrading requires re-testing all message bridging logic in `components/ChatWebView.tsx`
- `expo-router` ~5.1.4 - File-based routing drives navigation; all screens live under `app/`
- `expo-linking` ~7.1.7 - Used indirectly via `Linking.openURL()` in `components/ChatWebView.tsx` to open external URLs in the system browser
- `expo-font` ~13.3.2 - Loads `SpaceMono-Regular.ttf` at app start (`app/_layout.tsx`)
- `expo-splash-screen` ~0.30.10 - Splash screen configuration
- `expo-constants` ~17.1.7 - App metadata access
- `expo-status-bar` ~2.2.3 - Status bar control
- `expo-system-ui` ~5.0.10 - System UI (Android edge-to-edge)
- `expo-web-browser` ~14.2.0 - Available but not directly invoked; `Linking` is used instead
## Configuration
- Runtime env vars are read via `process.env.EXPO_PUBLIC_*` in `components/ChatWebView.tsx`
- Required variables (see `env.sample`):
- `.env` is gitignored; `env.sample` is committed as a reference template
- All `EXPO_PUBLIC_` vars are inlined into the client bundle at build time — they are not secret
- `app.json` - Expo app config (name, slug, icons, plugins, scheme `chattest`, `newArchEnabled: true`)
- `tsconfig.json` - Extends `expo/tsconfig.base`, strict mode, `@/` path alias
- `eslint.config.js` - Flat config extending `eslint-config-expo`
## Platform Requirements
- Node.js (v24 in use; no pinned version file)
- Expo CLI (`npx expo` or global install)
- iOS Simulator or Android Emulator, or Expo Go app on device
- Copy `env.sample` to `.env` and fill in Chatwoot credentials
- Expo managed workflow — build via `eas build` or `expo build`
- Targets: iOS (`ios.supportsTablet: true`), Android (edge-to-edge enabled), Web (static Metro output)
- App scheme: `chattest` (for deep linking)
- New Architecture enabled (`newArchEnabled: true` in `app.json`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase (e.g., `ChatWebView.tsx`, `ConfirmationModal.tsx`, `ThemedText.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useColorScheme.ts`, `useThemeColor.ts`)
- Services/classes: PascalCase (e.g., `WebViewMessageHandler.ts`)
- Type definition files: camelCase (e.g., `webview.ts`)
- Constants: camelCase (e.g., `Colors.ts`)
- Platform-specific files: `filename.ios.tsx` (e.g., `IconSymbol.ios.tsx`, `TabBarBackground.ios.tsx`, `useColorScheme.web.ts`)
- Named exports using `const` + `React.FC<Props>` for reusable components: `export const ChatWebView: React.FC<ChatWebViewProps>`
- Default exports for screens and layouts: `export default function ChatScreen()`
- Reusable/shared components always use named exports
- Event handlers: `handle` prefix (e.g., `handleWebViewMessage`, `handleConfirmNavigation`, `handleCancelNavigation`)
- Toggle functions: `toggle` prefix (e.g., `toggleWebView`)
- Getter functions: `get` prefix (e.g., `getMessageHistory`, `getMessageStats`)
- Utility helpers: descriptive verb names (e.g., `hideBubblePermanently`, `overrideBackButton`)
- Local variables and state: camelCase (e.g., `isVisible`, `showConfirmModal`, `pendingNavigation`)
- Style constants: camelCase (e.g., `styles`, `tintColorLight`, `tintColorDark`)
- Interfaces: PascalCase, no `I` prefix (e.g., `WebViewMessage`, `ChatWebViewProps`, `ConfirmationModalProps`)
- Type aliases: PascalCase (e.g., `ThemedTextProps`)
- Interface type extension: `Props` suffix (e.g., `ChatWebViewProps`, `ConfirmationModalProps`, `ThemedTextProps`)
- WebView message fields use PascalCase: `Process`, `Data`, `PageName`, `CaseId`
- This is a deliberate choice for the inter-process protocol, not a general convention
## Code Style
- No Prettier config file present; relies on editor defaults and ESLint auto-fix
- Indentation: 2 spaces
- Quotes: single quotes for imports, template literals for dynamic strings
- Trailing commas: used in multi-line object/array literals
- ESLint via `eslint.config.js` using `eslint-config-expo/flat`
- Expo's recommended ruleset applied
- `dist/*` directory ignored
- No custom rules beyond Expo defaults
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Path alias `@/*` maps to project root (e.g., `import { Colors } from '@/constants/Colors'`)
- Type `any` is used in several places in service callbacks (`onChatMessage: (messageData: any)`, `style?: any`)
## Import Organization
- `@/*` resolves to project root — used in shared/utility imports
- Relative paths (`../`, `../../`) used for direct cross-folder imports in screens and examples
## Error Handling
- `try/catch` wrapping JSON parsing of WebView messages in `components/ChatWebView.tsx`
- `try/catch` with `console.error` fallback in `services/WebViewMessageHandler.ts`
- `Linking.openURL(...).catch(err => console.error(...))` for external URL opening
- Guard clause pattern with early return: `if (!url) return true`
- Errors surfaced to user via `Alert.alert('WebView Error', errorData.error)` in `app/(tabs)/chat.tsx`
- Silent fallback in navigation interception: `catch (e) { console.warn(...); return true; }`
## Logging
- Emoji prefixes used to visually categorize log types in console output:
- All significant events are logged with structured objects including `timestamp: new Date().toISOString()`
- Debug logs are left in production code — no log level gating
## Comments
- Inline comments explaining non-obvious logic (e.g., `// Netflix dark background`, `// Keep only last 100 messages to prevent memory issues`)
- Section separator comments for major code blocks within a file (e.g., `// Inject ReactNativeWebView before content loads`)
- JSDoc blocks used only in example files (`examples/ChatWebViewExample.tsx`) not in production components
- Used for hardcoded values: `backgroundColor: '#141414', // Netflix dark background`
- Used to explain workarounds and strategies in the back-button detection code
## Function Design
- React components return JSX
- Event handlers return `void` or boolean (for `onShouldStartLoadWithRequest`)
- Service methods return data copies with spread: `return [...this.messageLog]`
## Component Design
- Props defined as TypeScript interfaces in the same file or in `types/webview.ts`
- Optional props use `?` (e.g., `onMessage?`, `style?`)
- Default prop values set via destructuring defaults (e.g., `confirmText = 'Confirm'`)
- All styles defined with `StyleSheet.create({})` at the bottom of each file
- Style objects named `styles` consistently
- Hardcoded hex color values — no design token system (colors used: `#141414`, `#e50914`, `#333`, `#222`, `#666`, `#999`, `#fff`)
- Style composition via array spread: `style={[styles.button, styles.primaryButton]}`
- Local `useState` for UI state within screens
- `useRef` for stable class instances: `const messageHandler = useRef(new WebViewMessageHandler()).current`
- No global state management (no Redux, Zustand, Context API)
## Module Design
- Screens: default export
- Reusable components: named export
- Hooks: named export
- Services: named class export (`export class WebViewMessageHandler`)
- Types: named interface exports
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- File-based routing via `expo-router` — screens are defined by filesystem structure under `app/`
- Thin screen layer delegates WebView message processing to a dedicated service class
- Bidirectional message bridge: React Native injects JavaScript into the WebView; the WebView posts structured messages back via `ReactNativeWebView.postMessage`
- Platform-adaptive UI using dark/light theming with a `useThemeColor` hook
## Layers
- Purpose: Define navigable screens; own top-level state for the screen lifecycle
- Location: `app/` and `app/(tabs)/`
- Contains: Screen components (`chat.tsx`, `index.tsx`, `explore.tsx`), layout files (`_layout.tsx`)
- Depends on: `components/`, `services/`, `types/`
- Used by: `expo-router` file-system router
- Purpose: Reusable, presentational React Native components
- Location: `components/` and `components/ui/`
- Contains: `ChatWebView.tsx` (WebView shell + injected JS), `ConfirmationModal.tsx`, themed primitives (`ThemedText`, `ThemedView`), platform UI helpers (`IconSymbol`, `TabBarBackground`, `HapticTab`)
- Depends on: `types/`, `constants/`, `hooks/`
- Used by: Screen layer
- Purpose: Business logic for processing WebView messages, maintaining a message log, and dispatching typed callbacks
- Location: `services/`
- Contains: `WebViewMessageHandler.ts` (class-based, instantiated via `useRef` in screens)
- Depends on: `types/`
- Used by: Screen layer (`app/(tabs)/chat.tsx`)
- Purpose: Shared TypeScript interfaces for the WebView message protocol
- Location: `types/`
- Contains: `webview.ts` — `WebViewMessage`, `GotoPageMessage`, `ChatWebViewProps`
- Depends on: nothing
- Used by: all layers
- Purpose: App-wide theming values and React hooks
- Location: `constants/`, `hooks/`
- Contains: `Colors.ts` (light/dark palettes), `useColorScheme.ts`, `useThemeColor.ts`
- Depends on: nothing
- Used by: Component layer, layout files
## Data Flow
- No global state store. All state is local React `useState` within individual screen components.
- `WebViewMessageHandler` instance is persisted across renders via `useRef` in `chat.tsx`.
## Key Abstractions
- Purpose: Typed envelope for all messages between the Chatwoot widget and React Native
- Examples: `types/webview.ts`
- Pattern: `{ Process: string, Data: any }` — discriminated by `Process` values: `'GotoPage'`, `'ChatMessage'`, `'Log'`, `'Error'`
- Purpose: Encapsulates the WebView shell, injects the Chatwoot SDK HTML, registers JavaScript handlers, and intercepts navigation requests to route external links via `Linking`
- Examples: `components/ChatWebView.tsx`
- Pattern: Functional component with `useRef<WebView>` for imperative access; reads env vars directly from `process.env.EXPO_PUBLIC_*`
- Purpose: Stateful message dispatcher; maintains a capped log of the last 100 messages and provides `getMessageHistory()` / `getMessageStats()` for debugging
- Examples: `services/WebViewMessageHandler.ts`
- Pattern: Plain TypeScript class instantiated once per screen via `useRef`
- Purpose: `ThemedText` and `ThemedView` automatically apply light/dark colors from the palette
- Examples: `components/ThemedText.tsx`, `components/ThemedView.tsx`
- Pattern: Wrap native RN primitives; accept `lightColor`/`darkColor` overrides; fall back to `useThemeColor`
## Entry Points
- Location: `app/_layout.tsx`
- Triggers: Expo Router mounts this as the root Stack navigator
- Responsibilities: Load fonts, apply theme provider, define root stack screens
- Location: `app/(tabs)/_layout.tsx`
- Triggers: Root Stack renders the `(tabs)` group
- Responsibilities: Configure three tab screens (Home, Chat, Explore) with icons and haptic feedback
- Location: `app/(tabs)/chat.tsx`
- Triggers: User taps the Chat tab
- Responsibilities: Render `ChatWebView`, manage visibility toggle, own `WebViewMessageHandler` instance, handle navigation confirmation flow
- Location: `app/+not-found.tsx`
- Triggers: `expo-router` navigates to an unrecognised route
- Responsibilities: Display error message and link back to home
## Error Handling
- `ChatWebView` wraps `JSON.parse` in try/catch and logs raw message on failure
- `WebViewMessageHandler.handleMessage` wraps the entire dispatch in try/catch, marks the log entry as `handled: false` on exception
- WebView load errors (`onError`, `onHttpError`) log to console
- External link failures (`Linking.openURL`) log via `console.error`
- Chatwoot widget errors are forwarded as `Process: 'Error'` messages back to the native layer
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
