import { GotoPageMessage, WebViewMessage } from '../types/webview';

export class WebViewMessageHandler {
  private messageLog: Array<{
    timestamp: string;
    process: string;
    data: any;
    handled: boolean;
  }> = [];

  private logMessage(message: WebViewMessage, handled: boolean = true) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      process: message.Process,
      data: message.Data,
      handled,
    };

    this.messageLog.push(logEntry);

    // Keep only last 100 messages to prevent memory issues
    if (this.messageLog.length > 100) {
      this.messageLog = this.messageLog.slice(-100);
    }

    console.log('📝 Message logged:', logEntry);
  }

  getMessageHistory() {
    return [...this.messageLog];
  }

  clearMessageHistory() {
    this.messageLog = [];
    console.log('🗑️ Message history cleared');
  }

  handleMessage(
    message: WebViewMessage,
    callbacks?: {
      onGotoPage?: (pageName: string, caseId: string) => void;
    }
  ) {
    let handled = false;

    try {
      if (message.Process === 'GotoPage') {
        const gotoMessage = message as GotoPageMessage;
        const { PageName, CaseId } = gotoMessage.Data;

        console.log('🚀 Navigation Request:', {
          pageName: PageName,
          caseId: CaseId,
          timestamp: new Date().toISOString(),
        });

        if (callbacks?.onGotoPage) {
          callbacks.onGotoPage(PageName, CaseId);
        }
        handled = true;
      }
    } catch (error) {
      console.error('❌ Error handling WebView message:', error);
      handled = false;
    }

    this.logMessage(message, handled);
  }
}
