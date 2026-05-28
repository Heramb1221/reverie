import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { capsuleApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import {
  Colors, Fonts, FontSizes, Space, Radius,
  MOOD_CONFIG, type MoodType,
} from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { format } from 'date-fns';

interface CapsuleDetail {
  _id: string;
  title: string;
  content: string | null;
  mood: MoodType;
  unlockDate: string;
  createdAt: string;
  isLocked: boolean;
  openedAt?: string;
  images?: Array<{ url: string; publicId: string }>;
}

function getCapsuleCountdown(unlockDate: string): string {
  const diff = new Date(unlockDate).getTime() - Date.now();
  if (diff <= 0) return 'Ready to open';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export default function CapsuleDetailScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const insets    = useSafeAreaInsets();
  const qc        = useQueryClient();
  const haptics   = useHaptics();
  const { setMood } = useMoodStore();

  const { data, isLoading } = useQuery({
    queryKey: ['capsule-mobile', id],
    queryFn: async () => {
      const res = await capsuleApi.get(id as string);
      const c   = res.data.data.capsule as CapsuleDetail;
      if (c.mood) setMood(c.mood);
      return c;
    },
    enabled: !!id,
  });

  const { mutate: deleteCapsule, isPending: deleting } = useMutation({
    mutationFn: () => capsuleApi.delete(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capsules-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Capsule removed' });
      router.back();
    },
    onError: () => {
      haptics.error();
      Toast.show({ type: 'error', text1: 'Could not delete capsule' });
    },
  });

  if (isLoading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.sageDark} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.notFound}>Capsule not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[s.notFoundLink, { color: Colors.sageDark }]}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg      = MOOD_CONFIG[data.mood];
  const isLocked = data.isLocked;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { haptics.light(); router.back(); }}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => deleteCapsule()}
          disabled={deleting}
        >
          <Text style={s.deleteBtnText}>{deleting ? '…' : '🗑'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Status row */}
        <View style={s.statusRow}>
          <View style={[s.statusBadge, {
            backgroundColor: isLocked ? Colors.surfaceSunken : cfg.bg,
            borderColor:     isLocked ? Colors.border : cfg.border,
          }]}>
            <Text style={s.statusIcon}>{isLocked ? '🔒' : '🔓'}</Text>
            <Text style={[s.statusText, { color: isLocked ? Colors.textGhost : cfg.text }]}>
              {isLocked ? 'Sealed' : 'Unsealed'}
            </Text>
          </View>

          <View style={[s.moodBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={s.moodBadgeEmoji}>{cfg.emoji}</Text>
            <Text style={[s.moodBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>
          {stripHtml(data.title || '') || 'Memory capsule'}
        </Text>

        {/* Dates */}
        <Text style={s.dateMeta}>
          Written {format(new Date(data.createdAt), 'MMMM d, yyyy')} · Sealed until{' '}
          {format(new Date(data.unlockDate), 'MMMM d, yyyy')}
        </Text>

        {/* Locked state */}
        {isLocked ? (
          <View style={s.lockedCard}>
            <Text style={s.lockedIcon}>🔒</Text>
            <Text style={s.lockedTitle}>Still sealed</Text>
            <Text style={s.lockedSub}>
              This capsule opens on{' '}
              {format(new Date(data.unlockDate), 'MMMM d, yyyy')}.
            </Text>
            <Text style={[s.countdown, { color: cfg.hex }]}>
              {getCapsuleCountdown(data.unlockDate)}
            </Text>
          </View>
        ) : (
          <>
            {/* Unlocked content */}
            {data.openedAt === undefined && (
              <View style={[s.openedBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <Text style={[s.openedBannerText, { color: cfg.text }]}>
                  ✨ You're reading this for the first time
                </Text>
              </View>
            )}

            <View style={s.contentCard}>
              <Text style={s.contentText}>
                {data.content ? stripHtml(data.content) : ''}
              </Text>
            </View>

            {/* Images */}
            {data.images && data.images.length > 0 && (
              <View style={s.imagesSection}>
                <Text style={s.imagesLabel}>Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {data.images.map(img => (
                    <Image
                      key={img.publicId}
                      source={{ uri: img.url }}
                      style={s.image}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.surface },
  topBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: Space[5], paddingVertical: Space[3],
                      borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText:         { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  deleteBtn:        { padding: Space[2] },
  deleteBtnText:    { fontSize: 18 },
  scroll:           { padding: Space[5], paddingBottom: Space[16] },
  statusRow:        { flexDirection: 'row', gap: Space[2], marginBottom: Space[5] },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: Space[3], paddingVertical: Space[2],
                      borderRadius: Radius.full, borderWidth: 1 },
  statusIcon:       { fontSize: 12 },
  statusText:       { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1 },
  moodBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4,
                      paddingHorizontal: Space[3], paddingVertical: Space[2],
                      borderRadius: Radius.full, borderWidth: 1 },
  moodBadgeEmoji:   { fontSize: 12 },
  moodBadgeText:    { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  title:            { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'],
                      color: Colors.textPrimary, letterSpacing: -0.5,
                      lineHeight: 36, marginBottom: Space[2] },
  dateMeta:         { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost,
                      marginBottom: Space[6], lineHeight: 18 },
  lockedCard:       { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'],
                      padding: Space[10], alignItems: 'center',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },
  lockedIcon:       { fontSize: 48, marginBottom: Space[4] },
  lockedTitle:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl,
                      color: Colors.textPrimary, marginBottom: Space[2] },
  lockedSub:        { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted,
                      textAlign: 'center', lineHeight: 22, marginBottom: Space[4] },
  countdown:        { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, letterSpacing: -0.5 },
  openedBanner:     { borderRadius: Radius.lg, padding: Space[3], borderWidth: 1,
                      marginBottom: Space[4], flexDirection: 'row', alignItems: 'center' },
  openedBannerText: { fontFamily: Fonts.sans, fontSize: FontSizes.sm },
  contentCard:      { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'],
                      padding: Space[6], marginBottom: Space[5],
                      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },
  contentText:      { fontFamily: Fonts.display, fontSize: FontSizes.md,
                      color: Colors.textSecondary, lineHeight: 30, fontStyle: 'italic' },
  imagesSection:    { marginTop: Space[4] },
  imagesLabel:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                      textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[3] },
  image:            { width: 160, height: 120, borderRadius: Radius.lg, marginRight: Space[3] },
  notFound:         { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg,
                      color: Colors.textPrimary, marginBottom: Space[3] },
  notFoundLink:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1 },
});
