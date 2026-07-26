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

  it('JSON-escapes values and emits no token when none is supplied', () => {
    const script = buildWebViewBootstrap({
      context: { userName: 'A "quoted" user' },
    });
    expect(script).toContain('A \\"quoted\\" user');
    // The widget owns the credential channel; the host supplies the token inside the
    // context global and never as a separate auth object.
    expect(script).not.toContain('__CHAT_BACKEND_AUTH__');
    expect(script.toLowerCase()).not.toContain('token');
  });

  it('carries the session token so the widget can forward it as a bearer', () => {
    const script = buildWebViewBootstrap({
      context: { userId: 'customer-guid', token: 'ceremeet-jwt-value' },
    });
    expect(script).toContain(
      'window.__CHAT_BACKEND_CONTEXT__ = {"userId":"customer-guid","token":"ceremeet-jwt-value"};',
    );
  });

  it('drops a blank or non-string token instead of injecting an empty credential', () => {
    expect(buildWebViewBootstrap({ context: { token: '   ' } })).not.toContain('token');
    const nonString = { token: 42 } as unknown as Parameters<
      typeof buildWebViewBootstrap
    >[0]['context'];
    expect(buildWebViewBootstrap({ context: nonString })).not.toContain('token');
  });

  it('projects only allowlisted string context fields', () => {
    const unsupportedContext = {
      userId: '  user "one"  ',
      userName: 42,
      language: 'tr-TR',
      country: null,
      accessToken: 'secret-access-value',
      storageKey: 'private-storage-value',
      conversation: { token: 'secret-conversation-value' },
    } as unknown as Parameters<typeof buildWebViewBootstrap>[0]['context'];

    const script = buildWebViewBootstrap({ context: unsupportedContext });

    expect(script).toContain(
      'window.__CHAT_BACKEND_CONTEXT__ = {"userId":"  user \\"one\\"  ","language":"tr-TR"};',
    );
    expect(script).not.toContain('userName');
    expect(script).not.toContain('country');
    expect(script).not.toContain('accessToken');
    expect(script).not.toContain('storageKey');
    expect(script).not.toContain('conversation');
    expect(script).not.toContain('secret-');
  });

  it('omits an unsupported runtime API URL value', () => {
    const unsupportedConfig = {
      apiBaseUrl: 42,
      context: {},
    } as unknown as Parameters<typeof buildWebViewBootstrap>[0];

    expect(() => buildWebViewBootstrap(unsupportedConfig)).not.toThrow();
    expect(buildWebViewBootstrap(unsupportedConfig)).not.toContain('__CAI_API_BASE_URL__');
  });
});
