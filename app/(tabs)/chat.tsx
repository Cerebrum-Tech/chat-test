import { Redirect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ChatWebView } from '../../components/ChatWebView';
import { useAuthSession } from '../../hooks/useAuthSession';
import type { MainPageNavigationRequest } from '../../types/webview';

export default function ChatScreen() {
  const router = useRouter();
  const { session, signOut } = useAuthSession();
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

  // The widget is only ever mounted with a verified token, so an unauthenticated visitor
  // never reaches the chatbot — matching the backend, which now rejects tokenless sessions.
  if (!session) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sessionBar}>
        <Text style={styles.sessionLabel} numberOfLines={1}>
          {session.label} · {session.consumerId}
        </Text>
        <Pressable testID="sign-out" accessibilityRole="button" onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
      <ChatWebView
        session={session}
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
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sessionLabel: {
    flexShrink: 1,
    color: '#b3b3b3',
    fontSize: 12,
  },
  signOut: {
    color: '#e50914',
    fontSize: 12,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
});
