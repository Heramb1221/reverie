import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { userApi, authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useMoodStore } from '../store/moodStore';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG } from '../lib/theme';
import { useHaptics } from '../hooks/useHaptics';

export default function SettingsScreen() {
  const insets  = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuthStore();
  const { activeMood } = useMoodStore();
  const config  = MOOD_CONFIG[activeMood];
  const haptics = useHaptics();

  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? false);
  const [frequency,     setFrequency]     = useState(user?.reminderFrequency ?? 'every3days');
  const [theme,         setTheme]         = useState<'light' | 'dark'>(user?.theme ?? 'light');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput,       setDeleteInput]       = useState('');

  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: () => userApi.updateProfile({ notificationsEnabled: notifications, reminderFrequency: frequency, theme }),
    onSuccess: () => {
      updateUser({ notificationsEnabled: notifications, reminderFrequency: frequency, theme });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Settings saved' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Could not save settings' }),
  });

  const { mutate: deleteAccount, isPending: deleting } = useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: async () => {
      await logout();
      router.replace('/(auth)/login' as `/${string}`);
      Toast.show({ type: 'success', text1: 'Account deleted' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Could not delete account' }),
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Settings</Text>
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: config.hex }, saving && s.btnDisabled]}
          onPress={() => { haptics.light(); saveSettings(); }}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Appearance</Text>
          <View style={s.card}>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.rowTitle}>Theme</Text>
                <Text style={s.rowSub}>Light or dark mode</Text>
              </View>
              <View style={s.themeToggle}>
                {(['light', 'dark'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.themeBtn, theme === t && { backgroundColor: config.hex }]}
                    onPress={() => { haptics.select(); setTheme(t); }}
                  >
                    <Text style={[s.themeBtnText, theme === t && { color: '#fff' }]}>
                      {t === 'light' ? '☀️' : '🌙'} {t === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Notifications</Text>
          <View style={s.card}>
            <View style={[s.rowBetween, notifications && s.rowBorder]}>
              <View style={s.rowLeft}>
                <Text style={s.rowTitle}>Gentle reminders</Text>
                <Text style={s.rowSub}>Email nudges when you haven't written</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={v => { haptics.select(); setNotifications(v); }}
                trackColor={{ false: Colors.border, true: `${config.hex}80` }}
                thumbColor={notifications ? config.hex : Colors.textGhost}
              />
            </View>

            {notifications && (
              <View style={s.freqSection}>
                <Text style={s.freqLabel}>Reminder frequency</Text>
                {[
                  { value: 'daily',      label: 'Every day' },
                  { value: 'every3days', label: 'Every 3 days' },
                  { value: 'weekly',     label: 'Once a week' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.freqRow, frequency === opt.value && {
                      backgroundColor: `${config.hex}12`,
                      borderColor: config.hex,
                    }]}
                    onPress={() => { haptics.select(); setFrequency(opt.value as typeof frequency); }}
                  >
                    <View style={[s.radio, frequency === opt.value && { borderColor: config.hex }]}>
                      {frequency === opt.value && <View style={[s.radioDot, { backgroundColor: config.hex }]} />}
                    </View>
                    <Text style={[s.freqText, frequency === opt.value && { color: Colors.textPrimary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Data */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Data</Text>
          <View style={s.card}>
            <TouchableOpacity
              style={s.row}
              onPress={() => Toast.show({ type: 'info', text1: 'Export coming soon' })}
            >
              <Text style={s.rowTitle}>Export my data</Text>
              <Text style={s.rowArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: '#EF4444' }]}>Danger zone</Text>
          <View style={[s.card, { borderColor: 'rgba(239,68,68,0.2)', borderWidth: 1 }]}>
            {!showDeleteConfirm ? (
              <TouchableOpacity style={s.row} onPress={() => setShowDeleteConfirm(true)}>
                <Text style={[s.rowTitle, { color: '#EF4444' }]}>Delete my account</Text>
                <Text style={s.rowArrow}>›</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.deleteConfirm}>
                <Text style={s.deleteWarning}>
                  This will permanently delete your account and all journal entries. This cannot be undone.
                </Text>
                <Text style={s.deleteLabel}>
                  Type <Text style={{ color: '#EF4444', fontFamily: Fonts.mono }}>DELETE</Text> to confirm
                </Text>
                <View style={s.deleteInput}>
                  <Text style={s.deleteInputText}>{deleteInput}</Text>
                </View>
                {/* Simple keypad for DELETE confirmation */}
                <View style={s.letterGrid}>
                  {'DELETE'.split('').map((letter, i) => (
                    <TouchableOpacity
                      key={`${letter}-${i}`}
                      style={s.letterBtn}
                      onPress={() => setDeleteInput(prev =>
                        prev.length < 6 ? prev + letter : prev
                      )}
                    >
                      <Text style={s.letterBtnText}>{letter}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={s.letterBtn}
                    onPress={() => setDeleteInput(prev => prev.slice(0, -1))}
                  >
                    <Text style={s.letterBtnText}>⌫</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.deleteActions}>
                  <TouchableOpacity
                    style={s.cancelBtn}
                    onPress={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  >
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.confirmBtn, (deleteInput !== 'DELETE' || deleting) && s.btnDisabled]}
                    onPress={() => deleteAccount()}
                    disabled={deleteInput !== 'DELETE' || deleting}
                  >
                    <Text style={s.confirmBtnText}>{deleting ? 'Deleting…' : 'Delete forever'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <Text style={s.version}>Reverie v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: Space[5], paddingVertical: Space[3],
                   borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  topTitle:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary },
  saveBtn:       { paddingHorizontal: Space[4], paddingVertical: Space[2], borderRadius: Radius.full },
  btnDisabled:   { opacity: 0.5 },
  saveBtnText:   { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },
  scroll:        { padding: Space[5], paddingBottom: Space[16] },
  section:       { marginBottom: Space[5] },
  sectionLabel:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                   textTransform: 'uppercase', color: Colors.textGhost,
                   marginBottom: Space[2], marginLeft: Space[1] },
  card:          { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, overflow: 'hidden',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: Space[4], paddingVertical: Space[4] },
  rowBetween:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: Space[4], paddingVertical: Space[4] },
  rowBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLeft:       { flex: 1, gap: 3 },
  rowTitle:      { fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  rowSub:        { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.textGhost },
  rowArrow:      { fontFamily: Fonts.display, fontSize: 20, color: Colors.textGhost },
  themeToggle:   { flexDirection: 'row', backgroundColor: Colors.surfaceSunken,
                   borderRadius: Radius.md, padding: 2, gap: 2 },
  themeBtn:      { paddingHorizontal: Space[3], paddingVertical: Space[2], borderRadius: Radius.sm },
  themeBtnText:  { fontFamily: Fonts.sansMedium, fontSize: FontSizes.xs, color: Colors.textMuted },
  freqSection:   { paddingHorizontal: Space[4], paddingBottom: Space[4] },
  freqLabel:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1.5,
                   textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[3] },
  freqRow:       { flexDirection: 'row', alignItems: 'center', gap: Space[3],
                   paddingHorizontal: Space[4], paddingVertical: Space[3],
                   borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Space[2] },
  radio:         { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border,
                   alignItems: 'center', justifyContent: 'center' },
  radioDot:      { width: 8, height: 8, borderRadius: 4 },
  freqText:      { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted },
  deleteConfirm: { padding: Space[4], gap: Space[3] },
  deleteWarning: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20 },
  deleteLabel:   { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textPrimary },
  deleteInput:   { backgroundColor: Colors.surfaceSunken, borderRadius: Radius.md, borderWidth: 1,
                   borderColor: 'rgba(239,68,68,0.3)', padding: Space[3], minHeight: 44,
                   justifyContent: 'center' },
  deleteInputText:{ fontFamily: Fonts.mono, fontSize: FontSizes.base, color: Colors.textPrimary,
                    letterSpacing: 2 },
  letterGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] },
  letterBtn:     { paddingHorizontal: Space[3], paddingVertical: Space[2], borderRadius: Radius.md,
                   backgroundColor: Colors.surfaceSunken, borderWidth: 1, borderColor: Colors.border },
  letterBtnText: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.textPrimary },
  deleteActions: { flexDirection: 'row', gap: Space[3] },
  cancelBtn:     { flex: 1, paddingVertical: Space[3], borderRadius: Radius.lg,
                   backgroundColor: Colors.surfaceSunken, alignItems: 'center' },
  cancelBtnText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.textMuted },
  confirmBtn:    { flex: 1, paddingVertical: Space[3], borderRadius: Radius.lg,
                   backgroundColor: '#EF4444', alignItems: 'center' },
  confirmBtnText:{ fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },
  version:       { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10,
                   color: Colors.textGhost, marginTop: Space[4] },
});
