import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import LoginScreen from '../app/login';
import type { CereMeetVerification } from '../types/auth';

const mockReplace = jest.fn();
const mockSignIn = jest.fn<Promise<CereMeetVerification>, [string, string?]>();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../hooks/useAuthSession', () => ({
  useAuthSession: () => ({
    session: null,
    isSigningIn: false,
    signIn: mockSignIn,
    signOut: jest.fn(),
  }),
}));

jest.mock('../services/sampleUsers', () => ({
  readSampleUsers: () => [
    { id: 'sample-user-1', label: 'Test Müşteri 1', customerId: 'customer-one' },
    { id: 'sample-user-2', label: 'Test Müşteri 2', customerId: 'customer-two' },
  ],
}));

describe('LoginScreen', () => {
  it('signs in with the chosen sample user and enters the chat', async () => {
    mockSignIn.mockResolvedValue({
      authenticated: true,
      email: 'customer-guid@nestlewatersapp.com',
      consumerId: 'customer-guid',
      isWatersUser: true,
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId('sample-user-sample-user-2'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/chat'));
    expect(mockSignIn).toHaveBeenCalledWith('customer-two', 'Test Müşteri 2');
  });

  it('explains a refused login and stays on the login screen', async () => {
    mockSignIn.mockResolvedValue({
      authenticated: false,
      isWatersUser: false,
      reason: 'ceremeet_login_status_401',
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId('sample-user-sample-user-1'));

    await waitFor(() => expect(getByTestId('login-error')).toBeTruthy());
    expect(getByTestId('login-error').props.children).toContain('HTTP 401');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('names the missing login key rather than showing a raw code', async () => {
    mockSignIn.mockResolvedValue({
      authenticated: false,
      isWatersUser: false,
      reason: 'missing_login_key',
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId('sample-user-sample-user-1'));

    await waitFor(() => expect(getByTestId('login-error')).toBeTruthy());
    expect(getByTestId('login-error').props.children).toContain(
      'EXPO_PUBLIC_CAI_WATERS_LOGIN_KEY',
    );
  });

  it('accepts a typed customer id', async () => {
    mockSignIn.mockResolvedValue({
      authenticated: true,
      email: 'customer-guid@nestlewatersapp.com',
      consumerId: 'customer-guid',
      isWatersUser: true,
    });

    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('manual-customer-id-input'), 'customer-guid');
    fireEvent.press(getByTestId('manual-sign-in'));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('customer-guid', undefined));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/chat');
  });
});
