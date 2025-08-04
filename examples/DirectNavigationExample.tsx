import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ChatWebView } from '../components/ChatWebView';
import { WebViewMessage } from '../types/webview';

// Example of direct navigation without confirmation modal
export default function DirectNavigationExample({ navigation }: any) {
  
  const handleWebViewMessage = (message: WebViewMessage) => {
    console.log('📥 WebView Message Received:', message);
  };

  const handleNavigationRequest = (pageName: string, caseId: string) => {
    console.log('🧭 Direct Navigation Request:', { pageName, caseId });
    
    // Direct navigation like in the example
    switch (pageName) {
      case 'AddressesScreen':
      case 'Addresses':
        navigation.navigate('Addresses', { caseId });
        break;
      case 'OrdersScreen':
      case 'Orders':
        navigation.navigate('Orders', { caseId });
        break;
      case 'ProfileScreen':
      case 'Profile':
        navigation.navigate('Profile', { caseId });
        break;
      default:
        console.warn('Unknown page:', pageName);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatWebView
        onMessage={handleWebViewMessage}
        onNavigationRequest={handleNavigationRequest}
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  webview: {
    flex: 1,
  },
});