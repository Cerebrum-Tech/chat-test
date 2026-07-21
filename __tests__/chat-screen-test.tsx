import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ChatScreen from '../app/(tabs)/chat';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
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
});
