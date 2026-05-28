import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { capsuleApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import {
  Colors, Fonts, FontSizes, Space, Radius,
  MOOD_CONFIG, MOOD_EMOJI, type MoodType,
} from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { format } from 'date-fns';
import CreateCapsuleModal from '../../components/capsule/CreateCapsuleModal';

interface Capsule {
  _id: string;
  title: string;
  mood: MoodType;
  unlockDate: string;
  createdAt: string;
  isLocked: boolean;
  openedAt?: string;
}

function getCapsuleCountdown(unlockDate: string): string {
  const diff = new Date(unlockDate).getTime() - Date.now();
  if (diff <= 0) return 'Ready to open';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function CapsuleRow({ capsule, onDelete }: { capsule: Capsule; onDelete: () => void }) {
  const cfg = MOOD_CONFIG[capsule.mood];
  const haptics = useHaptics();

  return (
    <TouchableOpacity
      style={[s.capsuleCard, !capsule.isLocked && s.capsuleCardUnlocked]}
      onPress={() => router.push(`/capsules/${capsule._id}` as `/${string}`)}
      activeOpacity={0.85}
    >
      <View style={[s.capsuleIcon, { backgroundColor: cfg.bg }]}>
        <Text style={s.capsuleIconText}>{capsule.isLocked ? '🔒' : '✨'}</Text>
      </View>

      <View style={s.capsuleInfo}>
        <Text style={s.capsuleTitle} numberOfLines={1}>
          {stripHtml(capsule.title) || 'Untitled capsule'}
        </Text>
        <View style={[s.capsuleBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[s.capsuleBadgeText, { color: cfg.text }]}>
            {cfg.emoji} {cfg.label}
          </Text>
        </View>
        <View style={s.capsuleMeta}>
          <Text style={s.capsuleMetaText}>
            {capsule.isLocked ? '🔒' : '🔓'}{' '}
            {capsule.isLocked
              ? `Opens in ${getCapsuleCountdown(capsule.unlockDate)}`
              : `Ready · ${format(new Date(capsule.unlockDate), 'MMM d, yyyy')}`
            }
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={s.deleteBtn}
        onPress={() => {
          haptics.light();
          Alert.alert('Delete capsule', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]);
        }}
      >
        <Text style={s.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function CapsulesScreen() {
  const insets   = useSafeAreaInsets();
  const { activeMood } = useMoodStore();
  const config   = MOOD_CONFIG[activeMood];
  const haptics  = useHaptics();
  const qc       = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['capsules-mobile'],
    queryFn:  () => capsuleApi.list(),
  });

  const { mutate: deleteCapsule } = useMutation({
    mutationFn: (id: string) => capsuleApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capsules-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Capsule removed' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Could not delete capsule' }),
  });

  const capsules: Capsule[] = (data?.data?.data?.capsules as Capsule[]) ?? [];
  const locked   = capsules.filter(c => c.isLocked);
  const unlocked = capsules.filter(c => !c.isLocked);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Memory Capsules</Text>
        <TouchableOpacity
          style={[s.newBtn, { backgroundColor: config.hex }]}
          onPress={() => { haptics.light(); setShowCreate(true); }}
        >
          <Text style={s.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={config.hex} style={{ marginTop: Space[10] }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Sealed */}
          {locked.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionIcon}>🔒</Text>
                <Text style={[s.sectionLabel, { color: config.hex }]}>Sealed</Text>
              </View>
              {locked.map(c => (
                <CapsuleRow key={c._id} capsule={c} onDelete={() => deleteCapsule(c._id)} />
              ))}
            </View>
          )}

          {/* Ready to open */}
          {unlocked.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionIcon}>✨</Text>
                <Text style={[s.sectionLabel, { color: Colors.sageDark }]}>Ready to open</Text>
              </View>
              {unlocked.map(c => (
                <CapsuleRow key={c._id} capsule={c} onDelete={() => deleteCapsule(c._id)} />
              ))}
            </View>
          )}

          {/* Empty */}
          {capsules.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔒</Text>
              <Text style={s.emptyTitle}>No capsules yet</Text>
              <Text style={s.emptySub}>
                Write a letter to your future self. Seal it. Come back when the time is right.
              </Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: config.hex }]}
                onPress={() => { haptics.light(); setShowCreate(true); }}
              >
                <Text style={s.emptyBtnText}>Create your first capsule</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateCapsuleModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['capsules-mobile'] });
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.surface },
  topBar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: Space[5], paddingVertical: Space[3],
                        borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText:           { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  topTitle:           { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary },
  newBtn:             { paddingHorizontal: Space[3], paddingVertical: Space[2], borderRadius: Radius.full },
  newBtnText:         { fontFamily: Fonts.sansMedium, fontSize: FontSizes.xs, color: '#fff' },
  scroll:             { padding: Space[5], paddingBottom: Space[10] },
  section:            { marginBottom: Space[5] },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: Space[2], marginBottom: Space[3] },
  sectionIcon:        { fontSize: 14 },
  sectionLabel:       { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  capsuleCard:        { flexDirection: 'row', alignItems: 'center', gap: Space[3],
                        backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
                        padding: Space[4], marginBottom: Space[3],
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  capsuleCardUnlocked:{ borderWidth: 1, borderColor: `${Colors.sageDark}30` },
  capsuleIcon:        { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  capsuleIconText:    { fontSize: 20 },
  capsuleInfo:        { flex: 1, gap: Space[1] },
  capsuleTitle:       { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: Colors.textPrimary },
  capsuleBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                        paddingHorizontal: Space[2], paddingVertical: 3,
                        borderRadius: Radius.full, borderWidth: 1 },
  capsuleBadgeText:   { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  capsuleMeta:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  capsuleMetaText:    { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  deleteBtn:          { padding: Space[2] },
  deleteBtnText:      { fontSize: 16 },
  empty:              { alignItems: 'center', paddingVertical: Space[12], paddingHorizontal: Space[6] },
  emptyIcon:          { fontSize: 48, marginBottom: Space[4] },
  emptyTitle:         { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg,
                        color: Colors.textPrimary, marginBottom: Space[2] },
  emptySub:           { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted,
                        textAlign: 'center', lineHeight: 22, marginBottom: Space[6] },
  emptyBtn:           { paddingHorizontal: Space[6], paddingVertical: Space[3], borderRadius: Radius.full },
  emptyBtnText:       { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },
});
