import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reflectionApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, type MoodType } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

interface ReflectionData {
  _id: string;
  content: string;
  weekStart: string;
  weekEnd: string;
  entriesAnalyzed: number;
  dominantMood: MoodType | null;
  moodDistribution: Record<string, number>;
  generatedAt?: string;
  createdAt: string;
}

const MOOD_EMOJI: Record<string, string> = {
  calm: '🌿', reflective: '🌧', hopeful: '🌅', overwhelmed: '🌊',
};

export default function ReflectionScreen() {
  const insets        = useSafeAreaInsets();
  const { activeMood } = useMoodStore();
  const config        = MOOD_CONFIG[activeMood];
  const haptics       = useHaptics();
  const qc            = useQueryClient();

  const { data: latestData, isLoading } = useQuery({
    queryKey: ['reflection-latest-mobile'],
    queryFn:  () => reflectionApi.latest(),
  });

  const { data: listData } = useQuery({
    queryKey: ['reflections-mobile'],
    queryFn:  () => reflectionApi.list(),
  });

  const [fallbackReflection, setFallbackReflection] =
  useState<string | null>(null);

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: () => reflectionApi.generate({ forceRegenerate: Boolean(reflection) }),
    onSuccess: (res) => {
      console.log('[MobileReflection] generate success', {
        status: res.status,
        reflectionId: res.data?.data?.reflection?._id,
        entriesAnalyzed: res.data?.data?.reflection?.entriesAnalyzed,
      });
      qc.invalidateQueries({ queryKey: ['reflection-latest-mobile'] });
      qc.invalidateQueries({ queryKey: ['reflections-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Your reflection is ready' });
    },
    onError: (err: unknown) => {
      console.error('[MobileReflection] generate error', {
        status: (err as { response?: { status?: number } })?.response?.status,
        message:
          (err as {
            response?: { data?: { message?: string } };
            message?: string;
          })?.response?.data?.message ||
          (err as { message?: string })?.message,
        data: (err as { response?: { data?: unknown } })?.response?.data,
      });

      const moodMessage =
        activeMood === 'calm'
          ? 'You seemed to seek balance and quiet moments this week.'
          : activeMood === 'hopeful'
          ? 'There were signs of optimism and forward movement this week.'
          : activeMood === 'reflective'
          ? 'You spent time thinking deeply about your experiences.'
          : 'This week may have felt emotionally demanding at times.';

      setFallbackReflection(`
    ${moodMessage}

    AI reflection is temporarily unavailable.

    Take a few minutes to look back at your journal entries and consider:

    • What moments stood out this week?
    • Which emotions appeared most often?
    • What challenged you?
    • What are you grateful for?
    • What would you like to improve next week?

    Your reflections matter, and every entry contributes to your growth.
      `.trim());

      haptics.error();

      Toast.show({
        type: 'info',
        text1: 'AI reflection unavailable',
        text2: 'Showing a guided reflection instead.',
      });
    },
  });

  const reflection = latestData?.data?.data?.reflection as ReflectionData | null;
  const allReflections = (listData?.data?.data?.reflections as ReflectionData[]) ?? [];

  return (
    <View style={[s.root, { paddingTop: insets.top + Space[4] }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={s.pageLabel}>Your AI companion</Text>
        <Text style={s.pageTitle}>Weekly Reflection</Text>
        <Text style={s.weekRange}>
          {format(new Date(), 'MMM d')} – {format(new Date(Date.now() + 86400000 * 6), 'MMM d, yyyy')}
        </Text>

        {/* Loading */}
        {isLoading && (
          <ActivityIndicator color={config.hex} style={{ marginTop: Space[10] }} />
        )}

        {/* Generating animation */}
        {generating && (
          <View style={[s.card, { alignItems: 'center', padding: Space[10] }]}>
            <ActivityIndicator color={config.hex} />
            <Text style={[s.generatingText, { color: config.hex }]}>
              Reflecting on your week…
            </Text>
          </View>
        )}

        {/* Reflection card */}
        {!generating && reflection && (
          <View style={[s.card, { borderColor: `${config.hex}28` }]}>
            {/* Card header */}
            <View style={[s.cardHeader, { backgroundColor: `${config.hex}12` }]}>
              <View style={[s.cardIcon, { backgroundColor: `${config.hex}22` }]}>
                <Text style={[s.cardIconText, { color: config.hex }]}>✦</Text>
              </View>
              <View style={s.cardHeaderInfo}>
                <Text style={[s.cardLabel, { color: config.hex }]}>Reverie reflects</Text>
                <Text style={s.cardDate}>
                  {format(new Date(reflection.weekStart), 'MMM d')} –{' '}
                  {format(new Date(reflection.weekEnd), 'MMM d, yyyy')}
                </Text>
              </View>
              <Text style={s.entriesCount}>{reflection.entriesAnalyzed} entries</Text>
            </View>

            {/* Mood distribution pills */}
            <View style={s.moodPills}>
              {Object.entries(reflection.moodDistribution ?? {})
                .filter(([, count]) => (count as number) > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([mood, count]) => (
                  <View
                    key={mood}
                    style={[s.pill, {
                      backgroundColor: MOOD_CONFIG[mood as MoodType]?.bg ?? 'transparent',
                      borderColor:     MOOD_CONFIG[mood as MoodType]?.border ?? Colors.border,
                    }]}
                  >
                    <Text style={s.pillText}>
                      {MOOD_EMOJI[mood] ?? ''} {mood} × {count as number}
                    </Text>
                  </View>
                ))}
            </View>

            {/* Reflection content */}
            <View style={s.cardBody}>
              <Text style={s.reflectionText}>{reflection.content}</Text>
            </View>

            {/* Footer */}
            <View style={s.cardFooter}>
              <Text style={s.footerMeta}>
                Generated{' '}
                {format(
                  new Date(reflection.generatedAt ?? reflection.createdAt),
                  'MMM d, h:mm a'
                )}
              </Text>
            </View>
          </View>
        )}

        {/* No reflection yet */}
        {!generating && !isLoading && !reflection && (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>✦</Text>
            <Text style={s.emptyTitle}>No reflection yet this week</Text>
            <Text style={s.emptyDesc}>
              Write a few journal entries this week, then generate your weekly reflection.
            </Text>
          </View>
        )}

        {/* Generate button */}
        <TouchableOpacity
          style={[s.generateBtn, { backgroundColor: config.hex }, generating && s.btnDisabled]}
          onPress={() => { haptics.medium(); generate(); }}
          disabled={generating}
        >
          {generating
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.generateBtnText}>
                {reflection ? 'Regenerate reflection' : 'Generate reflection'}
              </Text>
          }
        </TouchableOpacity>

        {/* Past reflections */}
        {allReflections.length > 1 && (
          <View style={s.pastSection}>
            <Text style={s.pastTitle}>Past reflections</Text>
            {allReflections.slice(1).map(r => (
              <View key={r._id} style={s.pastRow}>
                <View style={s.pastInfo}>
                  <Text style={s.pastDate}>
                    {format(new Date(r.weekStart), 'MMM d')} –{' '}
                    {format(new Date(r.weekEnd), 'MMM d')}
                  </Text>
                  <Text style={s.pastMeta}>
                    {r.entriesAnalyzed} entries
                    {r.dominantMood ? ` · ${MOOD_EMOJI[r.dominantMood]} ${r.dominantMood}` : ''}
                  </Text>
                </View>
                <Text style={s.pastArrow}>›</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  scroll:         { padding: Space[5], paddingBottom: 110 },
  pageLabel:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                    textTransform: 'uppercase', color: Colors.textGhost, marginBottom: 4 },
  pageTitle:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'],
                    color: Colors.textPrimary, letterSpacing: -0.5 },
  weekRange:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost,
                    marginTop: 4, marginBottom: Space[5] },
  card:           { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'],
                    borderWidth: 1, overflow: 'hidden', marginBottom: Space[4],
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: Space[3], padding: Space[4] },
  cardIcon:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardIconText:   { fontFamily: Fonts.mono, fontSize: FontSizes.base },
  cardHeaderInfo: { flex: 1 },
  cardLabel:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                    textTransform: 'uppercase' },
  cardDate:       { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: 2 },
  entriesCount:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  moodPills:      { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2],
                    paddingHorizontal: Space[4], paddingBottom: Space[3] },
  pill:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space[3],
                    paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  pillText:       { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5,
                    textTransform: 'uppercase', color: Colors.textMuted },
  cardBody:       { padding: Space[5], paddingTop: Space[2] },
  reflectionText: { fontFamily: Fonts.display, fontSize: FontSizes.md,
                    color: Colors.textSecondary, lineHeight: 30, fontStyle: 'italic' },
  cardFooter:     { padding: Space[4], paddingTop: 0 },
  footerMeta:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  generatingText: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, marginTop: Space[3],
                    letterSpacing: 1 },
  emptyCard:      { alignItems: 'center', paddingVertical: Space[12] },
  emptyIcon:      { fontFamily: Fonts.display, fontSize: 48, color: Colors.textGhost, marginBottom: Space[4] },
  emptyTitle:     { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg,
                    color: Colors.textPrimary, marginBottom: Space[2] },
  emptyDesc:      { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted,
                    textAlign: 'center', lineHeight: 22, maxWidth: 280, marginBottom: Space[8] },
  generateBtn:    { borderRadius: Radius.full, paddingVertical: Space[4],
                    alignItems: 'center', marginTop: Space[2] },
  btnDisabled:    { opacity: 0.6 },
  generateBtnText:{ fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  pastSection:    { marginTop: Space[6] },
  pastTitle:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.md,
                    color: Colors.textPrimary, marginBottom: Space[3] },
  pastRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                    padding: Space[4], marginBottom: Space[2],
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  pastInfo:       { gap: 3 },
  pastDate:       { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.textPrimary },
  pastMeta:       { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  pastArrow:      { fontFamily: Fonts.display, fontSize: 20, color: Colors.textGhost },
});