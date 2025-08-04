import { GotoPageMessage, WebViewMessage } from '../types/webview';

export class WebViewMessageHandler {
  private messageLog: Array<{
    timestamp: string;
    process: string;
    data: any;
    handled: boolean;
  }> = [];

  // Log all messages for debugging
  private logMessage(message: WebViewMessage, handled: boolean = true) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      process: message.Process,
      data: message.Data,
      handled
    };
    
    this.messageLog.push(logEntry);
    
    // Keep only last 100 messages to prevent memory issues
    if (this.messageLog.length > 100) {
      this.messageLog = this.messageLog.slice(-100);
    }
    
    console.log('📝 Message logged:', logEntry);
  }

  // Get message history for debugging
  getMessageHistory() {
    return [...this.messageLog];
  }

  // Clear message history
  clearMessageHistory() {
    this.messageLog = [];
    console.log('🗑️ Message history cleared');
  }

  // Main message handler
  handleMessage(
    message: WebViewMessage,
    callbacks?: {
      onGotoPage?: (pageName: string, caseId: string) => void;
      onChatMessage?: (messageData: any) => void;
      onLog?: (logData: any) => void;
      onError?: (errorData: any) => void;
      onUnknown?: (message: WebViewMessage) => void;
    }
  ) {
    let handled = false;

    console.log('🔍 Handling message:', message);
    try {
      switch (message.Process) {
        case 'GotoPage':
          this.handleGotoPage(message as GotoPageMessage, callbacks?.onGotoPage);
          handled = true;
          break;

        case 'ChatMessage':
          this.handleChatMessage(message, callbacks?.onChatMessage);
          handled = true;
          break;

        case 'Log':
          this.handleLog(message, callbacks?.onLog);
          handled = true;
          break;

        case 'Error':
          this.handleError(message, callbacks?.onError);
          handled = true;
          break;

        default:
          this.handleUnknownMessage(message, callbacks?.onUnknown);
          handled = false;
          break;
      }
    } catch (error) {
      console.error('❌ Error handling WebView message:', error);
      handled = false;
    }

    this.logMessage(message, handled);
  }

  private handleGotoPage(message: GotoPageMessage, callback?: (pageName: string, caseId: string) => void) {
    const { PageName, CaseId } = message.Data;
    
    console.log('🚀 Navigation Request:', {
      pageName: PageName,
      caseId: CaseId,
      timestamp: new Date().toISOString()
    });

    if (callback) {
      callback(PageName, CaseId);
    } else {
      console.warn('⚠️ No navigation callback provided for GotoPage message');
    }
  }

  private handleChatMessage(message: WebViewMessage, callback?: (messageData: any) => void) {
    console.log('💬 New Chat Message:', {
      message: message.Data.message,
      timestamp: message.Data.timestamp
    });

    // Check if chat message contains navigation action
    const chatMessage = message.Data?.message;
    if (chatMessage?.content_attributes?.navigation_action) {
      console.log('🧭 Navigation action found in chat message', chatMessage);
      const navData = chatMessage.content_attributes.navigation_data;
      if (navData?.process === 'GotoPage') {
        console.log('📍 Processing embedded navigation:', navData.data);
      }
    }

    if (callback) {
      callback(message.Data);
    }
  }

  private handleLog(message: WebViewMessage, callback?: (logData: any) => void) {
    const { level, message: logMessage, timestamp } = message.Data;
    
    console.log(`📋 WebView Log [${level}]:`, logMessage, `(${timestamp})`);

    if (callback) {
      callback(message.Data);
    }
  }

  private handleError(message: WebViewMessage, callback?: (errorData: any) => void) {
    console.error('🚨 WebView Error:', {
      error: message.Data.error,
      timestamp: message.Data.timestamp
    });

    if (callback) {
      callback(message.Data);
    }
  }

  private handleUnknownMessage(message: WebViewMessage, callback?: (message: WebViewMessage) => void) {
    console.warn('❓ Unknown message type:', {
      process: message.Process,
      data: message.Data
    });

    if (callback) {
      callback(message);
    }
  }

  // Get statistics about message types
  getMessageStats() {
    const stats = this.messageLog.reduce((acc, log) => {
      acc[log.process] = (acc[log.process] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalMessages = this.messageLog.length;
    const handledMessages = this.messageLog.filter(log => log.handled).length;
    const unhandledMessages = totalMessages - handledMessages;

    return {
      totalMessages,
      handledMessages,
      unhandledMessages,
      messageTypes: stats,
      successRate: totalMessages > 0 ? (handledMessages / totalMessages) * 100 : 0
    };
  }
} 