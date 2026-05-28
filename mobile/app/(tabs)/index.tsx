import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { journalApi, reflectionApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useMoodStore } from '../../store/moodStore';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG } from '../../lib/theme';
import { JournalListCard } from '../../components/journal/JournalListCard';

const PROMPTS = [
  'What small thing made you pause today?',
  'Describe your mood as a weather pattern.',
  'What are you grateful for right now?',
  'What feeling has followed you this week?',
  'What did you notice today that surprised you?',
  'How does your body feel in this moment?',
  'What would you say to yourself a year from now?',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getPrompt() {
  return PROMPTS[new Date().getDay() % PROMPTS.length];
}

interface JournalEntry {
  _id: string;
  title: string;
  contentPreview?: string;
  mood: 'calm' | 'reflective' | 'hopeful' | 'overwhelmed';
  wordCount: number;
  createdAt: string;
}

interface Stats {
  totalEntries?: number;
  currentStreak?: number;
  totalWords?: number;
}

export default function HomeScreen() {
  const insets       = useSafeAreaInsets();
  const { user }     = useAuthStore();
  const { activeMood } = useMoodStore();
  const config       = MOOD_CONFIG[activeMood];
  const [refreshing, setRefreshing] = useState(false);

  const { data: journalData, refetch } = useQuery({
    queryKey: ['journals-mobile'],
    queryFn:  () => journalApi.list({ page: 1, limit: 5 }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats-mobile'],
    queryFn:  () => journalApi.stats(),
  });

  const { data: reflectionData } = useQuery({
    queryKey: ['reflection-latest-mobile'],
    queryFn:  () => reflectionApi.latest(),
  });

  const entries: JournalEntry[]    = (journalData?.data?.data?.entries  as JournalEntry[])   ?? [];
  const stats:   Stats             = (statsData?.data?.data?.stats       as Stats)            ?? {};
  const reflection                 = (reflectionData?.data?.data?.reflection as { content?: string } | null) ?? null;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const overlayColor =
    activeMood === 'calm'        ? 'rgba(244,242,238,0.88)'
    : activeMood === 'reflective' ? 'rgba(242,244,242,0.88)'
    : activeMood === 'hopeful'    ? 'rgba(250,247,242,0.88)'
    : 'rgba(240,244,246,0.88)';

  return (
    <View style={s.root}>
      {/* Atmospheric tint background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Space[4], paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.hex} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.name}>{user?.name?.split(' ')[0] ?? 'Friend'}</Text>
          <Text style={s.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Quick write prompt */}
        <TouchableOpacity
          style={[s.promptCard, { borderColor: `${config.hex}35` }]}
          onPress={() => router.push('/journal/new' as `/${string}`)}
          activeOpacity={0.85}
        >
          <View style={s.promptTop}>
            <Text style={s.promptLabel}>Today's prompt</Text>
            <Text style={s.promptEmoji}>{config.emoji}</Text>
          </View>
          <Text style={s.promptText}>"{getPrompt()}"</Text>
          <View style={[s.promptBtn, { backgroundColor: config.hex }]}>
            <Text style={s.promptBtnText}>Begin writing</Text>
          </View>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { label: 'Entries', value: String(stats.totalEntries ?? '—') },
            { label: 'Streak',  value: stats.currentStreak ? `${stats.currentStreak}d` : '—' },
            { label: 'Words',   value: stats.totalWords ? `${Math.round(stats.totalWords / 1000)}k` : '—' },
          ].map(stat => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* AI reflection teaser */}
        {reflection?.content && (
          <TouchableOpacity
            style={[s.reflectionCard, { backgroundColor: `${config.hex}12`, borderColor: `${config.hex}28` }]}
            onPress={() => router.push('/(tabs)/reflection' as `/${string}`)}
            activeOpacity={0.85}
          >
            <View style={s.reflectionHeader}>
              <Text style={[s.reflectionIcon, { color: config.hex }]}>✦</Text>
              <Text style={[s.reflectionLabel, { color: config.hex }]}>Weekly reflection</Text>
            </View>
            <Text style={s.reflectionPreview} numberOfLines={2}>
              "{reflection.content.slice(0, 140)}…"
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <View style={s.quickRow}>
          <TouchableOpacity style={s.quickCard} onPress={() => router.push('/capsules' as `/${string}`)} activeOpacity={0.85}>
            <Text style={s.quickIcon}>🔒</Text>
            <Text style={s.quickTitle}>Capsules</Text>
            <Text style={s.quickSub}>Write to future you</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={() => router.push('/search' as `/${string}`)} activeOpacity={0.85}>
            <Text style={s.quickIcon}>🔍</Text>
            <Text style={s.quickTitle}>Search</Text>
            <Text style={s.quickSub}>Find any memory</Text>
          </TouchableOpacity>
        </View>

        {/* Recent entries */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent entries</Text>
            <TouchableOpacity onPress={() => router.push('/search' as `/${string}`)}>
              <Text style={[s.sectionLink, { color: config.hex }]}>View all →</Text>
            </TouchableOpacity>
          </View>

          {entries.length > 0 ? (
            entries.map(entry => (
              <JournalListCard
                key={entry._id}
                entry={entry}
                onPress={() => router.push(`/journal/${entry._id}` as `/${string}`)}
              />
            ))
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🌱</Text>
              <Text style={s.emptyTitle}>Your journal is waiting</Text>
              <Text style={s.emptySub}>
                No entries yet. Write your first thought — even a single sentence is a start.
              </Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: config.hex }]}
                onPress={() => router.push('/journal/new' as `/${string}`)}
              >
                <Text style={s.emptyBtnText}>Write something</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  scroll:         { paddingHorizontal: Space[5] },
  header:         { marginBottom: Space[5] },
  greeting:       { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: 4 },
  name:           { fontFamily: Fonts.displayMedium, fontSize: FontSizes['3xl'], color: Colors.textPrimary, letterSpacing: -0.5, lineHeight: 40 },
  date:           { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 4 },
  promptCard:     { backgroundColor: 'rgba(255,255,255,0.68)', borderRadius: Radius.xl, padding: Space[5], borderWidth: 1, marginBottom: Space[4],
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  promptTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space[2] },
  promptLabel:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost },
  promptEmoji:    { fontSize: 22 },
  promptText:     { fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textSecondary, lineHeight: 28, marginBottom: Space[4], fontStyle: 'italic' },
  promptBtn:      { alignSelf: 'flex-start', paddingHorizontal: Space[4], paddingVertical: Space[2], borderRadius: Radius.full },
  promptBtnText:  { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },
  statsRow:       { flexDirection: 'row', gap: Space[3], marginBottom: Space[4] },
  statCard:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.68)', borderRadius: Radius.lg, padding: Space[4], alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  statValue:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary },
  statLabel:      { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.textGhost, marginTop: 4 },
  reflectionCard: { borderRadius: Radius.xl, padding: Space[4], borderWidth: 1, marginBottom: Space[4] },
  reflectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: Space[2], marginBottom: Space[2] },
  reflectionIcon: { fontFamily: Fonts.mono, fontSize: FontSizes.base },
  reflectionLabel:{ fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  reflectionPreview:{ fontFamily: Fonts.display, fontSize: FontSizes.base, color: Colors.textMuted, lineHeight: 24, fontStyle: 'italic' },
  quickRow:       { flexDirection: 'row', gap: Space[3], marginBottom: Space[4] },
  quickCard:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.68)', borderRadius: Radius.xl, padding: Space[4],
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  quickIcon:      { fontSize: 22, marginBottom: Space[2] },
  quickTitle:     { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.textPrimary },
  quickSub:       { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.textGhost, marginTop: 2 },
  section:        { marginBottom: Space[4] },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space[3] },
  sectionTitle:   { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary },
  sectionLink:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1 },
  empty:          { backgroundColor: 'rgba(255,255,255,0.68)', borderRadius: Radius.xl, padding: Space[10], alignItems: 'center' },
  emptyIcon:      { fontSize: 36, marginBottom: Space[3] },
  emptyTitle:     { fontFamily: Fonts.displayMedium, fontSize: FontSizes.md, color: Colors.textPrimary, marginBottom: Space[2] },
  emptySub:       { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: Space[5] },
  emptyBtn:       { paddingHorizontal: Space[5], paddingVertical: Space[3], borderRadius: Radius.full },
  emptyBtnText:   { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },
});
