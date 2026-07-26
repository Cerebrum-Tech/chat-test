export interface ChatBackendContext {
  userId?: string;
  userName?: string;
  language?: string;
  country?: string;
  /**
   * The authenticated user's CereMeet bearer token, per the injection contract in the
   * backend repo's `docs/mobile-app-widget-integration.md`. The web frontend reads it
   * from this global and forwards it as `Authorization: Bearer` on every API call; it
   * deliberately keeps `token` out of the conversation metadata it persists, so the
   * credential never reaches Cosmos.
   */
  token?: string;
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
    token: typeof context?.token === 'string' && context.token.trim() ? context.token : undefined,
  };
  const apiAssignment = normalizedApiBaseUrl
    ? `window.__CAI_API_BASE_URL__ = ${JSON.stringify(normalizedApiBaseUrl)};\n`
    : '';
  return `${apiAssignment}window.__CHAT_BACKEND_CONTEXT__ = ${JSON.stringify(normalizedContext)};
true;`;
}
