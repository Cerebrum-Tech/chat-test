import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ChatWebView } from '../../components/ChatWebView';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export default function ChatScreen() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    pageName: string;
    caseId: string;
  } | null>(null);

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      console.log(
        `Navigating to ${pendingNavigation.pageName} with case ${pendingNavigation.caseId}`
      );
      // Here you would implement your actual navigation logic
    }
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webviewContainer}>
        <ChatWebView
          onNavigationRequest={(pageName, caseId) => {
            setPendingNavigation({ pageName, caseId });
            setShowConfirmModal(true);
          }}
          style={styles.webview}
        />
      </View>

      <ConfirmationModal
        visible={showConfirmModal}
        title="🚀 Navigation Request"
        message={
          pendingNavigation
            ? `Navigate to: ${pendingNavigation.pageName}\nCase ID: ${pendingNavigation.caseId}`
            : ''
        }
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
    backgroundColor: '#141414',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});
