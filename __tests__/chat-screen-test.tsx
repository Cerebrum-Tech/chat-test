import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import ChatScreen, { NAVIGATION_DELAY_MS } from '../app/(tabs)/chat';
import type { AuthSession } from '../types/auth';

const mockReplace = jest.fn();
const mockSignOut = jest.fn();

let mockSession: AuthSession | null = {
  token: 'ceremeet-jwt-value',
  email: 'customer-guid@nestlewatersapp.com',
  consumerId: 'customer-guid',
  label: 'Sample user 1',
};

jest.mock('expo-router', () => {
  const ReactModule = require('react');
  const { Text } = require('react-native');
  return {
    useRouter: () => ({ replace: mockReplace }),
    Redirect: ({ href }: { href: string }) =>
      ReactModule.createElement(Text, { testID: 'redirect' }, href),
  };
});

jest.mock('../hooks/useAuthSession', () => ({
  useAuthSession: () => ({
    session: mockSession,
    isSigningIn: false,
    signIn: jest.fn(),
    signOut: mockSignOut,
  }),
}));

jest.mock('../components/ChatWebView', () => {
  const ReactModule = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    ChatWebView: ({ onNavigationRequest }: {
      onNavigationRequest?: (request: {
        pathname: '/main-page';
        params: { case_id: string };
      }) => void;
    }) => ReactModule.createElement(
      Pressable,
      {
        testID: 'emit-navigation',
        onPress: () => {
          const request = { pathname: '/main-page', params: { case_id: 'incident-1' } } as const;
          onNavigationRequest?.(request);
          onNavigationRequest?.(request);
        },
      },
      ReactModule.createElement(Text, null, 'Emit'),
    ),
  };
});

describe('ChatScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('leaves the closing message on screen for the delay, then replaces once', () => {
    const { getByTestId, queryByText } = render(<ChatScreen />);
    fireEvent.press(getByTestId('emit-navigation'));

    // The whole point of the wait: the chat is still showing while the timer runs.
    act(() => {
      jest.advanceTimersByTime(NAVIGATION_DELAY_MS - 1);
    });
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    // The duplicate delivered alongside the first must not queue a second redirect.
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/main-page',
      params: { case_id: 'incident-1' },
    });
    expect(queryByText('Navigate')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('drops a pending redirect when the screen unmounts first', () => {
    const { getByTestId, unmount } = render(<ChatScreen />);
    fireEvent.press(getByTestId('emit-navigation'));
    unmount();

    act(() => {
      jest.advanceTimersByTime(NAVIGATION_DELAY_MS * 2);
    });
    // Otherwise the timer fires later and pulls the user out of wherever they went.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('signs out without leaving the session on screen', () => {
    const { getByTestId } = render(<ChatScreen />);
    fireEvent.press(getByTestId('sign-out'));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('redirects to login and never mounts the widget without a session', () => {
    mockSession = null;
    const { getByTestId, queryByTestId } = render(<ChatScreen />);
    expect(getByTestId('redirect').props.children).toBe('/login');
    expect(queryByTestId('emit-navigation')).toBeNull();
    mockSession = {
      token: 'ceremeet-jwt-value',
      email: 'customer-guid@nestlewatersapp.com',
      consumerId: 'customer-guid',
      label: 'Sample user 1',
    };
  });
});
