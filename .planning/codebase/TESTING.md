# Testing Patterns

**Analysis Date:** 2026-04-05

## Test Framework

**Runner:**
- Not configured — no test runner is present in the project
- No `jest.config.*`, `vitest.config.*`, or equivalent found
- No test script in `package.json` (`scripts` contains only `start`, `android`, `ios`, `web`, `lint`, `reset-project`)

**Assertion Library:**
- Not applicable — no testing library installed

**Run Commands:**
```bash
# No test commands available
npm run lint    # Only quality check available
```

## Test File Organization

**Location:**
- No test files exist in the codebase
- No `*.test.*` or `*.spec.*` files found anywhere

**Naming:**
- Not applicable

**Structure:**
```
(no test directories or files present)
```

## Test Coverage

**Requirements:** None enforced — no coverage configuration

**Current state:** 0% test coverage across all source files

## What Is Testable (But Untested)

**`services/WebViewMessageHandler.ts`:**
- Pure class with no React dependencies — highest priority for unit testing
- Methods: `handleMessage`, `getMessageHistory`, `clearMessageHistory`, `getMessageStats`
- Switch-based message routing logic is directly testable
- Message log ring-buffer (capped at 100) is testable

**`types/webview.ts`:**
- TypeScript interfaces — tested at compile time only via strict mode

**`components/ChatWebView.tsx`:**
- Renders a WebView with injected HTML — requires React Native testing environment
- `handleShouldStartLoadWithRequest` URL interception logic is unit-testable in isolation

**`components/ConfirmationModal.tsx`:**
- Stateless presentational component — testable with React Native Testing Library

**`hooks/useThemeColor.ts`:**
- Custom hook with conditional logic — testable with `renderHook`

## Recommended Test Setup (Not Yet Implemented)

To add testing to this project, install:

```bash
npx expo install jest-expo @testing-library/react-native @types/jest
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

## Recommended Test Patterns (Based on Codebase Style)

**Service Unit Test Pattern:**
```typescript
// services/__tests__/WebViewMessageHandler.test.ts
import { WebViewMessageHandler } from '../WebViewMessageHandler';

describe('WebViewMessageHandler', () => {
  let handler: WebViewMessageHandler;

  beforeEach(() => {
    handler = new WebViewMessageHandler();
  });

  it('routes GotoPage messages to onGotoPage callback', () => {
    const onGotoPage = jest.fn();
    handler.handleMessage(
      { Process: 'GotoPage', Data: { PageName: 'AddressesScreen', CaseId: 'case-1' } },
      { onGotoPage }
    );
    expect(onGotoPage).toHaveBeenCalledWith('AddressesScreen', 'case-1');
  });
});
```

**Component Test Pattern:**
```typescript
// components/__tests__/ConfirmationModal.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ConfirmationModal } from '../ConfirmationModal';

describe('ConfirmationModal', () => {
  it('calls onConfirm when confirm button pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ConfirmationModal visible onConfirm={onConfirm} onCancel={jest.fn()} title="Test" message="Test" />
    );
    fireEvent.press(getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
```

## Test Types

**Unit Tests:**
- Recommended scope: `services/WebViewMessageHandler.ts`, URL parsing logic in `components/ChatWebView.tsx`
- Not applicable yet

**Integration Tests:**
- Recommended scope: `app/(tabs)/chat.tsx` screen with mocked `WebViewMessageHandler`
- Not applicable yet

**E2E Tests:**
- Framework: Not used, not configured
- Expo supports Detox for E2E but it is not set up

## Gaps and Risks

**Critical untested areas:**

- `services/WebViewMessageHandler.ts` — message routing logic has no coverage; regressions will be silent
- `components/ChatWebView.tsx` — URL interception in `handleShouldStartLoadWithRequest` has branching logic with no coverage
- Navigation flow in `app/(tabs)/chat.tsx` — state transitions (`pendingNavigation`, `showConfirmModal`) unverified

**Risk level:** High — the project has no tests at all. Any refactoring of the message handler or navigation logic carries full regression risk.

---

*Testing analysis: 2026-04-05*
