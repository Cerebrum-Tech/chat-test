import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthSession } from '../hooks/useAuthSession';
import { readSampleUsers } from '../services/sampleUsers';

/**
 * Non-secret explanations for the gate's reason codes. The codes are produced by both this
 * app's pre-flight and the backend gate, so the same wording applies wherever a token is
 * rejected. Unknown codes fall through to the raw code, which is safe to display.
 */
const REASON_TEXT: Record<string, string> = {
  missing_customer_id: 'Enter a customer id first.',
  missing_login_key: 'EXPO_PUBLIC_CAI_WATERS_LOGIN_KEY is not configured in .env.',
  missing_token: 'No token supplied.',
  ceremeet_login_unreachable: 'CereMeet could not be reached. Check the device network.',
  ceremeet_login_invalid_response: 'The login response could not be read.',
  no_token_in_login_response: 'CereMeet accepted the login but returned no token.',
  ceremeet_api_unreachable: 'CereMeet could not be reached. Check the device network.',
  ceremeet_api_invalid_response: 'CereMeet returned a response that could not be read.',
  no_user_in_response: 'CereMeet accepted the token but returned no user.',
  not_waters_user: 'This account is not flagged as a Waters user, so the chatbot will reject it.',
};

const describeReason = (reason?: string): string => {
  if (!reason) return 'Sign-in failed.';
  if (REASON_TEXT[reason]) return REASON_TEXT[reason];
  if (reason.startsWith('ceremeet_login_status_')) {
    const code = reason.replace('ceremeet_login_status_', '');
    return `CereMeet refused the login (HTTP ${code}). Check the customer id and the login key.`;
  }
  if (reason.startsWith('ceremeet_api_status_')) {
    return `CereMeet rejected the minted token (HTTP ${reason.replace('ceremeet_api_status_', '')}).`;
  }
  return reason;
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isSigningIn } = useAuthSession();
  const sampleUsers = useMemo(() => readSampleUsers(), []);
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const attemptSignIn = useCallback(
    async (customerId: string, label?: string) => {
      setError(null);
      const result = await signIn(customerId, label);
      if (result.authenticated) {
        router.replace('/(tabs)/chat');
        return;
      }
      setError(describeReason(result.reason));
    },
    [router, signIn],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          The chatbot runs every CRM lookup as the authenticated customer. Pick a sample user
          or enter a customer id; CereMeet issues that customer&apos;s token and it is
          verified before the chat opens.
        </Text>

        <Text style={styles.sectionTitle}>Sample users</Text>
        {sampleUsers.length === 0 ? (
          <Text style={styles.empty}>
            No sample users configured. Add EXPO_PUBLIC_CAI_SAMPLE_USER_1_LABEL and
            EXPO_PUBLIC_CAI_SAMPLE_USER_1_CUSTOMER_ID to .env (slots 1-5), then restart Expo
            with --clear.
          </Text>
        ) : (
          sampleUsers.map((user) => (
            <Pressable
              key={user.id}
              testID={`sample-user-${user.id}`}
              accessibilityRole="button"
              disabled={isSigningIn}
              style={({ pressed }) => [styles.userButton, pressed && styles.userButtonPressed]}
              onPress={() => void attemptSignIn(user.customerId, user.label)}>
              <Text style={styles.userLabel}>{user.label}</Text>
              <Text style={styles.userMeta}>{user.customerId}</Text>
            </Pressable>
          ))
        )}

        <Text style={styles.sectionTitle}>Or enter a customer id</Text>
        <TextInput
          testID="manual-customer-id-input"
          style={styles.input}
          value={manualCustomerId}
          onChangeText={setManualCustomerId}
          placeholder="01391bfb-e4cc-eb11-9c21-005056b20185"
          placeholderTextColor="#6b6b6b"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSigningIn}
        />
        <Pressable
          testID="manual-sign-in"
          accessibilityRole="button"
          disabled={isSigningIn || !manualCustomerId.trim()}
          style={({ pressed }) => [
            styles.primaryButton,
            (isSigningIn || !manualCustomerId.trim()) && styles.primaryButtonDisabled,
            pressed && styles.userButtonPressed,
          ]}
          onPress={() => void attemptSignIn(manualCustomerId)}>
          <Text style={styles.primaryButtonText}>Sign in as this customer</Text>
        </Pressable>

        {isSigningIn ? <ActivityIndicator testID="signing-in" color="#e50914" /> : null}
        {error ? (
          <View style={styles.errorBox}>
            <Text testID="login-error" style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  content: {
    padding: 24,
    gap: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  empty: {
    color: '#b3b3b3',
    fontSize: 13,
    lineHeight: 19,
  },
  userButton: {
    backgroundColor: '#232323',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  userButtonPressed: {
    opacity: 0.7,
  },
  userLabel: {
    color: '#ffffff',
    fontSize: 15,
  },
  userMeta: {
    color: '#8c8c8c',
    fontSize: 11,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#232323',
    borderRadius: 8,
    color: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#e50914',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#3a1215',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#ff9d9d',
    fontSize: 13,
    lineHeight: 19,
  },
});
