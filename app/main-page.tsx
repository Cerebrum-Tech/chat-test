import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export default function MainPageScreen() {
  const router = useRouter();
  const { case_id } = useLocalSearchParams<{ case_id?: string | string[] }>();
  const incidentId = Array.isArray(case_id) ? case_id[0] : case_id;
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: textColor }]}>MainPage</Text>
        <Text style={[styles.label, { color: textColor }]}>Incident ID</Text>
        <Text selectable style={[styles.value, { color: textColor }]}>{incidentId || 'Not provided'}</Text>
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
