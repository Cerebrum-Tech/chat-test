import React from 'react';
import { Linking, View as MockView } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { ChatWebView } from '../components/ChatWebView';
import type { AuthSession } from '../types/auth';

const SESSION: AuthSession = {
  token: 'ceremeet-jwt-value',
  email: 'customer-guid@nestlewatersapp.com',
  consumerId: 'customer-guid',
  label: 'Sample user 1',
};

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
    const { getByTestId } = render(<ChatWebView session={SESSION} />);
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

  it('dials the bare number when the platform refuses the post-dial suffix', async () => {
    // The customer-service chip. iOS rejects `tel:` numbers containing a pause character,
    // which used to leave the button doing nothing whatsoever.
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    const openUrl = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error('Unable to open URL'))
      .mockResolvedValue(true);
    const { getByTestId } = render(<ChatWebView session={SESSION} />);

    expect(
      getByTestId('webview').props.onShouldStartLoadWithRequest({ url: 'tel:4440222,1' }),
    ).toBe(false);

    await waitFor(() => expect(openUrl).toHaveBeenCalledTimes(2));
    expect(openUrl).toHaveBeenNthCalledWith(1, 'tel:4440222,1');
    expect(openUrl).toHaveBeenNthCalledWith(2, 'tel:4440222');
  });

  it('retries when the platform resolves false instead of rejecting', async () => {
    // iOS reports a declined open by resolving FALSE. Only catching rejections is why the
    // Simulator's refusal was invisible.
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    const openUrl = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValueOnce(false as unknown as void)
      .mockResolvedValue(true);
    const { getByTestId } = render(<ChatWebView session={SESSION} />);

    getByTestId('webview').props.onShouldStartLoadWithRequest({ url: 'tel:4440222,1' });

    await waitFor(() => expect(openUrl).toHaveBeenCalledTimes(2));
    expect(openUrl).toHaveBeenNthCalledWith(2, 'tel:4440222');
  });

  it('stops at the first candidate the platform accepts', async () => {
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByTestId } = render(<ChatWebView session={SESSION} />);

    getByTestId('webview').props.onShouldStartLoadWithRequest({ url: 'tel:4440222,1' });

    await waitFor(() => expect(openUrl).toHaveBeenCalledWith('tel:4440222,1'));
    expect(openUrl).toHaveBeenCalledTimes(1);
  });

  it('warns once when no candidate could be opened', async () => {
    // The Simulator has no Phone app, so both attempts fail. The warning is the only
    // signal a tester gets, and before this it never fired.
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    jest.spyOn(Linking, 'openURL').mockResolvedValue(false as unknown as void);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByTestId } = render(<ChatWebView session={SESSION} />);

    getByTestId('webview').props.onShouldStartLoadWithRequest({ url: 'tel:4440222,1' });

    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(warn).toHaveBeenCalledWith('External URL could not be opened');
  });

  it('emits navigation only for a strict lowercase bridge message', () => {
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    const onNavigationRequest = jest.fn();
    const { getByTestId } = render(
      <ChatWebView session={SESSION} onNavigationRequest={onNavigationRequest} />,
    );
    const webView = getByTestId('webview');

    webView.props.onMessage({
      nativeEvent: {
        data: JSON.stringify({
          output_type: 'navigation',
          process: 'GotoPage',
          data: { page_name: 'MainPage', case_id: 'incident-1' },
        }),
      },
    });
    webView.props.onMessage({
      nativeEvent: {
        data: JSON.stringify({
          Process: 'GotoPage',
          Data: { PageName: 'MainPage', CaseId: 'legacy' },
        }),
      },
    });
    webView.props.onMessage({ nativeEvent: { data: '{' } });

    expect(onNavigationRequest).toHaveBeenCalledTimes(1);
    expect(onNavigationRequest).toHaveBeenCalledWith({
      pathname: '/main-page',
      params: { case_id: 'incident-1' },
    });
  });

  it('injects the session token and derived identity before content loads', () => {
    process.env.EXPO_PUBLIC_CAI_FRONTEND_URL = 'https://chat.example.test';
    const { getByTestId } = render(<ChatWebView session={SESSION} />);
    const bootstrap = getByTestId('webview').props.injectedJavaScriptBeforeContentLoaded;

    expect(bootstrap).toContain('"token":"ceremeet-jwt-value"');
    expect(bootstrap).toContain('"userId":"customer-guid"');
    // The bearer must arrive before the widget bundle reads it, hence the *Before* hook.
    expect(getByTestId('webview').props.injectedJavaScript).toBeUndefined();
  });
});
