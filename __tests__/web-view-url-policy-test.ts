import { classifyWebViewUrl, parseAdditionalOrigins } from '../services/webViewUrlPolicy';

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

  it.each([
    '',
    'not a url',
    'about:blank',
    'data:text/plain,x',
    'blob:https://chat.example.test/id',
    'custom:value',
  ])('blocks malformed or unsupported URL: %s', (url) => {
    expect(classifyWebViewUrl(url, frontend)).toBe('block');
  });

  it('blocks when the configured frontend URL is invalid', () => {
    expect(classifyWebViewUrl('https://chat.example.test', 'invalid')).toBe('block');
  });
});

describe('redirect targets', () => {
  const FRONTEND = 'https://cai-platform.nestle.test/frontends/waterstr/latest/pp/';
  const TARGET = 'https://waters.example.test';

  it('keeps a configured redirect target inside the WebView', () => {
    // Without this the deployment's redirect leaves for the system browser, taking the
    // user out of the app and away from the injected session.
    expect(
      classifyWebViewUrl(`${TARGET}/`, FRONTEND, parseAdditionalOrigins(TARGET)),
    ).toBe('allow');
  });

  it('still externalises a host that was not configured', () => {
    expect(
      classifyWebViewUrl('https://elsewhere.example/help', FRONTEND, parseAdditionalOrigins(TARGET)),
    ).toBe('open-external');
  });

  it('matches on origin only, so a port or scheme change is not allowed', () => {
    const allowed = parseAdditionalOrigins(TARGET);
    expect(classifyWebViewUrl('http://waters.example.test/', FRONTEND, allowed)).toBe('open-external');
    expect(classifyWebViewUrl('https://waters.example.test:8443/', FRONTEND, allowed)).toBe('open-external');
  });

  it('ignores blank and malformed entries rather than allowing everything', () => {
    expect(parseAdditionalOrigins('')).toEqual([]);
    expect(parseAdditionalOrigins(undefined)).toEqual([]);
    expect(parseAdditionalOrigins('not a url, ,javascript:alert(1)')).toEqual([]);
  });

  it('accepts several targets and drops any path or query supplied with them', () => {
    expect(parseAdditionalOrigins(`${TARGET}/chat?x=1, https://second.example.test`)).toEqual([
      'https://waters.example.test',
      'https://second.example.test',
    ]);
  });

  it('leaves unsafe schemes blocked even when origins are configured', () => {
    const allowed = parseAdditionalOrigins(TARGET);
    expect(classifyWebViewUrl('data:text/html,x', FRONTEND, allowed)).toBe('block');
    expect(classifyWebViewUrl('javascript:alert(1)', FRONTEND, allowed)).toBe('block');
  });
});
