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
      return requested.origin.toLowerCase() === frontend.origin.toLowerCase()
        ? 'allow'
        : 'open-external';
    }
    if (requested.protocol === 'tel:' || requested.protocol === 'mailto:') {
      return 'open-external';
    }
    return 'block';
  } catch {
    return 'block';
  }
}
