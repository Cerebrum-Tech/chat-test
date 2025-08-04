import React, { useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChatWebView } from '../../components/ChatWebView';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { WebViewMessageHandler } from '../../services/WebViewMessageHandler';
import { WebViewMessage } from '../../types/webview';

export default function ChatScreen() {
  const [isVisible, setIsVisible] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ pageName: string; caseId: string } | null>(null);
  const messageHandler = useRef(new WebViewMessageHandler()).current;

  const handleWebViewMessage = (message: WebViewMessage) => {
    messageHandler.handleMessage(message, {
      onGotoPage: (pageName: string, caseId: string) => {
        setPendingNavigation({ pageName, caseId });
        setShowConfirmModal(true);
      },
      onChatMessage: (messageData: any) => {
        console.log('New chat message received:', messageData);
      },
      onLog: (logData: any) => {
        console.log('WebView log:', logData);
      },
      onError: (errorData: any) => {
        Alert.alert('WebView Error', errorData.error);
      },
      onUnknown: (unknownMessage: WebViewMessage) => {
        console.log('Unknown message type:', unknownMessage);
      }
    });


  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      console.log(`Navigating to ${pendingNavigation.pageName} with case ${pendingNavigation.caseId}`);
      // Here you would implement your actual navigation logic
    }
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const getMessageHistory = () => {
    const history = messageHandler.getMessageHistory();
    const historyText = history
      .slice(-10) // Show last 10 messages
      .map((msg, index) => 
        `${index + 1}. [${msg.timestamp}] ${msg.process}: ${JSON.stringify(msg.data).substring(0, 100)}...`
      )
      .join('\n');

    Alert.alert(
      '📋 Message History (Last 10)',
      historyText || 'No messages yet',
      [{ text: 'OK' }]
    );
  };

  const clearHistory = () => {
    messageHandler.clearMessageHistory();
    Alert.alert('✅ History Cleared', 'Message history has been cleared');
  };

  const toggleWebView = () => {
    setIsVisible(!isVisible);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>chatbot react test</Text>
        <Text style={styles.subtitle}>
          WebView integration with message logging
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={toggleWebView}
        >
          <Text style={styles.buttonText}>
            {isVisible ? '👁️ Hide' : '👁️ Show'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={getMessageHistory}
        >
          <Text style={styles.buttonText}>📋 History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearHistory}
        >
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>



      {isVisible && (
        <View style={styles.webviewContainer}>
          <ChatWebView
            onMessage={handleWebViewMessage}
            style={styles.webview}
          />
        </View>
      )}

      <ConfirmationModal
        visible={showConfirmModal}
        title="🚀 Navigation Request"
        message={pendingNavigation ? `Navigate to: ${pendingNavigation.pageName}\nCase ID: ${pendingNavigation.caseId}` : ''}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        confirmText="Navigate"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414', // Netflix theme
  },
  header: {
    padding: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e50914', // Netflix red
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  controls: {
    flexDirection: 'row',
    padding: 10,
    gap: 6,
    flexWrap: 'nowrap',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#e50914',
  },
  secondaryButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#666',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  webviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
}); 