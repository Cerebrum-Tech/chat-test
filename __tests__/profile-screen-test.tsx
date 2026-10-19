import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaView, StyleSheet } from 'react-native';

import ProfileScreen from '../app/profile-screen';
import { Colors } from '../constants/Colors';

const mockReplace = jest.fn();
let mockParams: { address_id?: string } = { address_id: 'address-1' };
let mockColorScheme: 'light' | 'dark' = 'light';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => mockColorScheme,
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockParams = { address_id: 'address-1' };
    mockColorScheme = 'light';
  });

  it('shows the address id and returns to chat', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('ProfileScreen')).toBeTruthy();
    expect(getByText('Address ID')).toBeTruthy();
    expect(getByText('address-1')).toBeTruthy();
    fireEvent.press(getByText('Back to chat'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/chat');
  });

  it('shows the explicit empty state when no address was chosen', () => {
    mockParams = {};
    const { getByText, queryByText } = render(<ProfileScreen />);
    expect(getByText('Not provided')).toBeTruthy();
    // No incident row: the X button never carries one.
    expect(queryByText('Incident ID')).toBeNull();
  });

  it('uses readable dark theme colors', () => {
    mockColorScheme = 'dark';
    const { getByText, UNSAFE_getByType } = render(<ProfileScreen />);

    expect(StyleSheet.flatten(UNSAFE_getByType(SafeAreaView).props.style)).toMatchObject({
      backgroundColor: Colors.dark.background,
    });

    for (const text of ['ProfileScreen', 'Address ID', 'address-1']) {
      expect(StyleSheet.flatten(getByText(text).props.style)).toMatchObject({
        color: Colors.dark.text,
      });
    }
  });
});
