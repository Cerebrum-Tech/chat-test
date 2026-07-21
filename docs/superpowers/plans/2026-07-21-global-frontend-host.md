# Global Frontend Expo Host Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load the migrated global Vite frontend directly in the Expo WebView and immediately replace the native route with `/main-page` for the exact lowercase `GotoPage/MainPage` action.

**Architecture:** The WebView host injects only the global frontend's supported API/context globals before bundle startup, then delegates raw bridge data to a strict pure parser and an allowlisted route map. A pure URL policy decides whether WebView requests stay internal, open through React Native `Linking`, or are blocked. The chat screen owns a one-flight guard and calls Expo Router immediately; no confirmation or Chatwoot-era handler remains.

**Tech Stack:** Expo 53.0.20, Expo Router 5.1.4, React 19.0.0, React Native 0.79.5, react-native-webview 13.13.5, TypeScript 5.8.3, Jest 29.7, jest-expo 53, React Native Testing Library 13.3.3.

## Global Constraints

- Work only in `/home/alp/alp-dev/nestle-waters-tr-go/CAICore/chat-test`; the byte-identical sibling `/home/alp/alp-dev/nestle-waters-tr-go/chat-test` is out of scope.
- Load the global Vite frontend URL directly with `source={{ uri }}`; do not add Chatwoot, inline widget HTML, an iframe wrapper, or a parent-window relay.
- Inject optional `window.__CAI_API_BASE_URL__` and `window.__CHAT_BACKEND_CONTEXT__` with `userId`, `userName`, `language`, and `country` before content loads.
- Do not inject `window.__CHAT_BACKEND_AUTH__`, access tokens, private storage keys, query-string tokens, or token-bearing conversation metadata. The bootstrap allowlist rejects unsupported property names but does not inspect allowed string values for token-like content; callers must keep those values public.
- The current Erikli global channel has `auth.enabled: false`; smoke is scoped to direct load and conversations REST/SSE without login. If auth is enabled later, the WebFrontend `AuthProvider` remains the only token owner, but Expo hosting is unsupported until a separately designed and tested system-browser/deep-link callback preserves the WebView auth-result/session context.
- Complete-stack, Vite, and live-action smoke require global `feat/native-client-actions` at `4bb5772` or a merged descendant. Check out or deploy that global revision first, then this native host.
- Accept only lowercase `output_type/process/data.page_name/data.case_id`; deliberately reject all legacy PascalCase fields.
- Allow only `GotoPage/MainPage -> /main-page`; route immediately with no modal or confirmation.
- Treat `case_id` as optional. Missing, empty, and whitespace-only values navigate without params; preserve a nonblank supplied value unchanged.
- Same-origin HTTP(S) stays in the WebView; external HTTP(S), `tel:`, and `mailto:` open through `Linking`; malformed and unsupported schemes are blocked.
- Disable the WebView document cache without using incognito mode. Retain `mixedContentMode="compatibility"` and `thirdPartyCookiesEnabled={true}` as intentional current settings and document them as production-hardening concerns; behavior changes require a separate tested design.
- Never log URLs, user identity, tokens, raw bridge data, or `case_id`.
- Use `git mv` for the existing service rename and `git rm` for obsolete tracked artifacts.
- Preserve historical `.planning/phases/01-migration` records; update maintained planning and instruction documents only.
- Preserve unrelated work and use the Conventional Commit messages shown below.

---

### Task 1: Configure the Expo-compatible test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Create: `__tests__/test-setup-test.ts`

**Interfaces:**
- Produces: `npm test`, `npm run test:watch`, and `npm run typecheck` scripts.
- Produces: Jest's global types for files under `__tests__/`; tests remain outside `app/` so Expo Router never treats them as routes.

- [ ] **Step 1: Prove the current harness is absent**

Run:

```bash
cd /home/alp/alp-dev/nestle-waters-tr-go/CAICore/chat-test
npm test -- --runInBand
```

Expected: command fails with `Missing script: "test"`.

- [ ] **Step 2: Install SDK-53/Jest-29-compatible test dependencies**

Run:

```bash
npm ci
npx expo install \
  jest-expo@~53.0.9 \
  jest@29.7.0 \
  @types/jest@29.5.14 \
  @testing-library/react-native@13.3.3 \
  --dev
```

Expected: `package.json` and `package-lock.json` add only the four test dependencies plus their transitive lock entries. Do not add deprecated `@testing-library/jest-native`.

- [ ] **Step 3: Add scripts, Jest configuration, and types**

Merge into `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit"
  },
  "jest": {
    "preset": "jest-expo",
    "clearMocks": true
  }
}
```

Keep every existing script. Add `"types": ["jest"]` to `compilerOptions` in `tsconfig.json` without changing strict mode or path aliases.

- [ ] **Step 4: Add and run the setup sentinel**

Create `__tests__/test-setup-test.ts`:

```ts
describe('test harness', () => {
  it('runs with the Expo Jest preset', () => {
    expect(2 + 2).toBe(4);
  });
});
```

Run:

```bash
npm test -- --runInBand __tests__/test-setup-test.ts
npm run typecheck
```

Expected: one Jest test passes and TypeScript exits 0.

- [ ] **Step 5: Commit the harness**

```bash
git add package.json package-lock.json tsconfig.json __tests__/test-setup-test.ts
git commit -m "test(chat-test): configure expo jest"
```

---

### Task 2: Inject only the global frontend bootstrap context

**Files:**
- Create: `services/webViewBootstrap.ts`
- Create: `__tests__/web-view-bootstrap-test.ts`
- Modify: `components/ChatWebView.tsx`
- Modify: `env.sample`

**Interfaces:**
- Produces: `buildWebViewBootstrap(config: WebViewBootstrapConfig): string`.
- Consumes environment names: `EXPO_PUBLIC_CAI_FRONTEND_URL`, optional `EXPO_PUBLIC_CAI_API_BASE_URL`, `EXPO_PUBLIC_CAI_USER_ID`, `EXPO_PUBLIC_CAI_USER_NAME`, `EXPO_PUBLIC_CAI_LANGUAGE`, `EXPO_PUBLIC_CAI_COUNTRY`.
- Produces no auth/token-named global or environment field. Allowed public string values remain the caller's responsibility.

- [ ] **Step 1: Write the failing bootstrap tests**

Create `__tests__/web-view-bootstrap-test.ts`:

```ts
import { buildWebViewBootstrap } from '../services/webViewBootstrap';

describe('buildWebViewBootstrap', () => {
  it('injects the API URL and all supported context fields', () => {
    const script = buildWebViewBootstrap({
      apiBaseUrl: 'https://api.example.test/',
      context: {
        userId: 'user-1',
        userName: 'Test User',
        language: 'tr-TR',
        country: 'TR',
      },
    });
    expect(script).toContain('window.__CAI_API_BASE_URL__ = "https://api.example.test/";');
    expect(script).toContain(
      'window.__CHAT_BACKEND_CONTEXT__ = {"userId":"user-1","userName":"Test User","language":"tr-TR","country":"TR"};',
    );
    expect(script.trimEnd().endsWith('true;')).toBe(true);
  });

  it('omits the API assignment when no API URL is configured', () => {
    const script = buildWebViewBootstrap({ context: { language: 'tr-TR' } });
    expect(script).not.toContain('__CAI_API_BASE_URL__');
  });

  it('JSON-escapes allowed values and never emits an auth global', () => {
    const script = buildWebViewBootstrap({
      context: { userName: 'A \"quoted\" user' },
    });
    expect(script).toContain('A \\\"quoted\\\" user');
    expect(script).not.toContain('__CHAT_BACKEND_AUTH__');
  });
});
```

This assertion protects the supported property/global names. It must not claim to detect sensitive content placed inside an allowed string field.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --runInBand __tests__/web-view-bootstrap-test.ts
```

Expected: Jest fails with `Cannot find module '../services/webViewBootstrap'`.

- [ ] **Step 3: Implement the bootstrap builder**

Create `services/webViewBootstrap.ts`:

```ts
export interface ChatBackendContext {
  userId?: string;
  userName?: string;
  language?: string;
  country?: string;
}

export interface WebViewBootstrapConfig {
  apiBaseUrl?: string;
  context: ChatBackendContext;
}

export function buildWebViewBootstrap({
  apiBaseUrl,
  context,
}: WebViewBootstrapConfig): string {
  const normalizedApiBaseUrl = apiBaseUrl?.trim();
  const apiAssignment = normalizedApiBaseUrl
    ? `window.__CAI_API_BASE_URL__ = ${JSON.stringify(normalizedApiBaseUrl)};\n`
    : '';
  return `${apiAssignment}window.__CHAT_BACKEND_CONTEXT__ = ${JSON.stringify(context)};
true;`;
}
```

- [ ] **Step 4: Replace Waters/auth environment reads in `ChatWebView`**

Build the injected script with:

```ts
const frontendUrl = process.env.EXPO_PUBLIC_CAI_FRONTEND_URL?.trim() ?? '';
const injectedJavaScriptBeforeContentLoaded = buildWebViewBootstrap({
  apiBaseUrl: process.env.EXPO_PUBLIC_CAI_API_BASE_URL,
  context: {
    userId: process.env.EXPO_PUBLIC_CAI_USER_ID || undefined,
    userName: process.env.EXPO_PUBLIC_CAI_USER_NAME || undefined,
    language: process.env.EXPO_PUBLIC_CAI_LANGUAGE || undefined,
    country: process.env.EXPO_PUBLIC_CAI_COUNTRY || undefined,
  },
});
```

Use `source={{ uri: frontendUrl }}`. Remove `EXPO_PUBLIC_WATERS_ACCESS_TOKEN`, every `EXPO_PUBLIC_WATERS_*` read, and the complete `window.__CHAT_BACKEND_AUTH__` assignment.

Replace `env.sample` with:

```dotenv
# Global CAICore WebFrontend host
EXPO_PUBLIC_CAI_FRONTEND_URL=http://localhost:5174
# Optional; leave blank to use the frontend's same-origin /v1 proxy
EXPO_PUBLIC_CAI_API_BASE_URL=
EXPO_PUBLIC_CAI_USER_ID=test-user
EXPO_PUBLIC_CAI_USER_NAME=Test User
EXPO_PUBLIC_CAI_LANGUAGE=tr-TR
EXPO_PUBLIC_CAI_COUNTRY=TR
```

- [ ] **Step 5: Verify bootstrap and secret removal**

Run:

```bash
npm test -- --runInBand __tests__/web-view-bootstrap-test.ts
npm run typecheck
rg -n '__CHAT_BACKEND_AUTH__|EXPO_PUBLIC_.*ACCESS_TOKEN|EXPO_PUBLIC_WATERS' \
  components services env.sample
```

Expected: tests/typecheck pass and `rg` produces no matches.

- [ ] **Step 6: Commit frontend bootstrap**

```bash
git add services/webViewBootstrap.ts __tests__/web-view-bootstrap-test.ts \
  components/ChatWebView.tsx env.sample
git commit -m "feat(chat-test): inject caicore frontend context"
```

---

### Task 3: Enforce the WebView URL and cache policy

**Files:**
- Create: `services/webViewUrlPolicy.ts`
- Create: `__tests__/web-view-url-policy-test.ts`
- Create: `__tests__/chat-web-view-test.tsx`
- Modify: `components/ChatWebView.tsx`

**Interfaces:**
- Produces: `classifyWebViewUrl(requestUrl: string, frontendUrl: string): 'allow' | 'open-external' | 'block'`.
- Consumes: only absolute URLs; `new URL()` supplies origin normalization.

- [ ] **Step 1: Write the failing URL-policy tests**

Create `__tests__/web-view-url-policy-test.ts`:

```ts
import { classifyWebViewUrl } from '../services/webViewUrlPolicy';

describe('classifyWebViewUrl', () => {
  const frontend = 'https://Chat.Example.test:443/app';

  it.each([
    'https://chat.example.test/next',
    'https://CHAT.EXAMPLE.TEST:443/assets/app.js',
  ])('allows same-origin HTTP(S): %s', (url) => {
    expect(classifyWebViewUrl(url, frontend)).toBe('allow');
  });

  it.each([
    'https://support.example.test/help',
    'http://chat.example.test/insecure',
    'tel:+902120000000',
    'mailto:support@example.test',
  ])('opens supported external URL: %s', (url) => {
    expect(classifyWebViewUrl(url, frontend)).toBe('open-external');
  });

  it.each(['', 'not a url', 'about:blank', 'data:text/plain,x', 'blob:https://chat.example.test/id', 'custom:value'])
  ('blocks malformed or unsupported URL: %s', (url) => {
    expect(classifyWebViewUrl(url, frontend)).toBe('block');
  });

  it('blocks when the configured frontend URL is invalid', () => {
    expect(classifyWebViewUrl('https://chat.example.test', 'invalid')).toBe('block');
  });
});
```

- [ ] **Step 2: Run the policy test and verify RED**

Run:

```bash
npm test -- --runInBand __tests__/web-view-url-policy-test.ts
```

Expected: Jest fails with `Cannot find module '../services/webViewUrlPolicy'`.

- [ ] **Step 3: Implement the pure URL classifier**

Create `services/webViewUrlPolicy.ts`:

```ts
export type WebViewUrlDecision = 'allow' | 'open-external' | 'block';

export function classifyWebViewUrl(
  requestUrl: string,
  frontendUrl: string,
): WebViewUrlDecision {
  try {
    const frontend = new URL(frontendUrl);
    const requested = new URL(requestUrl);
    if (!['http:', 'https:'].includes(frontend.protocol)) return 'block';
    if (['http:', 'https:'].includes(requested.protocol)) {
      return requested.origin === frontend.origin ? 'allow' : 'open-external';
    }
    if (requested.protocol === 'tel:' || requested.protocol === 'mailto:') {
      return 'open-external';
    }
    return 'block';
  } catch {
    return 'block';
  }
}
```

- [ ] **Step 4: Wire the classifier and disable WebView cache**

Replace the hostname string-splitting guard with:

```ts
const handleShouldStartLoadWithRequest = (request: { url?: string }) => {
  const url = request.url ?? '';
  const decision = classifyWebViewUrl(url, frontendUrl);
  if (decision === 'allow') return true;
  if (decision === 'open-external') {
    void Linking.openURL(url).catch(() => {
      console.warn('External URL could not be opened');
    });
  }
  return false;
};
```

Add `cacheEnabled={false}` and `cacheMode="LOAD_NO_CACHE"` to `WebView`. Do not add `incognito`, and remove URL-bearing log messages.

Retain the existing `mixedContentMode="compatibility"` and `thirdPartyCookiesEnabled={true}` props in this implementation. Record them as production-hardening concerns; do not change them in this task without a separate device-tested design.

Replace the current native-event logging handlers with fixed messages that cannot expose request URLs:

```tsx
onError={() => console.warn('WebView load failed')}
onHttpError={() => console.warn('WebView HTTP request failed')}
```

Do not log `syntheticEvent.nativeEvent`; retain the existing fixed load-start/load-end messages only if they contain no URL or identity data.

- [ ] **Step 5: Test the component wiring and cache flags**

Create `__tests__/chat-web-view-test.tsx`:

```ts
import React from 'react';
import { Linking, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { ChatWebView } from '../components/ChatWebView';

jest.mock('react-native-webview', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <View testID="webview" {...props} />,
}));

describe('ChatWebView', () => {
  const originalFrontendUrl = process.env.EXPO_PUBLIC_CAI_FRONTEND_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = originalFrontendUrl;
    jest.restoreAllMocks();
  });

  it('loads the frontend, disables cache, and applies URL decisions', async () => {
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByTestId } = render(<ChatWebView />);
    const webView = getByTestId('webview');

    expect(webView.props.source).toEqual({ uri: 'https://chat.example.test' });
    expect(webView.props.cacheEnabled).toBe(false);
    expect(webView.props.cacheMode).toBe('LOAD_NO_CACHE');
    expect(webView.props.incognito).toBeUndefined();
    expect(
      webView.props.onShouldStartLoadWithRequest({ url: 'https://chat.example.test/next' }),
    ).toBe(true);
    expect(
      webView.props.onShouldStartLoadWithRequest({ url: 'https://external.example/help' }),
    ).toBe(false);
    expect(openUrl).toHaveBeenCalledWith('https://external.example/help');
    expect(
      webView.props.onShouldStartLoadWithRequest({ url: 'data:text/plain,x' }),
    ).toBe(false);
    expect(openUrl).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: Verify the URL policy**

Run:

```bash
npm test -- --runInBand \
  __tests__/web-view-url-policy-test.ts \
  __tests__/chat-web-view-test.tsx
npm run typecheck
npm run lint
```

Expected: policy tests pass; typecheck and lint exit 0.

- [ ] **Step 7: Commit the URL policy**

```bash
git add services/webViewUrlPolicy.ts __tests__/web-view-url-policy-test.ts \
  __tests__/chat-web-view-test.tsx \
  components/ChatWebView.tsx
git commit -m "feat(chat-test): enforce webview url policy"
```

---

### Task 4: Parse lowercase actions and redirect immediately to MainPage

**Files:**
- Rename: `services/WebViewMessageHandler.ts` -> `services/navigationAction.ts`
- Modify: `types/webview.ts`
- Modify: `components/ChatWebView.tsx`
- Modify: `app/(tabs)/chat.tsx`
- Modify: `app/_layout.tsx`
- Create: `app/main-page.tsx`
- Create: `__tests__/navigation-action-test.ts`
- Create: `__tests__/chat-screen-test.tsx`
- Create: `__tests__/main-page-test.tsx`
- Delete: `components/ConfirmationModal.tsx`
- Delete: `examples/ChatWebViewExample.tsx`
- Delete: `examples/DirectNavigationExample.tsx`

**Interfaces:**
- Produces: `parseNavigationRequest(raw: string): MainPageNavigationRequest | null`.
- Produces: exact allowlist `GotoPage/MainPage -> { pathname: '/main-page', params?: { case_id } }`.
- Changes: `ChatWebViewProps.onNavigationRequest?: (request: MainPageNavigationRequest) => void`.

- [ ] **Step 1: Write the failing parser tests**

Create `__tests__/navigation-action-test.ts`:

```ts
import { parseNavigationRequest } from '../services/navigationAction';

const valid = {
  output_type: 'navigation',
  process: 'GotoPage',
  data: { page_name: 'MainPage' },
};

describe('parseNavigationRequest', () => {
  it('maps the exact lowercase action immediately to /main-page', () => {
    expect(parseNavigationRequest(JSON.stringify(valid))).toEqual({ pathname: '/main-page' });
  });

  it('preserves an optional nonblank case_id', () => {
    expect(
      parseNavigationRequest(JSON.stringify({
        ...valid,
        data: { ...valid.data, case_id: '6f9619ff-8b86-d011-b42d-00c04fc964ff' },
      })),
    ).toEqual({
      pathname: '/main-page',
      params: { case_id: '6f9619ff-8b86-d011-b42d-00c04fc964ff' },
    });
  });

  it.each(['', ' \t\n '])('omits a blank case_id while preserving navigation', (caseId) => {
    expect(
      parseNavigationRequest(JSON.stringify({
        ...valid,
        data: { ...valid.data, case_id: caseId },
      })),
    ).toEqual({ pathname: '/main-page' });
  });

  it.each([
    '',
    '{',
    JSON.stringify(null),
    JSON.stringify({ Process: 'GotoPage', Data: { PageName: 'MainPage', CaseId: 'legacy' } }),
    JSON.stringify({ ...valid, output_type: 'text' }),
    JSON.stringify({ ...valid, process: 'OpenPage' }),
    JSON.stringify({ ...valid, data: { page_name: 'OtherPage' } }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', case_id: 42 } }),
    JSON.stringify({ ...valid, extra: true }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', extra: true } }),
  ])('rejects malformed, unknown, extra, or legacy input', (raw) => {
    expect(parseNavigationRequest(raw)).toBeNull();
  });
});
```

- [ ] **Step 2: Write failing immediate-screen tests**

Create `__tests__/chat-screen-test.tsx`:

```ts
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ChatScreen from '../app/(tabs)/chat';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../components/ChatWebView', () => {
  const ReactModule = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    ChatWebView: ({ onNavigationRequest }: {
      onNavigationRequest?: (request: {
        pathname: '/main-page';
        params: { case_id: string };
      }) => void;
    }) => ReactModule.createElement(
      Pressable,
      {
        testID: 'emit-navigation',
        onPress: () => {
          const request = { pathname: '/main-page', params: { case_id: 'incident-1' } } as const;
          onNavigationRequest?.(request);
          onNavigationRequest?.(request);
        },
      },
      ReactModule.createElement(Text, null, 'Emit'),
    ),
  };
});

describe('ChatScreen', () => {
  it('replaces the route immediately and suppresses duplicate callbacks', () => {
    const { getByTestId, queryByText } = render(<ChatScreen />);
    fireEvent.press(getByTestId('emit-navigation'));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/main-page',
      params: { case_id: 'incident-1' },
    });
    expect(queryByText('Navigate')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });
});
```

Create `__tests__/main-page-test.tsx`:

```ts
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import MainPageScreen from '../app/main-page';

const mockReplace = jest.fn();
let mockParams: { case_id?: string } = { case_id: 'incident-1' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

describe('MainPageScreen', () => {
  beforeEach(() => {
    mockParams = { case_id: 'incident-1' };
  });

  it('shows the incident id and returns to chat', () => {
    const { getByText } = render(<MainPageScreen />);
    expect(getByText('MainPage')).toBeTruthy();
    expect(getByText('incident-1')).toBeTruthy();
    fireEvent.press(getByText('Back to chat'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/chat');
  });

  it('shows the explicit empty state when case_id is omitted', () => {
    mockParams = {};
    const { getByText } = render(<MainPageScreen />);
    expect(getByText('Not provided')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm test -- --runInBand \
  __tests__/navigation-action-test.ts \
  __tests__/chat-screen-test.tsx \
  __tests__/main-page-test.tsx
```

Expected: the parser module and MainPage route do not exist, and the current confirmation flow calls `router.replace` zero times.

- [ ] **Step 4: Rename the service and replace it with the strict parser**

Run:

```bash
git mv services/WebViewMessageHandler.ts services/navigationAction.ts
```

Replace `types/webview.ts` completely with:

```ts
import type { StyleProp, ViewStyle } from 'react-native';

export interface NavigationAction {
  output_type: 'navigation';
  process: 'GotoPage';
  data: {
    page_name: 'MainPage';
    case_id?: string;
  };
}

export type MainPageNavigationRequest = {
  pathname: '/main-page';
  params?: {
    case_id: string;
  };
};

export interface ChatWebViewProps {
  onNavigationRequest?: (request: MainPageNavigationRequest) => void;
  style?: StyleProp<ViewStyle>;
}
```

The replacement deliberately removes `WebViewMessage`, `GotoPageMessage`, the generic `onMessage` callback, `any` payloads, and every PascalCase field.

Replace `services/navigationAction.ts` with a plain-object/exact-key parser. Define the route map and return value as:

```ts
import type { MainPageNavigationRequest } from '../types/webview';

const ROUTE_MAP = { GotoPage: { MainPage: '/main-page' } } as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const hasExactKeys = (value: Record<string, unknown>, allowed: string[]) => {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
};

export function parseNavigationRequest(raw: string): MainPageNavigationRequest | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || !hasExactKeys(value, ['output_type', 'process', 'data'])) return null;
    if (value.output_type !== 'navigation' || value.process !== 'GotoPage' || !isRecord(value.data)) return null;
    const dataKeys = 'case_id' in value.data ? ['page_name', 'case_id'] : ['page_name'];
    if (!hasExactKeys(value.data, dataKeys) || value.data.page_name !== 'MainPage') return null;
    if ('case_id' in value.data && typeof value.data.case_id !== 'string') return null;
    const pathname = ROUTE_MAP.GotoPage.MainPage;
    return typeof value.data.case_id === 'string' && value.data.case_id.trim()
      ? { pathname, params: { case_id: value.data.case_id } }
      : { pathname };
  } catch {
    return null;
  }
}
```

Keep `NavigationAction` as the exact literal interface in `types/webview.ts`, along with `MainPageNavigationRequest` and the typed `StyleProp<ViewStyle>` prop contract from this task.

- [ ] **Step 5: Wire raw WebView messages to immediate Expo Router replacement**

In `ChatWebView.handleWebViewMessage`, call `parseNavigationRequest(event.nativeEvent.data)` and invoke `onNavigationRequest` only for a non-null result. Do not log raw data or route parameters.

Replace `chat.tsx` modal state with:

```ts
const router = useRouter();
const navigationInFlight = useRef(false);
const handleNavigationRequest = useCallback((request: MainPageNavigationRequest) => {
  if (navigationInFlight.current) return;
  navigationInFlight.current = true;
  try {
    router.replace(request);
  } catch {
    navigationInFlight.current = false;
    console.warn('Native navigation failed');
  }
}, [router]);
```

Render only the `ChatWebView` in the safe-area container. Delete all confirmation state/callbacks/imports.

- [ ] **Step 6: Create and register the MainPage route**

Create `app/main-page.tsx`:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function MainPageScreen() {
  const router = useRouter();
  const { case_id } = useLocalSearchParams<{ case_id?: string | string[] }>();
  const incidentId = Array.isArray(case_id) ? case_id[0] : case_id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>MainPage</Text>
        <Text style={styles.label}>Incident ID</Text>
        <Text selectable style={styles.value}>{incidentId || 'Not provided'}</Text>
        <Button title="Back to chat" onPress={() => router.replace('/(tabs)/chat')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { gap: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  label: { fontSize: 16, fontWeight: '600' },
  value: { fontSize: 16 },
});
```

Register it in `app/_layout.tsx`:

```tsx
<Stack.Screen name="main-page" options={{ title: 'MainPage' }} />
```

- [ ] **Step 7: Remove obsolete confirmation and examples**

Run:

```bash
git rm components/ConfirmationModal.tsx
git rm examples/ChatWebViewExample.tsx
git rm examples/DirectNavigationExample.tsx
```

No executable import may refer to the removed class, modal, examples, or PascalCase types.

- [ ] **Step 8: Run navigation, screen, type, and lint checks**

Run:

```bash
npm test -- --runInBand \
  __tests__/navigation-action-test.ts \
  __tests__/chat-screen-test.tsx \
  __tests__/main-page-test.tsx
npm run typecheck
npm run lint
```

Expected: all tests pass, the valid action replaces once immediately, and TypeScript/lint exit 0.

- [ ] **Step 9: Commit native routing as one coherent unit**

```bash
git add services/navigationAction.ts types/webview.ts components/ChatWebView.tsx \
  app/'(tabs)'/chat.tsx app/_layout.tsx app/main-page.tsx \
  __tests__/navigation-action-test.ts __tests__/chat-screen-test.tsx \
  __tests__/main-page-test.tsx
git commit -m "feat(chat-test): route native actions to main page"
```

The staged rename/deletions are included automatically; review `git status --short` before committing.

---

### Task 5: Refresh maintained documentation and verify the complete host

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `.planning/PROJECT.md`
- Modify: `.planning/REQUIREMENTS.md`
- Modify: `.planning/ROADMAP.md`
- Modify: `.planning/STATE.md`
- Modify: `.planning/codebase/ARCHITECTURE.md`
- Modify: `.planning/codebase/CONCERNS.md`
- Modify: `.planning/codebase/CONVENTIONS.md`
- Modify: `.planning/codebase/INTEGRATIONS.md`
- Modify: `.planning/codebase/STACK.md`
- Modify: `.planning/codebase/STRUCTURE.md`
- Modify: `.planning/codebase/TESTING.md`

**Interfaces:**
- Documents: six environment fields, direct Vite loading, REST/SSE ownership, conditional AuthProvider token ownership, exact lowercase action, immediate route, URL/cache policy, tests, Docker, and the pending device smoke.
- Preserves: `.planning/phases/01-migration/**` as dated historical records rather than active instructions.

- [ ] **Step 1: Rewrite the README as executable setup documentation**

Document these commands and facts exactly:

```bash
cp env.sample .env
npm ci
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo start --clear
```

Explain that `env.sample` uses frontend port 5174 and a blank optional API base so Vite's same-origin `/v1` proxy is the default after `cp env.sample .env`. Emulator/device URLs must resolve back to the development host (for example Android emulator `10.0.2.2`, not device-local `localhost`). State that the WebView loads the global Vite frontend; that frontend owns conversations REST/SSE; the current Erikli channel has `auth.enabled: false`; the native app injects no token; and the bridge contract is:

```json
{
  "output_type": "navigation",
  "process": "GotoPage",
  "data": {
    "page_name": "MainPage",
    "case_id": "optional CRM incident id"
  }
}
```

Document immediate `/main-page` replacement, optional incident display, back-to-chat behavior, same/external URL policy, and disabled cache.

- [ ] **Step 2: Replace active Chatwoot/PascalCase guidance**

Rewrite `CLAUDE.md` and the maintained `.planning` documents so they describe the implemented files and lowercase protocol. The current roadmap/state should mark context injection, URL policy, immediate route, and automated tests complete after implementation. Remove active claims that:

- Chatwoot or Waters Bot credentials are required;
- `window.__CHAT_BACKEND_AUTH__` is supported;
- bridge fields are PascalCase;
- a confirmation modal or `WebViewMessageHandler` owns navigation;
- WebFrontend/backend changes are out of scope;
- there is no test runner.

Do not rewrite the archived `.planning/phases/01-migration/**` files; their dates and old outcomes are historical evidence.

Document that AuthProvider remains the only token owner if auth is later enabled, while auth-enabled Expo hosting is currently unsupported until a tested system-browser/deep-link callback preserves the WebView auth-result/session context. Also record the required companion global revision, rollout order, retained mixed-content/cookie props, caller responsibility for allowed context values, and the incomplete live-device status.

- [ ] **Step 3: Run active-document and executable cleanup scans**

Run:

```bash
rg -n '__CHAT_BACKEND_AUTH__|EXPO_PUBLIC_.*ACCESS_TOKEN|\bProcess\b|PageName|CaseId|ConfirmationModal|WebViewMessageHandler' \
  app components services types env.sample README.md CLAUDE.md \
  .planning/codebase .planning/{PROJECT,REQUIREMENTS,ROADMAP,STATE}.md
rg -n 'Chatwoot|CHATWOOT' \
  app components services types env.sample README.md CLAUDE.md \
  .planning/codebase .planning/{PROJECT,REQUIREMENTS,ROADMAP,STATE}.md
```

Expected: both scans produce no matches. Archived phase records are deliberately excluded.

- [ ] **Step 4: Run complete automated verification and an Android export**

Run:

```bash
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo config --type public >/dev/null

chat_test_export_dir=$(mktemp -d .expo-export.XXXXXX)
npx expo export --platform android --output-dir "$chat_test_export_dir"
mv "$chat_test_export_dir" /tmp/
git diff --check
```

Expected: Jest passes, TypeScript and lint exit 0, Expo public config parses, Android export completes in the project-local temporary directory before that artifact is moved outside the worktree, and `git diff --check` is silent.

- [ ] **Step 5: Run the Docker/device smoke matrix**

Status at final branch review: not completed because the required live environment was unavailable. Keep this step pending even after automated verification succeeds.

Use a global checkout/deployment of `feat/native-client-actions` at `4bb5772` or a merged descendant. Run `git merge-base --is-ancestor 4bb5772 HEAD` in that checkout, then start its Docker Compose stack and Vite frontend. Deploy or check out the global producer/dispatcher revision before this native host. Configure a device-reachable `EXPO_PUBLIC_CAI_FRONTEND_URL` on port 5174, leave `EXPO_PUBLIC_CAI_API_BASE_URL` blank for the same-origin proxy, and run `npx expo start --clear` in this repository.

Verify on a device/emulator:

1. the current Erikli `auth.enabled: false` frontend loads directly without login;
2. conversation REST and SSE work without login;
3. a lowercase action without `case_id` opens `/main-page` immediately and shows `Not provided`;
4. a new action with a CRM incident ID opens `/main-page` and displays that exact ID;
5. repeated delivery before unmount does not stack or replace twice;
6. `Back to chat` returns to the chat tab;
7. same-origin links stay in the WebView, external HTTP(S)/telephone/email links open externally, and unsupported schemes remain blocked;
8. re-entering chat/restoring history does not redirect from an old message.

Do not add an AuthProvider login requirement to this smoke. Auth-enabled Expo hosting needs a separate design and test for the system-browser/deep-link callback and WebView session handoff.

- [ ] **Step 6: Commit maintained documentation**

```bash
git add README.md CLAUDE.md .planning/PROJECT.md .planning/REQUIREMENTS.md \
  .planning/ROADMAP.md .planning/STATE.md .planning/codebase
git commit -m "docs(chat-test): align cross-repo smoke contract"
```

- [ ] **Step 7: Review the final repository state**

Run:

```bash
git status --short --branch
git log --oneline -6
```

Expected: the worktree is clean, package/app version remains `1.0.0` because this repository has no changelog or release-version workflow, and the planned implementation plus review-reconciliation commits are present.
