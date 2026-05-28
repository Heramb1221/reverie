import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Fonts, FontSizes, Space, Radius } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';

const PW_RULES = [
  { label: '8+ chars',  test: (p: string) => p.length >= 8 },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number',    test: (p: string) => /\d/.test(p) },
];

export default function SignupScreen() {
  const insets    = useSafeAreaInsets();
  const { login } = useAuthStore();
  const haptics   = useHaptics();

  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [pw,     setPw]     = useState('');
  const [showPw, setShowPw] = useState(false);

  const strength = PW_RULES.filter(r => r.test(pw)).length;
  const allValid = strength === 3;

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.signup({ name, email, password: pw }),
    onSuccess: async (res) => {
      const { user, accessToken, refreshToken } = res.data.data as {
        user: import('../../store/authStore').User;
        accessToken: string;
        refreshToken: string;
      };
      await login(user, accessToken, refreshToken);
      haptics.success();
      Toast.show({ type: 'success', text1: 'Account created!' });
      router.replace('/(auth)/onboarding' as `/${string}`);
    },
    onError: (err: unknown) => {
      haptics.error();
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.show({ type: 'error', text1: msg ?? 'Could not create account' });
    },
  });

  const canSubmit = name.length > 0 && email.length > 0 && allValid && !isPending;

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.logoArea}>
          <Text style={s.logo}>Reverie</Text>
          <Text style={s.tagline}>Begin your emotional archive</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Create your journal</Text>
          <Text style={s.cardSub}>Private, encrypted, yours alone</Text>

          {/* Name */}
          <View style={s.field}>
            <Text style={s.label}>Your name</Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="What should we call you?"
              placeholderTextColor={Colors.textGhost}
              autoCapitalize="words" autoComplete="name"
              style={s.input}
            />
          </View>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textGhost}
              keyboardType="email-address" autoCapitalize="none"
              autoCorrect={false} autoComplete="email"
              style={s.input}
            />
          </View>

          {/* Password */}
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <TextInput
                value={pw} onChangeText={setPw}
                placeholder="••••••••"
                placeholderTextColor={Colors.textGhost}
                secureTextEntry={!showPw}
                autoComplete="new-password"
                style={[s.input, { paddingRight: Space[10] }]}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                <Text style={s.eyeText}>{showPw ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            {pw.length > 0 && (
              <View style={s.strengthArea}>
                <View style={s.strengthBar}>
                  {[0, 1, 2].map(i => (
                    <View
                      key={i}
                      style={[
                        s.seg,
                        i < strength && {
                          backgroundColor:
                            strength === 1 ? '#EF4444'
                            : strength === 2 ? '#F59E0B'
                            : Colors.sage,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={s.rules}>
                  {PW_RULES.map(r => (
                    <Text
                      key={r.label}
                      style={[s.ruleText, r.test(pw) && { color: Colors.sageDark }]}
                    >
                      {r.test(pw) ? '✓ ' : '· '}{r.label}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[s.btn, !canSubmit && s.btnDisabled]}
            onPress={() => { haptics.light(); mutate(); }}
            disabled={!canSubmit}
          >
            <Text style={s.btnText}>
              {isPending ? 'Creating account…' : 'Create my journal'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.switchRow} onPress={() => router.push('/(auth)/login' as `/${string}`)}>
          <Text style={s.switchText}>Already have an account? </Text>
          <Text style={[s.switchText, s.switchLink]}>Sign in</Text>
        </TouchableOpacity>

        <Text style={s.encNote}>🔒 End-to-end encrypted</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.surface },
  scroll:       { flexGrow: 1, paddingHorizontal: Space[6], paddingBottom: Space[8], justifyContent: 'center' },
  logoArea:     { alignItems: 'center', marginBottom: Space[8] },
  logo:         { fontFamily: Fonts.display, fontSize: 38, color: Colors.textPrimary, letterSpacing: -1 },
  tagline:      { fontFamily: Fonts.display, fontSize: FontSizes.base, color: Colors.textMuted, marginTop: Space[1], fontStyle: 'italic' },
  card:         { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], padding: Space[6],
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 4 },
  cardTitle:    { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary, marginBottom: 4 },
  cardSub:      { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Space[5] },
  field:        { marginBottom: Space[4] },
  label:        { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[2] },
  inputWrap:    { position: 'relative' },
  input:        { backgroundColor: Colors.surfaceSunken, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
                  paddingHorizontal: Space[4], paddingVertical: Space[3],
                  fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  eyeBtn:       { position: 'absolute', right: Space[4], top: 0, bottom: 0, justifyContent: 'center' },
  eyeText:      { fontSize: 16 },
  strengthArea: { marginTop: Space[2], gap: Space[2] },
  strengthBar:  { flexDirection: 'row', gap: 4 },
  seg:          { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  rules:        { flexDirection: 'row', gap: Space[3] },
  ruleText:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  btn:          { backgroundColor: Colors.sageDark, borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[2] },
  btnDisabled:  { opacity: 0.5 },
  btnText:      { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  switchRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: Space[6] },
  switchText:   { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted },
  switchLink:   { color: Colors.sageDark, fontFamily: Fonts.sansMedium },
  encNote:      { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[4], letterSpacing: 1 },
});
