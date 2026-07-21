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
    if ('case_id' in value.data && (typeof value.data.case_id !== 'string' || !value.data.case_id.trim())) return null;
    const pathname = ROUTE_MAP.GotoPage.MainPage;
    return 'case_id' in value.data
      ? { pathname, params: { case_id: value.data.case_id as string } }
      : { pathname };
  } catch {
    return null;
  }
}
