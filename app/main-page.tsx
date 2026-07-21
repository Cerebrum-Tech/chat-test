import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function MainPageScreen() {
  const router = useRouter();
  const { case_id } = useLocalSearchParams<{ case_id?: string | string[] }>();
  const incidentId = Array.isArray(case_id) ? case_id[0] : case_id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>MainPage</Text>
        <Text style={styles.label}>Incident ID</Text>
        <Text selectable style={styles.value}>{incidentId || 'Not provided'}</Text>
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
