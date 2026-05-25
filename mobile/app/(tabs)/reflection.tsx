import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reflectionApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG } from '../../lib/theme';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { useHaptics } from '../../hooks/useHaptics';

export default function ReflectionScreen() {
  const insets   = useSafeAreaInsets();
  const { activeMood } = useMoodStore();
  const config   = MOOD_CONFIG[activeMood];
  const qc       = useQueryClient();
  const haptics  = useHaptics();

  const { data, isLoading } = useQuery({
    queryKey: ['reflection-latest-mobile'],
    queryFn:  () => reflectionApi.latest(),
  });

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: () => reflectionApi.generate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reflection-latest-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Your reflection is ready' });
    },
    onError: (err: any) => {
      haptics.error();
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Could not generate reflection' });
    },
  });

  const reflection = data?.data?.data?.reflection;

  return (
    <View style={[styles.root, { paddingTop: insets.top + Space[4] }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Your AI companion</Text>
        <Text style={styles.title}>Weekly Reflection</Text>

        {isLoading ? (
          <ActivityIndicator color={config.hex} style={{ marginTop: Space[10] }} />
        ) : reflection ? (
          <View style={[styles.card, { borderColor: `${config.hex}25` }]}>
            <View style={[styles.cardHeader, { backgroundColor: `${config.hex}12` }]}>
              <View style={[styles.icon, { backgroundColor: `${config.hex}20` }]}>
                <Text style={styles.iconText}>✦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, { color: config.hex }]}>Reverie reflects</Text>
                <Text style={styles.cardDate}>
                  {format(new Date(reflection.weekStart), 'MMM d')} – {format(new Date(reflection.weekEnd), 'MMM d, yyyy')}
                </Text>
              </View>
              <Text style={styles.entriesCount}>{reflection.entriesAnalyzed} entries</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.reflectionText}>{reflection.content}</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerMeta}>
                Generated {format(new Date(reflection.generatedAt || reflection.createdAt), 'MMM d, h:mm a')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>No reflection yet</Text>
            <Text style={styles.emptyDesc}>Write a few journal entries this week, then generate your reflection.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: config.hex }, generating && styles.btnDisabled]}
          onPress={() => { haptics.medium(); generate(); }}
          disabled={generating}
        >
          {generating
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.generateBtnText}>{reflection ? 'Regenerate' : 'Generate reflection'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Space[5], paddingBottom: 100 },
  label:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: 4 },
  title:  { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'], color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Space[6] },

  card:         { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], borderWidth: 1, overflow: 'hidden', marginBottom: Space[4], shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: Space[3], padding: Space[4] },
  icon:         { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconText:     { fontFamily: Fonts.mono, fontSize: FontSizes.base, color: Colors.sageDark },
  cardLabel:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  cardDate:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: 2 },
  entriesCount: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  cardBody:     { padding: Space[5], paddingTop: Space[2] },
  reflectionText: { fontFamily: Fonts.displayItalic, fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 30 },
  cardFooter:   { padding: Space[4], paddingTop: 0 },
  footerMeta:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },

  empty:      { alignItems: 'center', paddingVertical: Space[12] },
  emptyIcon:  { fontFamily: Fonts.display, fontSize: 48, color: Colors.textGhost, marginBottom: Space[4] },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary, marginBottom: Space[2] },
  emptyDesc:  { fontFamily: Fonts.sansLight, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 260, marginBottom: Space[8] },

  generateBtn:     { borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[2] },
  btnDisabled:     { opacity: 0.6 },
  generateBtnText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
});
