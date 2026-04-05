# Coding Conventions

**Analysis Date:** 2026-04-05

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `ChatWebView.tsx`, `ConfirmationModal.tsx`, `ThemedText.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useColorScheme.ts`, `useThemeColor.ts`)
- Services/classes: PascalCase (e.g., `WebViewMessageHandler.ts`)
- Type definition files: camelCase (e.g., `webview.ts`)
- Constants: camelCase (e.g., `Colors.ts`)
- Platform-specific files: `filename.ios.tsx` (e.g., `IconSymbol.ios.tsx`, `TabBarBackground.ios.tsx`, `useColorScheme.web.ts`)

**Components:**
- Named exports using `const` + `React.FC<Props>` for reusable components: `export const ChatWebView: React.FC<ChatWebViewProps>`
- Default exports for screens and layouts: `export default function ChatScreen()`
- Reusable/shared components always use named exports

**Functions:**
- Event handlers: `handle` prefix (e.g., `handleWebViewMessage`, `handleConfirmNavigation`, `handleCancelNavigation`)
- Toggle functions: `toggle` prefix (e.g., `toggleWebView`)
- Getter functions: `get` prefix (e.g., `getMessageHistory`, `getMessageStats`)
- Utility helpers: descriptive verb names (e.g., `hideBubblePermanently`, `overrideBackButton`)

**Variables:**
- Local variables and state: camelCase (e.g., `isVisible`, `showConfirmModal`, `pendingNavigation`)
- Style constants: camelCase (e.g., `styles`, `tintColorLight`, `tintColorDark`)

**Types and Interfaces:**
- Interfaces: PascalCase, no `I` prefix (e.g., `WebViewMessage`, `ChatWebViewProps`, `ConfirmationModalProps`)
- Type aliases: PascalCase (e.g., `ThemedTextProps`)
- Interface type extension: `Props` suffix (e.g., `ChatWebViewProps`, `ConfirmationModalProps`, `ThemedTextProps`)

**Message Protocol Fields:**
- WebView message fields use PascalCase: `Process`, `Data`, `PageName`, `CaseId`
- This is a deliberate choice for the inter-process protocol, not a general convention

## Code Style

**Formatting:**
- No Prettier config file present; relies on editor defaults and ESLint auto-fix
- Indentation: 2 spaces
- Quotes: single quotes for imports, template literals for dynamic strings
- Trailing commas: used in multi-line object/array literals

**Linting:**
- ESLint via `eslint.config.js` using `eslint-config-expo/flat`
- Expo's recommended ruleset applied
- `dist/*` directory ignored
- No custom rules beyond Expo defaults

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Path alias `@/*` maps to project root (e.g., `import { Colors } from '@/constants/Colors'`)
- Type `any` is used in several places in service callbacks (`onChatMessage: (messageData: any)`, `style?: any`)

## Import Organization

**Order (observed pattern):**
1. React and React Native core (`import React`, `import { ... } from 'react-native'`)
2. Third-party packages (`import WebView from 'react-native-webview'`)
3. Internal components via relative or `@/` alias paths
4. Types (`import { WebViewMessage } from '../types/webview'`)

**Path Aliases:**
- `@/*` resolves to project root — used in shared/utility imports
- Relative paths (`../`, `../../`) used for direct cross-folder imports in screens and examples

## Error Handling

**Patterns:**
- `try/catch` wrapping JSON parsing of WebView messages in `components/ChatWebView.tsx`
- `try/catch` with `console.error` fallback in `services/WebViewMessageHandler.ts`
- `Linking.openURL(...).catch(err => console.error(...))` for external URL opening
- Guard clause pattern with early return: `if (!url) return true`
- Errors surfaced to user via `Alert.alert('WebView Error', errorData.error)` in `app/(tabs)/chat.tsx`
- Silent fallback in navigation interception: `catch (e) { console.warn(...); return true; }`

## Logging

**Framework:** `console` (native browser/RN console)

**Patterns:**
- Emoji prefixes used to visually categorize log types in console output:
  - `📥` incoming messages
  - `🚀` navigation events
  - `💬` chat messages
  - `❌` errors
  - `✅` success/completion
  - `⚠️` warnings
  - `🔄` loading states
- All significant events are logged with structured objects including `timestamp: new Date().toISOString()`
- Debug logs are left in production code — no log level gating

## Comments

**When to Comment:**
- Inline comments explaining non-obvious logic (e.g., `// Netflix dark background`, `// Keep only last 100 messages to prevent memory issues`)
- Section separator comments for major code blocks within a file (e.g., `// Inject ReactNativeWebView before content loads`)
- JSDoc blocks used only in example files (`examples/ChatWebViewExample.tsx`) not in production components

**Inline Code Comments:**
- Used for hardcoded values: `backgroundColor: '#141414', // Netflix dark background`
- Used to explain workarounds and strategies in the back-button detection code

## Function Design

**Size:** Functions are generally medium-sized; `handleWebViewMessage` in `ChatWebView.tsx` is larger due to inline HTML generation

**Parameters:** Props destructured at function signature level for components; callback objects used for message handlers

**Return Values:**
- React components return JSX
- Event handlers return `void` or boolean (for `onShouldStartLoadWithRequest`)
- Service methods return data copies with spread: `return [...this.messageLog]`

## Component Design

**Props Pattern:**
- Props defined as TypeScript interfaces in the same file or in `types/webview.ts`
- Optional props use `?` (e.g., `onMessage?`, `style?`)
- Default prop values set via destructuring defaults (e.g., `confirmText = 'Confirm'`)

**Styling:**
- All styles defined with `StyleSheet.create({})` at the bottom of each file
- Style objects named `styles` consistently
- Hardcoded hex color values — no design token system (colors used: `#141414`, `#e50914`, `#333`, `#222`, `#666`, `#999`, `#fff`)
- Style composition via array spread: `style={[styles.button, styles.primaryButton]}`

**State Management:**
- Local `useState` for UI state within screens
- `useRef` for stable class instances: `const messageHandler = useRef(new WebViewMessageHandler()).current`
- No global state management (no Redux, Zustand, Context API)

## Module Design

**Exports:**
- Screens: default export
- Reusable components: named export
- Hooks: named export
- Services: named class export (`export class WebViewMessageHandler`)
- Types: named interface exports

**Barrel Files:** Not used — all imports are direct file imports

---

*Convention analysis: 2026-04-05*
