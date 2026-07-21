import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import MainPageScreen from '../app/main-page';

const mockReplace = jest.fn();
let mockParams: { case_id?: string } = { case_id: 'incident-1' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

describe('MainPageScreen', () => {
  beforeEach(() => {
    mockParams = { case_id: 'incident-1' };
  });

  it('shows the incident id and returns to chat', () => {
    const { getByText } = render(<MainPageScreen />);
    expect(getByText('MainPage')).toBeTruthy();
    expect(getByText('incident-1')).toBeTruthy();
    fireEvent.press(getByText('Back to chat'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/chat');
  });

  it('shows the explicit empty state when case_id is omitted', () => {
    mockParams = {};
    const { getByText } = render(<MainPageScreen />);
    expect(getByText('Not provided')).toBeTruthy();
  });
});
