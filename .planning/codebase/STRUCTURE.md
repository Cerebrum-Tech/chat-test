# Codebase Structure

**Analysis Date:** 2026-04-05

## Directory Layout

```
chat-test/
├── app/                    # Expo Router screens and navigation layouts
│   ├── (tabs)/             # Tab group — renders as bottom-tab navigator
│   │   ├── _layout.tsx     # Tab navigator config (3 tabs: Home, Chat, Explore)
│   │   ├── index.tsx       # Home tab screen
│   │   ├── chat.tsx        # Chat tab screen (primary feature)
│   │   └── explore.tsx     # Explore tab screen
│   ├── _layout.tsx         # Root Stack layout — font loading, theme provider
│   └── +not-found.tsx      # 404 fallback screen
├── components/             # Reusable React Native components
│   ├── ChatWebView.tsx     # Chatwoot WebView shell (core feature component)
│   ├── ConfirmationModal.tsx # Modal for navigation confirmation
│   ├── Collapsible.tsx     # Expandable section component
│   ├── ExternalLink.tsx    # Link that opens in system browser
│   ├── HapticTab.tsx       # Tab bar button with haptic feedback
│   ├── HelloWave.tsx       # Animated wave component
│   ├── ParallaxScrollView.tsx # Scroll view with parallax header
│   ├── ThemedText.tsx      # Text with automatic light/dark theming
│   ├── ThemedView.tsx      # View with automatic light/dark theming
│   └── ui/                 # Platform-specific UI primitives
│       ├── IconSymbol.tsx       # Cross-platform SF Symbol / MaterialIcons icon
│       ├── IconSymbol.ios.tsx   # iOS-specific icon implementation
│       ├── TabBarBackground.tsx # Default tab bar background
│       └── TabBarBackground.ios.tsx # iOS blur tab bar background
├── services/               # Business logic / non-UI classes
│   └── WebViewMessageHandler.ts # Message dispatcher and history logger
├── types/                  # Shared TypeScript interfaces
│   └── webview.ts          # WebViewMessage, GotoPageMessage, ChatWebViewProps
├── hooks/                  # Custom React hooks
│   ├── useColorScheme.ts   # Re-export of RN useColorScheme (native)
│   ├── useColorScheme.web.ts # Web-compatible color scheme detection
│   └── useThemeColor.ts    # Resolve color from palette based on color scheme
├── constants/              # App-wide static values
│   └── Colors.ts           # Light/dark color palette
├── assets/                 # Static assets
│   ├── fonts/              # Custom fonts (SpaceMono-Regular.ttf)
│   └── images/             # Static images (icons, splash, logos)
├── examples/               # Reference implementations (not mounted in routing)
│   ├── ChatWebViewExample.tsx     # Minimal ChatWebView integration example
│   └── DirectNavigationExample.tsx # Direct navigation pattern example
├── scripts/                # Build/dev utilities
│   └── reset-project.js    # Moves app/ to app-example/ for a fresh start
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase analysis documents
├── app.json                # Expo app configuration (name, slug, icons)
├── tsconfig.json           # TypeScript config (strict mode, @/* path alias)
├── eslint.config.js        # ESLint configuration
├── package.json            # npm dependencies and scripts
├── env.sample              # Sample environment variable definitions
└── .gitignore
```

## Directory Purposes

**`app/`:**
- Purpose: All navigable screens and their layouts, consumed by `expo-router`
- Contains: Screen components (`*.tsx`), navigator layouts (`_layout.tsx`), error screen (`+not-found.tsx`)
- Key files: `app/_layout.tsx` (root), `app/(tabs)/_layout.tsx` (tab navigator), `app/(tabs)/chat.tsx` (main feature)

**`app/(tabs)/`:**
- Purpose: Screens rendered inside the bottom tab navigator
- Contains: One file per tab (`index.tsx`, `chat.tsx`, `explore.tsx`) plus `_layout.tsx`
- Key files: `app/(tabs)/chat.tsx` — owns the ChatWebView integration

**`components/`:**
- Purpose: Shared, reusable UI components consumed by screens
- Contains: Feature components (`ChatWebView.tsx`, `ConfirmationModal.tsx`) and generic UI helpers
- Key files: `components/ChatWebView.tsx` — the most complex component; embeds entire Chatwoot HTML + JS

**`components/ui/`:**
- Purpose: Low-level platform-specific primitives (icons, tab bar backgrounds)
- Contains: Platform-split files using `.ios.tsx` suffix for iOS variants

**`services/`:**
- Purpose: Non-React business logic
- Contains: Class-based service `WebViewMessageHandler.ts`
- Key files: `services/WebViewMessageHandler.ts` — message routing, logging, statistics

**`types/`:**
- Purpose: TypeScript type definitions shared across the codebase
- Contains: Interface files only (no runtime code)
- Key files: `types/webview.ts`

**`hooks/`:**
- Purpose: React custom hooks
- Contains: Theme/color scheme utilities; `.web.ts` variants for web platform
- Key files: `hooks/useThemeColor.ts`

**`constants/`:**
- Purpose: Static app-wide values (not environment-specific)
- Key files: `constants/Colors.ts`

**`examples/`:**
- Purpose: Reference code for integration patterns; NOT imported by the running app
- Contains: `ChatWebViewExample.tsx`, `DirectNavigationExample.tsx`
- Generated: No — Committed: Yes

**`scripts/`:**
- Purpose: Dev utility scripts run via `npm run`
- Contains: `reset-project.js` — moves `app/` to `app-example/` to restore a blank slate

## Key File Locations

**Entry Points:**
- `app/_layout.tsx`: Root navigator — font loading, theme provider, Stack definition
- `app/(tabs)/_layout.tsx`: Tab navigator — tab configuration and icons

**Primary Feature:**
- `app/(tabs)/chat.tsx`: Chat screen — state management for WebView visibility and navigation confirmation
- `components/ChatWebView.tsx`: WebView wrapper — HTML injection, Chatwoot SDK loading, JS bridge
- `services/WebViewMessageHandler.ts`: Message routing and history

**Type Contracts:**
- `types/webview.ts`: All interfaces for the WebView bridge protocol

**Configuration:**
- `app.json`: Expo project config (bundle ID, icons, splash)
- `tsconfig.json`: TypeScript config (strict, `@/*` alias pointing to project root)
- `eslint.config.js`: Linting rules
- `env.sample`: Required `EXPO_PUBLIC_*` environment variable names

**Theming:**
- `constants/Colors.ts`: Light/dark color tokens
- `hooks/useThemeColor.ts`: Color resolver hook
- `components/ThemedText.tsx`, `components/ThemedView.tsx`: Themed primitives

## Naming Conventions

**Files:**
- PascalCase for components: `ChatWebView.tsx`, `ConfirmationModal.tsx`, `ThemedText.tsx`
- camelCase for hooks: `useColorScheme.ts`, `useThemeColor.ts`
- PascalCase for service classes: `WebViewMessageHandler.ts`
- camelCase for constants files: `Colors.ts` (first-letter capitalised by convention)
- Platform variants use dot suffix: `IconSymbol.ios.tsx`, `useColorScheme.web.ts`

**Directories:**
- Lowercase for all directories: `app/`, `components/`, `services/`, `types/`, `hooks/`, `constants/`
- Expo Router group syntax for tab group: `(tabs)/`
- Expo Router special prefixes: `_layout.tsx` for layouts, `+not-found.tsx` for 404

**Exports:**
- Named exports for components and services: `export const ChatWebView`, `export class WebViewMessageHandler`
- Default exports for screen/page components (required by Expo Router): `export default function ChatScreen()`

## Where to Add New Code

**New Screen:**
- Create `app/(tabs)/[screenName].tsx` for a new tab, or `app/[screenName].tsx` for a modal/stack screen
- Register in `app/(tabs)/_layout.tsx` as a `<Tabs.Screen>` if adding a tab

**New Reusable Component:**
- Implementation: `components/[ComponentName].tsx`
- If platform-specific: `components/[ComponentName].ios.tsx` alongside `components/[ComponentName].tsx`

**New Service / Business Logic:**
- Implementation: `services/[ServiceName].ts`
- Instantiate in the consuming screen via `useRef(new ServiceName()).current`

**New Type Definitions:**
- Add to `types/webview.ts` if related to the WebView bridge
- Or create `types/[domain].ts` for a new domain

**New Hook:**
- Implementation: `hooks/use[HookName].ts`
- Add `.web.ts` variant if web behaviour differs

**New Constant:**
- Add to `constants/Colors.ts` for colour tokens
- Create `constants/[Name].ts` for other static values

**New Integration Example:**
- Implementation: `examples/[ExampleName].tsx`
- These are documentation/reference only — not imported by the app

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: No
- Committed: Yes

**`examples/`:**
- Purpose: Non-running reference implementations for integration patterns
- Generated: No
- Committed: Yes

**`assets/`:**
- Purpose: Fonts and images bundled with the app via Metro/Expo
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-05*
