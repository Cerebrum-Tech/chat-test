import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ChatWebView } from '../../components/ChatWebView';
import type { MainPageNavigationRequest } from '../../types/webview';

export default function ChatScreen() {
  const router = useRouter();
  const navigationInFlight = useRef(false);
  const handleNavigationRequest = useCallback((request: MainPageNavigationRequest) => {
    if (navigationInFlight.current) return;
    navigationInFlight.current = true;
    try {
      router.replace(request);
    } catch {
      navigationInFlight.current = false;
      console.warn('Native navigation failed');
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <ChatWebView
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
