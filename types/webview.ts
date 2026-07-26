import type { StyleProp, ViewStyle } from 'react-native';
import type { AuthSession } from './auth';

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
  /** The signed-in session whose bearer token and identity are injected into the widget. */
  session: AuthSession;
  onNavigationRequest?: (request: MainPageNavigationRequest) => void;
  style?: StyleProp<ViewStyle>;
}
