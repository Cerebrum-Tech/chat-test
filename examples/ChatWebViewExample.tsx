import React, { useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ChatWebView } from '../components/ChatWebView';
import { WebViewMessageHandler } from '../services/WebViewMessageHandler';
import { WebViewMessage } from '../types/webview';

/**
 * Example implementation of ChatWebView with Chatwoot integration
 * 
 * This example shows how to:
 * 1. Set up the ChatWebView component
 * 2. Handle different types of messages from the WebView
 * 3. Implement navigation requests from the chat widget
 * 4. Log all WebView interactions
 */

export const ChatWebViewExample: React.FC = () => {
  const messageHandler = useRef(new WebViewMessageHandler()).current;

  const handleWebViewMessage = (message: WebViewMessage) => {
    // Use the message handler to process different message types
    messageHandler.handleMessage(message, {
      onGotoPage: (pageName: string, caseId: string) => {
        // Handle navigation requests from the chat widget
        console.log('Navigation request:', { pageName, caseId });
        
        // Show confirmation dialog
        Alert.alert(
          'Navigation Request',
          `Navigate to: ${pageName}\nCase ID: ${caseId}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Navigate',
              onPress: () => {
                // Implement your navigation logic here
                // Example: navigation.navigate(pageName, { caseId });
                console.log(`Navigating to ${pageName} with case ${caseId}`);
              }
            }
          ]
        );
      },
      
      onChatMessage: (messageData: any) => {
        // Handle new chat messages
        console.log('New chat message:', messageData);
        
        // You could trigger notifications, update UI, etc.
      },
      
      onLog: (logData: any) => {
        // Handle logs from the WebView
        console.log('WebView log:', logData);
      },
      
      onError: (errorData: any) => {
        // Handle errors from the WebView
        console.error('WebView error:', errorData);
        Alert.alert('Chat Error', errorData.error);
      },
      
      onUnknown: (unknownMessage: WebViewMessage) => {
        // Handle unknown message types
        console.warn('Unknown message type:', unknownMessage);
      }
    });
  };

  return (
    <View style={styles.container}>
      <ChatWebView
        onMessage={handleWebViewMessage}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});

/*
Usage in your screen/component:

import { ChatWebViewExample } from './examples/ChatWebViewExample';

export default function YourScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ChatWebViewExample />
    </View>
  );
}

Message Types Handled:
- GotoPage: Navigation requests from the chat widget back button
- ChatMessage: New messages received in the chat
- Log: Console logs from the WebView
- Error: Error events from the chat widget
- Unknown: Any unrecognized message types

Message Handler Features:
- Automatic message logging with timestamps
- Message history tracking (last 100 messages)
- Message statistics (total, handled, success rate)
- Type-safe message handling
*/ 