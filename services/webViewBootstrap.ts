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
  const normalizedApiBaseUrl = typeof apiBaseUrl === 'string' ? apiBaseUrl.trim() : undefined;
  const normalizedContext: ChatBackendContext = {
    userId: typeof context?.userId === 'string' ? context.userId : undefined,
    userName: typeof context?.userName === 'string' ? context.userName : undefined,
    language: typeof context?.language === 'string' ? context.language : undefined,
    country: typeof context?.country === 'string' ? context.country : undefined,
  };
  const apiAssignment = normalizedApiBaseUrl
    ? `window.__CAI_API_BASE_URL__ = ${JSON.stringify(normalizedApiBaseUrl)};\n`
    : '';
  return `${apiAssignment}window.__CHAT_BACKEND_CONTEXT__ = ${JSON.stringify(normalizedContext)};
true;`;
}
