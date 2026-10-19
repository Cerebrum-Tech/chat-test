import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import ChatScreen from '../app/(tabs)/chat';
import LoginScreen from '../app/login';
import { AuthSessionProvider, useAuthSession } from '../hooks/useAuthSession';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Redirect: () => null,
}));

// Keep session state and both screens real; only replace network/native boundaries.
jest.mock('../services/ceremeetAuth', () => ({
  watersLogin: async () => ({ ok: true, accessToken: 'test-session-token' }),
  verifyCereMeetUser: async () => ({
    authenticated: true,
    isWatersUser: true,
    consumerId: 'test-customer',
    email: 'test-customer@example.com',
  }),
}));

jest.mock('../components/ChatWebView', () => ({
  ChatWebView: () => null,
}));

function SessionScreens() {
  const { session } = useAuthSession();
  return (
    <>
      <Text testID="session-status">{session ? 'Signed in' : 'Signed out'}</Text>
      {session ? <ChatScreen /> : <LoginScreen />}
    </>
  );
}

it('clears the real session and restores customer selection when Sign out is pressed', async () => {
  const screen = render(
    <SafeAreaInsetsContext.Provider value={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <AuthSessionProvider>
        <SessionScreens />
      </AuthSessionProvider>
    </SafeAreaInsetsContext.Provider>,
  );

  fireEvent.changeText(screen.getByTestId('manual-customer-id-input'), 'test-customer');
  fireEvent.press(screen.getByTestId('manual-sign-in'));
  await waitFor(() => expect(screen.getByTestId('session-status')).toHaveTextContent('Signed in'));

  fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

  expect(screen.getByTestId('session-status')).toHaveTextContent('Signed out');
  expect(screen.getByTestId('manual-customer-id-input')).toBeOnTheScreen();
  expect(screen.queryByTestId('sign-out')).toBeNull();
});
