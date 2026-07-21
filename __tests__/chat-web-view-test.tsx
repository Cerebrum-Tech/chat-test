import React from 'react';
import { Linking, View as MockView } from 'react-native';
import { render } from '@testing-library/react-native';

import { ChatWebView } from '../components/ChatWebView';

jest.mock('react-native-webview', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <MockView testID="webview" {...props} />,
}));

describe('ChatWebView', () => {
  const originalFrontendUrl = process.env.EXPO_PUBLIC_CAI_FRONTEND_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = originalFrontendUrl;
    jest.restoreAllMocks();
  });

  it('loads the frontend, disables cache, and applies URL decisions', async () => {
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByTestId } = render(<ChatWebView />);
    const webView = getByTestId('webview');

    expect(webView.props.source).toEqual({ uri: 'https://chat.example.test' });
    expect(webView.props.cacheEnabled).toBe(false);
    expect(webView.props.cacheMode).toBe('LOAD_NO_CACHE');
    expect(webView.props.incognito).toBeUndefined();
    expect(
      webView.props.onShouldStartLoadWithRequest({ url: 'https://chat.example.test/next' }),
    ).toBe(true);
    expect(
      webView.props.onShouldStartLoadWithRequest({ url: 'https://external.example/help' }),
    ).toBe(false);
    expect(openUrl).toHaveBeenCalledWith('https://external.example/help');
    expect(
      webView.props.onShouldStartLoadWithRequest({ url: 'data:text/plain,x' }),
    ).toBe(false);
    expect(openUrl).toHaveBeenCalledTimes(1);
  });
});
