import { 
  View, 
  Text, 
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform
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

export default function ProfileScreen() {
  const insets         = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { activeMood } = useMoodStore();
  const config         = MOOD_CONFIG[activeMood || 'Calm'];
  const haptics        = useHaptics();
  const { enabled: biometricEnabled, supported, enrolled, toggleBiometric } = useBiometric();

  const { data: statsData } = useQuery({
    queryKey: ['stats-mobile'],
    queryFn:  () => journalApi.stats(),
  });
  const stats = statsData?.data?.data?.stats || {};

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try { 
              await authApi.logout(); 
            } catch {}
            await logout();
            haptics.medium();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    haptics.light();
    await toggleBiometric(value);
    Toast.show({
      type: 'success',
      text1: value ? 'Biometric lock enabled' : 'Biometric lock disabled',
    });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const Row = ({
    label, value, onPress, danger, last,
  }: { label: string; value?: string; onPress?: () => void; danger?: boolean; last?: boolean }) => (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + Space[4] }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: config.hex }]}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'R'}</Text>
          </View>
          <Text style={styles.nameText}>{user?.name}</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
          {user?.createdAt && (
            <Text style={styles.memberSince}>
              Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Entries',   value: String(stats.totalEntries  ?? '—') },
            { label: 'Streak',    value: stats.currentStreak ? `${stats.currentStreak}d` : '—' },
            { label: 'Words',     value: stats.totalWords ? `${Math.round(stats.totalWords / 1000)}k` : '—' },
            { label: 'Avg words', value: stats.avgWordsPerEntry ? `${stats.avgWordsPerEntry}` : '—' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Security */}
        {supported && enrolled && (
          <Section title="Security">
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={styles.rowLabel}>Biometric lock</Text>
                <Text style={styles.rowMeta}>Require Face ID / fingerprint to open</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: Colors.border, true: `${config.hex}60` }}
                thumbColor={biometricEnabled ? config.hex : Colors.textGhost}
              />
            </View>
          </Section>
        )}

        {/* Account */}
        <Section title="Account">
          <Row label="Edit profile"   onPress={() => Toast.show({ type: 'info', text1: 'Profile modifications coming soon' })} />
          <Row label="Settings"       onPress={() => Toast.show({ type: 'info', text1: 'Settings management coming soon' })} />
          <Row label="Export data"    onPress={() => Toast.show({ type: 'info', text1: 'Export coming soon' })} last />
        </Section>

        {/* Sign out */}
        <Section title="Session">
          <Row label="Sign out" onPress={handleLogout} danger last />
        </Section>

        <Text style={styles.version}>Reverie v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Space[6], paddingBottom: 120 },

  avatarSection: { alignItems: 'center', marginBottom: Space[6] },
  avatar:        { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Space[3] },
  avatarText:    { fontFamily: Fonts.displayMedium, fontSize: 32, color: '#fff' },
  nameText:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary },
  emailText:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, marginTop: 4, letterSpacing: 0.5 },
  memberSince:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[2] },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3], marginBottom: Space[6] },
  statCard:  { flex: 1, minWidth: '45%', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Space[4], alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8 }, android: { elevation: 1 }, web: { boxShadow: '0px 1px 8px rgba(0,0,0,0.04)' } }) },
  statValue: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary },
  statLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.textGhost, marginTop: 4 },

  section:      { marginBottom: Space[6] },
  sectionTitle: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[2], marginLeft: Space[1] },
  sectionCard:  { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8 }, android: { elevation: 1 }, web: { boxShadow: '0px 1px 8px rgba(0,0,0,0.04)' } }) },

  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space[4], paddingVertical: Space[4] },
  rowBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel:      { flex: 1, fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  rowLabelDanger:{ color: '#EF4444' },
  rowValue:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, marginRight: Space[2] },
  rowArrow:      { fontFamily: Fonts.display, fontSize: 20, color: Colors.textGhost },
  rowMeta:       { fontFamily: Fonts.sansLight, fontSize: FontSizes.xs, color: Colors.textGhost, marginTop: 2 },

  version: { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[4] },
});