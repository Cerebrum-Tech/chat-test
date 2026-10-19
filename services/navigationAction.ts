import type { NativeNavigationRequest } from '../types/webview';

// Each accepted page_name, the native route it maps to, and the ids the widget may attach
// beside it. `case_id` is the CRM incident the conversation opened; `address_id` is the
// consumer address the destination should open on. Both are routing data, never displayed
// copy. ProfileScreen is what the widget's X button targets, and it carries no incident,
// so a case_id there is as fatal as any other unknown key.
//
// Optional means optional: an envelope carrying none of its page's ids still navigates,
// because losing the redirect is a worse failure than landing on the app's default view.
// Any key OUTSIDE the page's list is still fatal — the exact-keys check is what stops an
// unknown or tampered payload from driving navigation.
const PAGE_ROUTES = {
  MainPage: { pathname: '/main-page', optionalKeys: ['case_id', 'address_id'] },
  ProfileScreen: { pathname: '/profile-screen', optionalKeys: ['address_id'] },
} as const;

type PageName = keyof typeof PAGE_ROUTES;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isPageName = (value: unknown): value is PageName =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(PAGE_ROUTES, value);

const hasExactKeys = (value: Record<string, unknown>, allowed: readonly string[]) => {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
};

export function parseNavigationRequest(raw: string): NativeNavigationRequest | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || !hasExactKeys(value, ['output_type', 'process', 'data'])) return null;
    const data = value.data;
    if (value.output_type !== 'navigation' || value.process !== 'GotoPage' || !isRecord(data)) return null;
    if (!isPageName(data.page_name)) return null;
    const route = PAGE_ROUTES[data.page_name];
    const present = route.optionalKeys.filter((key) => key in data);
    if (!hasExactKeys(data, ['page_name', ...present])) return null;
    if (present.some((key) => typeof data[key] !== 'string')) return null;

    // A blank id is dropped rather than rejected: navigation must still happen, and a
    // whitespace-only route param would read as a real value on the receiving screen.
    // A non-blank one is passed through verbatim, untrimmed, exactly as the backend sent it.
    const params: Record<string, string> = {};
    for (const key of present) {
      const id = data[key] as string;
      if (id.trim()) params[key] = id;
    }

    const { pathname } = route;
    return (Object.keys(params).length > 0 ? { pathname, params } : { pathname }) as NativeNavigationRequest;
  } catch {
    return null;
  }
}
