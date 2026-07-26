import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ChatWebView } from '../../components/ChatWebView';
import { useAuthSession } from '../../hooks/useAuthSession';
import type { MainPageNavigationRequest } from '../../types/webview';

/**
 * How long the flow's closing message stays on screen before the host leaves for
 * MainPage. Replacing the route the instant the envelope arrived swapped that message
 * away before it could be read, and it is the point of the whole flow.
 */
export const NAVIGATION_DELAY_MS = 5000;

export default function ChatScreen() {
  const router = useRouter();
  const { session, signOut } = useAuthSession();
  const navigationInFlight = useRef(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drop a pending redirect if the screen goes away first. Without this the timer still
  // fires after the user has navigated elsewhere and yanks them out of wherever they are.
  useEffect(
    () => () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    },
    [],
  );

  const handleNavigationRequest = useCallback((request: MainPageNavigationRequest) => {
    // Claimed up front, not when the timer fires, so repeat deliveries during the wait
    // are still suppressed rather than queueing a second redirect.
    if (navigationInFlight.current) return;
    navigationInFlight.current = true;
    navigationTimer.current = setTimeout(() => {
      navigationTimer.current = null;
      try {
        router.replace(request);
      } catch {
        navigationInFlight.current = false;
        console.warn('Native navigation failed');
      }
    }, NAVIGATION_DELAY_MS);
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
