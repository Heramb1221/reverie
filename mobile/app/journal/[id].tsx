import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { journalApi } from '../../lib/api';
import { Colors, Fonts, MOOD_CONFIG, MoodType } from '../../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<any>(null);

  useEffect(() => {
    if (id) {
      journalApi.get(id)
        .then(res => {
          setEntry(res.data.data.entry);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={Colors.textGhost} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  const moodColor = MOOD_CONFIG[entry.mood as MoodType]?.hex || Colors.textGhost;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={[styles.moodBadge, { backgroundColor: moodColor }]}>
          <Text style={styles.moodText}>{entry.mood}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.date}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.content}>{entry.content}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: Fonts.mono, fontSize: 14, color: Colors.textGhost },
  moodBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  moodText: { fontFamily: Fonts.mono, fontSize: 11, color: '#FFF', textTransform: 'uppercase' },
  scrollBody: { paddingHorizontal: 24, paddingTop: 16 },
  title: { fontFamily: Fonts.displayBold, fontSize: 28, color: Colors.textLight, marginBottom: 8 },
  date: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textGhost, marginBottom: 24 },
  content: { fontFamily: Fonts.sans, fontSize: 16, color: Colors.textLight, lineHeight: 26 },
  errorText: { fontFamily: Fonts.sans, fontSize: 16, color: Colors.textGhost }
});