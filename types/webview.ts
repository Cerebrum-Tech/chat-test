import type { StyleProp, ViewStyle } from 'react-native';
import type { AuthSession } from './auth';

export type NavigationAction =
  | {
      output_type: 'navigation';
      process: 'GotoPage';
      data: {
        page_name: 'MainPage';
        /** CRM incident the conversation opened. */
        case_id?: string;
        /** Consumer address the main page should open on. */
        address_id?: string;
      };
    }
  | {
      output_type: 'navigation';
      process: 'GotoPage';
      data: {
        page_name: 'ProfileScreen';
        /** Consumer address the profile screen should open on. */
        address_id?: string;
      };
    };

export type MainPageNavigationRequest = {
  pathname: '/main-page';
  /** Present only when at least one id survived validation; each key independently optional. */
  params?: {
    case_id?: string;
    address_id?: string;
  };
};

export type ProfileScreenNavigationRequest = {
  pathname: '/profile-screen';
  /** Present only when a nonblank address_id survived validation. */
  params?: {
    address_id?: string;
  };
};

export type NativeNavigationRequest = MainPageNavigationRequest | ProfileScreenNavigationRequest;

export interface ChatWebViewProps {
  /** The signed-in session whose bearer token and identity are injected into the widget. */
  session: AuthSession;
  onNavigationRequest?: (request: NativeNavigationRequest) => void;
  style?: StyleProp<ViewStyle>;
}
