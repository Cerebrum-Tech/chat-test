import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export default function ProfileScreen() {
  const router = useRouter();
  const { address_id } = useLocalSearchParams<{ address_id?: string | string[] }>();
  // The address the user picked in the conversation before pressing X. Shown rather than
  // acted on: this host is a contract harness, and the real app owns the profile view.
  const addressId = Array.isArray(address_id) ? address_id[0] : address_id;
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: textColor }]}>ProfileScreen</Text>
        <Text style={[styles.label, { color: textColor }]}>Address ID</Text>
        <Text selectable style={[styles.value, { color: textColor }]}>{addressId || 'Not provided'}</Text>
        <Button title="Back to chat" onPress={() => router.replace('/(tabs)/chat')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { gap: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  label: { fontSize: 16, fontWeight: '600' },
  value: { fontSize: 16 },
});
