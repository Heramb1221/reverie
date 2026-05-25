import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { journalApi, reflectionApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useMoodStore } from '../../store/moodStore';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG } from '../../lib/theme';
import { MoodCard } from '../../components/journal/MoodCard';
import { JournalListCard } from '../../components/journal/JournalListCard';
import { useState } from 'react';

const BG_IMAGES: Record<string, any> = {
  calm:        require('../../assets/backgrounds/hero.jpg'),
  reflective:  require('../../assets/backgrounds/emotional.jpg'),
  hopeful:     require('../../assets/backgrounds/secondary.jpg'),
  overwhelmed: require('../../assets/backgrounds/dashboard.jpg'),
};

const PROMPTS = [
  'What small thing made you pause today?',
  'Describe your mood as a weather pattern.',
  'What are you grateful for right now?',
  'What feeling has followed you this week?',
];

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function HomeScreen() {
  const insets       = useSafeAreaInsets();
  const { user }     = useAuthStore();
  const { activeMood } = useMoodStore();
  const config       = MOOD_CONFIG[activeMood];
  const [refreshing, setRefreshing] = useState(false);

  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length];

  const { data: journalData, refetch: refetchJournals } = useQuery({
    queryKey: ['journals-mobile'],
    queryFn: () => journalApi.list({ page: 1, limit: 4 }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats-mobile'],
    queryFn: () => journalApi.stats(),
  });

  const { data: reflectionData } = useQuery({
    queryKey: ['reflection-latest-mobile'],
    queryFn: () => reflectionApi.latest(),
  });

  const entries    = journalData?.data?.data?.entries    || [];
  const stats      = statsData?.data?.data?.stats        || {};
  const reflection = reflectionData?.data?.data?.reflection;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchJournals();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.surface }]}>
      {/* Atmospheric background */}
      <ImageBackground
        source={BG_IMAGES[activeMood]}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: activeMood === 'calm' ? 'rgba(244,242,238,0.88)'
            : activeMood === 'reflective' ? 'rgba(242,244,242,0.88)'
            : activeMood === 'hopeful'    ? 'rgba(250,247,242,0.88)'
            : 'rgba(240,244,246,0.88)',
        }]} />
      </ImageBackground>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Space[4], paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.hex} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{user?.name?.split(' ')[0] || 'Friend'}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Quick write prompt */}
        <TouchableOpacity
          style={[styles.promptCard, { borderColor: `${config.hex}30` }]}
          onPress={() => router.push('/journal/new')}
          activeOpacity={0.85}
        >
          <View style={styles.promptTop}>
            <Text style={styles.promptLabel}>Today's prompt</Text>
            <Text style={[styles.promptEmoji]}>{config.emoji}</Text>
          </View>
          <Text style={styles.promptText}>"{prompt}"</Text>
          <View style={[styles.promptBtn, { backgroundColor: config.hex }]}>
            <Text style={styles.promptBtnText}>Begin writing</Text>
          </View>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Entries',  value: stats.totalEntries  ?? '—' },
            { label: 'Streak',   value: stats.currentStreak ? `${stats.currentStreak}d` : '—' },
            { label: 'Words',    value: stats.totalWords    ? `${Math.round(stats.totalWords / 1000)}k` : '—' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Reflection teaser */}
        {reflection && (
          <TouchableOpacity
            style={[styles.reflectionCard, { backgroundColor: `${config.hex}10`, borderColor: `${config.hex}25` }]}
            onPress={() => router.push('/reflection')}
            activeOpacity={0.85}
          >
            <View style={styles.reflectionHeader}>
              <Text style={[styles.reflectionIcon, { color: config.hex }]}>✦</Text>
              <Text style={[styles.reflectionLabel, { color: config.hex }]}>Weekly reflection</Text>
            </View>
            <Text style={styles.reflectionPreview} numberOfLines={3}>
              "{reflection.content?.slice(0, 140)}…"
            </Text>
          </TouchableOpacity>
        )}

        {/* Recent entries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent entries</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={[styles.sectionLink, { color: config.hex }]}>View all</Text>
            </TouchableOpacity>
          </View>

          {entries.length > 0 ? (
            entries.map((entry: any) => (
              <JournalListCard
                key={entry._id}
                entry={entry}
                onPress={() => router.push(`/journal/${entry._id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyTitle}>Your journal is waiting</Text>
              <Text style={styles.emptyDesc}>Write your first entry — even a sentence counts.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { paddingHorizontal: Space[5] },
  header:      { marginBottom: Space[6] },
  greeting:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: 4 },
  name:        { fontFamily: Fonts.displayMedium, fontSize: FontSizes['3xl'], color: Colors.textPrimary, letterSpacing: -0.5, lineHeight: 40 },
  date:        { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 4 },

  promptCard:  { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: Radius.xl, padding: Space[5], borderWidth: 1, marginBottom: Space[4], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  promptTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space[2] },
  promptLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost },
  promptEmoji: { fontSize: 22 },
  promptText:  { fontFamily: Fonts.displayItalic, fontSize: FontSizes.lg, color: Colors.textSecondary, lineHeight: 28, marginBottom: Space[4] },
  promptBtn:   { alignSelf: 'flex-start', paddingHorizontal: Space[4], paddingVertical: Space[2], borderRadius: Radius.full },
  promptBtnText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },

  statsRow:  { flexDirection: 'row', gap: Space[3], marginBottom: Space[4] },
  statCard:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: Radius.lg, padding: Space[4], alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8 },
  statValue: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary },
  statLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.textGhost, marginTop: 4 },

  reflectionCard:   { borderRadius: Radius.xl, padding: Space[4], borderWidth: 1, marginBottom: Space[4] },
  reflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Space[2], marginBottom: Space[2] },
  reflectionIcon:   { fontFamily: Fonts.mono, fontSize: FontSizes.base },
  reflectionLabel:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  reflectionPreview:{ fontFamily: Fonts.displayItalic, fontSize: FontSizes.base, color: Colors.textMuted, lineHeight: 24 },

  section:       { marginTop: Space[2] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space[3] },
  sectionTitle:  { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary },
  sectionLink:   { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1 },

  emptyCard:  { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: Radius.xl, padding: Space[10], alignItems: 'center' },
  emptyIcon:  { fontSize: 36, marginBottom: Space[3] },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.md, color: Colors.textPrimary, marginBottom: Space[2] },
  emptyDesc:  { fontFamily: Fonts.sansLight, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
