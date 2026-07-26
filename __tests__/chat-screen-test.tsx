import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ChatScreen from '../app/(tabs)/chat';
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
  it('replaces the route immediately and suppresses duplicate callbacks', () => {
    const { getByTestId, queryByText } = render(<ChatScreen />);
    fireEvent.press(getByTestId('emit-navigation'));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/main-page',
      params: { case_id: 'incident-1' },
    });
    expect(queryByText('Navigate')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
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
