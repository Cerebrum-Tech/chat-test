import { classifyWebViewUrl } from '../services/webViewUrlPolicy';

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
