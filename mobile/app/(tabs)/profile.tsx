import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { journalApi, authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useMoodStore } from '../../store/moodStore';
import { useBiometric } from '../../hooks/useBiometric';
import { useHaptics } from '../../hooks/useHaptics';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG } from '../../lib/theme';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

interface Stats {
  totalEntries?: number;
  currentStreak?: number;
  totalWords?: number;
  avgWordsPerEntry?: number;
  moodDistribution?: Record<string, number>;
}

export default function ProfileScreen() {
  const insets    = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { activeMood }   = useMoodStore();
  const config    = MOOD_CONFIG[activeMood];
  const haptics   = useHaptics();
  const { enabled: biometricEnabled, supported, enrolled, toggleBiometric } = useBiometric();

  const { data: statsData } = useQuery({
    queryKey: ['stats-mobile'],
    queryFn:  () => journalApi.stats(),
  });
  const stats: Stats = (statsData?.data?.data?.stats as Stats) ?? {};

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try { await authApi.logout({}); } catch { /* ignore */ }
          await logout();
          haptics.medium();
          router.replace('/(auth)/login' as `/${string}`);
        },
      },
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    haptics.light();
    await toggleBiometric(value);
    Toast.show({
      type: 'success',
      text1: value ? 'Biometric lock enabled' : 'Biometric lock disabled',
    });
  };

  // Dominant mood
  const dominantMood = stats.moodDistribution
    ? Object.entries(stats.moodDistribution)
        .sort(([, a], [, b]) => b - a)[0]?.[0] ?? null
    : null;

  return (
    <View style={[s.root, { paddingTop: insets.top + Space[4] }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <Text style={s.pageLabel}>Your journal identity</Text>
        <Text style={s.pageTitle}>Profile</Text>

        {/* Avatar + name */}
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: config.hex }]}>
            <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'R'}</Text>
          </View>
          <Text style={s.nameText}>{user?.name ?? ''}</Text>
          <Text style={s.emailText}>{user?.email ?? ''}</Text>
          {user?.createdAt && (
            <Text style={s.memberSince}>
              Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {[
            { label: 'Entries',   value: String(stats.totalEntries ?? '—') },
            { label: 'Streak',    value: stats.currentStreak ? `${stats.currentStreak}d` : '—' },
            { label: 'Words',     value: stats.totalWords ? `${Math.round(stats.totalWords / 1000)}k` : '—' },
            { label: 'Avg words', value: stats.avgWordsPerEntry ? `${stats.avgWordsPerEntry}` : '—' },
          ].map(stat => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Dominant mood */}
        {dominantMood && MOOD_CONFIG[dominantMood as keyof typeof MOOD_CONFIG] && (
          <View style={[s.dominantCard, {
            backgroundColor: MOOD_CONFIG[dominantMood as keyof typeof MOOD_CONFIG].bg,
            borderColor:     MOOD_CONFIG[dominantMood as keyof typeof MOOD_CONFIG].border,
          }]}>
            <Text style={s.dominantIcon}>
              {MOOD_CONFIG[dominantMood as keyof typeof MOOD_CONFIG].emoji}
            </Text>
            <View>
              <Text style={[s.dominantTitle, { color: MOOD_CONFIG[dominantMood as keyof typeof MOOD_CONFIG].text }]}>
                Most felt: {dominantMood}
              </Text>
              <Text style={s.dominantMeta}>
                {stats.moodDistribution?.[dominantMood] ?? 0} entries
              </Text>
            </View>
          </View>
        )}

        {/* Security */}
        {supported && enrolled && (
          <View style={s.sectionBox}>
            <Text style={s.sectionLabel}>Security</Text>
            <View style={s.card}>
              <View style={s.rowBetween}>
                <View style={s.rowLeft}>
                  <Text style={s.rowTitle}>Biometric lock</Text>
                  <Text style={s.rowSub}>Require Face ID / fingerprint to open</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: Colors.border, true: `${config.hex}80` }}
                  thumbColor={biometricEnabled ? config.hex : Colors.textGhost}
                />
              </View>
            </View>
          </View>
        )}

        {/* Account */}
        <View style={s.sectionBox}>
          <Text style={s.sectionLabel}>Account</Text>
          <View style={s.card}>
            {[
              { label: 'Settings',    onPress: () => router.push('/settings' as `/${string}`) },
              { label: 'Capsules',    onPress: () => router.push('/capsules' as `/${string}`) },
              { label: 'Search',      onPress: () => router.push('/search' as `/${string}`), last: false },
              { label: 'Export data', onPress: () => Toast.show({ type: 'info', text1: 'Export coming soon' }), last: true },
            ].map((row, i, arr) => (
              <TouchableOpacity
                key={row.label}
                style={[s.row, i < arr.length - 1 && s.rowBorder]}
                onPress={row.onPress}
              >
                <Text style={s.rowTitle}>{row.label}</Text>
                <Text style={s.rowArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <View style={s.sectionBox}>
          <Text style={s.sectionLabel}>Session</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.row} onPress={handleLogout}>
              <Text style={[s.rowTitle, { color: '#EF4444' }]}>Sign out</Text>
              <Text style={s.rowArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.version}>Reverie v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  scroll:        { padding: Space[5], paddingBottom: 110 },
  pageLabel:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                   textTransform: 'uppercase', color: Colors.textGhost, marginBottom: 4 },
  pageTitle:     { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'],
                   color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Space[5] },
  avatarSection: { alignItems: 'center', marginBottom: Space[6] },
  avatar:        { width: 72, height: 72, borderRadius: 20, alignItems: 'center',
                   justifyContent: 'center', marginBottom: Space[3] },
  avatarText:    { fontFamily: Fonts.displayMedium, fontSize: 32, color: '#fff' },
  nameText:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary },
  emailText:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost,
                   marginTop: 4, letterSpacing: 0.5 },
  memberSince:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[2] },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3], marginBottom: Space[4] },
  statCard:      { width: '47%', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                   padding: Space[4], alignItems: 'center',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  statValue:     { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary },
  statLabel:     { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5,
                   textTransform: 'uppercase', color: Colors.textGhost, marginTop: 4 },
  dominantCard:  { flexDirection: 'row', alignItems: 'center', gap: Space[3],
                   borderRadius: Radius.xl, padding: Space[4], borderWidth: 1, marginBottom: Space[4] },
  dominantIcon:  { fontSize: 28 },
  dominantTitle: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm },
  dominantMeta:  { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  sectionBox:    { marginBottom: Space[4] },
  sectionLabel:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                   textTransform: 'uppercase', color: Colors.textGhost,
                   marginBottom: Space[2], marginLeft: Space[1] },
  card:          { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, overflow: 'hidden',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: Space[4], paddingVertical: Space[4] },
  rowBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowBetween:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: Space[4], paddingVertical: Space[4] },
  rowLeft:       { flex: 1, gap: 3 },
  rowTitle:      { fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  rowSub:        { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.textGhost },
  rowArrow:      { fontFamily: Fonts.display, fontSize: 20, color: Colors.textGhost },
  version:       { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10,
                   color: Colors.textGhost, marginTop: Space[4] },
});
