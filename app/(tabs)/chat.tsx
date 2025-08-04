import React, { useRef, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
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
  const [messageStats, setMessageStats] = useState<any>(null);
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

    // Update stats
    setMessageStats(messageHandler.getMessageStats());
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
    setMessageStats(messageHandler.getMessageStats());
    Alert.alert('✅ History Cleared', 'Message history has been cleared');
  };

  const toggleWebView = () => {
    setIsVisible(!isVisible);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗨️ Chatwoot WebView Demo</Text>
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
            {isVisible ? '👁️ Hide WebView' : '👁️ Show WebView'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={getMessageHistory}
        >
          <Text style={styles.buttonText}>📋 View History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearHistory}
        >
          <Text style={styles.buttonText}>🗑️ Clear History</Text>
        </TouchableOpacity>
      </View>

      {messageStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Message Statistics</Text>
          <ScrollView style={styles.statsScroll} horizontal>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{messageStats.totalMessages}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{messageStats.handledMessages}</Text>
                <Text style={styles.statLabel}>Handled</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{messageStats.unhandledMessages}</Text>
                <Text style={styles.statLabel}>Unhandled</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{messageStats.successRate.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>💡 Instructions:</Text>
        <Text style={styles.instructionText}>
          • The chat widget will load automatically{'\n'}
          • Try clicking the back button in the chat to trigger navigation{'\n'}
          • All messages are logged and can be viewed in the history{'\n'}
          • Check the console for detailed logs
        </Text>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
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
    padding: 15,
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
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
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e50914',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statsScroll: {
    maxHeight: 60,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e50914',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  instructions: {
    margin: 15,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 18,
  },
  webviewContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  webview: {
    flex: 1,
  },
}); 