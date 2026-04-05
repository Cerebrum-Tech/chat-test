export interface WebViewMessage {
  Process: string;
  Data: any;
}

export interface GotoPageMessage extends WebViewMessage {
  Process: 'GotoPage';
  Data: {
    PageName: string;
    CaseId: string;
  };
}

export interface WebViewMessageHandler {
  onGotoPage: (data: GotoPageMessage['Data']) => void;
  onUnknownMessage: (message: WebViewMessage) => void;
}

export interface ChatWebViewProps {
  onMessage?: (message: WebViewMessage) => void;
  onNavigationRequest?: (pageName: string, caseId: string) => void;
  style?: any;
} 