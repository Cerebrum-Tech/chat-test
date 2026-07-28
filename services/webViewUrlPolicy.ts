export type WebViewUrlDecision = 'allow' | 'open-external' | 'block';

const normalizeOrigin = (value: string): string | undefined => {
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.origin.toLowerCase() : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Origins the chat may navigate to in addition to the configured frontend.
 *
 * The frontend deployment can forward to another host, and a redirect is a cross-origin
 * navigation: without the target listed here it is classified 'open-external' and leaves
 * for the system browser, taking the user out of the app and away from the injected
 * session. Keep this list to hosts that serve the chat itself — every entry widens the
 * boundary this module exists to hold.
 */
export const parseAdditionalOrigins = (raw?: string): string[] =>
  (raw ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));

export function classifyWebViewUrl(
  requestUrl: string,
  frontendUrl: string,
  additionalOrigins: string[] = [],
): WebViewUrlDecision {
  try {
    const frontend = new URL(frontendUrl);
    const requested = new URL(requestUrl);
    if (!['http:', 'https:'].includes(frontend.protocol)) return 'block';
    if (['http:', 'https:'].includes(requested.protocol)) {
      const allowed = new Set<string>([
        frontend.origin.toLowerCase(),
        ...additionalOrigins,
      ]);
      return allowed.has(requested.origin.toLowerCase()) ? 'allow' : 'open-external';
    }
    if (requested.protocol === 'tel:' || requested.protocol === 'mailto:') {
      return 'open-external';
    }
    return 'block';
  } catch {
    return 'block';
  }
}
