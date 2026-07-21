import type { StyleProp, ViewStyle } from 'react-native';

export interface NavigationAction {
  output_type: 'navigation';
  process: 'GotoPage';
  data: {
    page_name: 'MainPage';
    case_id?: string;
  };
}

export type MainPageNavigationRequest = {
  pathname: '/main-page';
  params?: {
    case_id: string;
  };
};

export interface ChatWebViewProps {
  onNavigationRequest?: (request: MainPageNavigationRequest) => void;
  style?: StyleProp<ViewStyle>;
}
