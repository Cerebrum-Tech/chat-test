import type { MainPageNavigationRequest } from '../types/webview';

const ROUTE_MAP = { GotoPage: { MainPage: '/main-page' } } as const;

// The ids the widget may attach beside page_name, each independently optional.
// `case_id` is the CRM incident the conversation opened; `address_id` is the consumer
// address the main page should open on. Both are routing data, never displayed copy.
//
// Optional means optional: an envelope carrying neither still navigates, because losing
// the redirect is a worse failure than landing on the app's default view. Any key OUTSIDE
// this list is still fatal — the exact-keys check is what stops an unknown or tampered
// payload from driving navigation.
const OPTIONAL_DATA_KEYS = ['case_id', 'address_id'] as const;

type OptionalDataKey = (typeof OPTIONAL_DATA_KEYS)[number];

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
    const data = value.data;
    if (value.output_type !== 'navigation' || value.process !== 'GotoPage' || !isRecord(data)) return null;
    const present = OPTIONAL_DATA_KEYS.filter((key) => key in data);
    if (!hasExactKeys(data, ['page_name', ...present]) || data.page_name !== 'MainPage') return null;
    if (present.some((key) => typeof data[key] !== 'string')) return null;

    // A blank id is dropped rather than rejected: navigation must still happen, and a
    // whitespace-only route param would read as a real value on the receiving screen.
    // A non-blank one is passed through verbatim, untrimmed, exactly as the backend sent it.
    const params: Partial<Record<OptionalDataKey, string>> = {};
    for (const key of present) {
      const id = data[key] as string;
      if (id.trim()) params[key] = id;
    }

    const pathname = ROUTE_MAP.GotoPage.MainPage;
    return Object.keys(params).length > 0 ? { pathname, params } : { pathname };
  } catch {
    return null;
  }
}
