import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaView, StyleSheet } from 'react-native';

import MainPageScreen from '../app/main-page';
import { Colors } from '../constants/Colors';

const mockReplace = jest.fn();
let mockParams: { case_id?: string; address_id?: string } = {
  case_id: 'incident-1',
  address_id: 'address-1',
};
let mockColorScheme: 'light' | 'dark' = 'light';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => mockColorScheme,
}));

describe('MainPageScreen', () => {
  beforeEach(() => {
    mockParams = { case_id: 'incident-1', address_id: 'address-1' };
    mockColorScheme = 'light';
  });

  it('shows the incident and address ids and returns to chat', () => {
    const { getByText } = render(<MainPageScreen />);
    expect(getByText('MainPage')).toBeTruthy();
    expect(getByText('incident-1')).toBeTruthy();
    expect(getByText('address-1')).toBeTruthy();
    fireEvent.press(getByText('Back to chat'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/chat');
  });

  it('shows the explicit empty state for each id that is omitted', () => {
    // Both ids are independently optional, so both rows can read Not provided at once.
    mockParams = {};
    const { getAllByText } = render(<MainPageScreen />);
    expect(getAllByText('Not provided')).toHaveLength(2);
  });

  it('labels each id, so a filled row is never read as the other one', () => {
    mockParams = { address_id: 'address-1' };
    const { getByText } = render(<MainPageScreen />);
    expect(getByText('Incident ID')).toBeTruthy();
    expect(getByText('Address ID')).toBeTruthy();
    expect(getByText('address-1')).toBeTruthy();
    expect(getByText('Not provided')).toBeTruthy();
  });

  it('uses readable dark theme colors for the screen and incident text', () => {
    mockColorScheme = 'dark';
    const { getByText, UNSAFE_getByType } = render(<MainPageScreen />);

    expect(StyleSheet.flatten(UNSAFE_getByType(SafeAreaView).props.style)).toMatchObject({
      backgroundColor: Colors.dark.background,
    });

    for (const text of ['MainPage', 'Incident ID', 'incident-1', 'Address ID', 'address-1']) {
      expect(StyleSheet.flatten(getByText(text).props.style)).toMatchObject({
        color: Colors.dark.text,
      });
    }
  });
});
