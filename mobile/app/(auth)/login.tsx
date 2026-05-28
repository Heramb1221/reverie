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

export default function LoginScreen() {
  const insets        = useSafeAreaInsets();
  const { login }     = useAuthStore();
  const haptics       = useHaptics();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: async (res) => {
      const { user, accessToken, refreshToken } = res.data.data as {
        user: import('../../store/authStore').User;
        accessToken: string;
        refreshToken: string;
      };
      await login(user, accessToken, refreshToken);
      haptics.success();
      Toast.show({ type: 'success', text1: `Welcome back, ${user.name.split(' ')[0]}` });
      router.replace((user.onboardingComplete ? '/(tabs)' : '/(auth)/onboarding') as `/${string}`);
    },
onError: (err: any) => {
  console.log('LOGIN ERROR');
  console.log('MESSAGE:', err.message);
  console.log('STATUS:', err.response?.status);
  console.log('DATA:', err.response?.data);

  haptics.error();

  const msg =
    err?.response?.data?.message ??
    'Login failed';

  Toast.show({
    type: 'error',
    text1: msg,
  });
},

  });

  const canSubmit = email.length > 0 && password.length > 0 && !isPending;

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoArea}>
          <Text style={s.logo}>Reverie</Text>
          <Text style={s.tagline}>A quiet space for your thoughts</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome back</Text>
          <Text style={s.cardSub}>Sign in to your journal</Text>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textGhost}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              style={s.input}
            />
          </View>

          {/* Password */}
          <View style={s.field}>
            <View style={s.labelRow}>
              <Text style={s.label}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as `/${string}`)}>
                <Text style={s.forgotLink}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={s.inputWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textGhost}
                secureTextEntry={!showPw}
                autoComplete="password"
                style={[s.input, { paddingRight: Space[10] }]}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                <Text style={s.eyeText}>{showPw ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, !canSubmit && s.btnDisabled]}
            onPress={() => { haptics.light(); mutate(); }}
            disabled={!canSubmit}
          >
            <Text style={s.btnText}>{isPending ? 'Signing in…' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>

        {/* Switch */}
        <TouchableOpacity style={s.switchRow} onPress={() => router.push('/(auth)/signup' as `/${string}`)}>
          <Text style={s.switchText}>No account? </Text>
          <Text style={[s.switchText, s.switchLink]}>Create one</Text>
        </TouchableOpacity>

        <Text style={s.encNote}>🔒 End-to-end encrypted</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.surface },
  scroll:    { flexGrow: 1, paddingHorizontal: Space[6], paddingBottom: Space[8], justifyContent: 'center' },
  logoArea:  { alignItems: 'center', marginBottom: Space[10] },
  logo:      { fontFamily: Fonts.display, fontSize: 40, color: Colors.textPrimary, letterSpacing: -1 },
  tagline:   { fontFamily: Fonts.display, fontSize: FontSizes.base, color: Colors.textMuted, marginTop: Space[1], fontStyle: 'italic' },
  card:      { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], padding: Space[6],
               shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 4 },
  cardTitle: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary, marginBottom: 4 },
  cardSub:   { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Space[6] },
  field:     { marginBottom: Space[4] },
  label:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[2] },
  labelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space[2] },
  forgotLink:{ fontFamily: Fonts.mono, fontSize: 10, color: Colors.sageDark, letterSpacing: 1 },
  inputWrap: { position: 'relative' },
  input:     { backgroundColor: Colors.surfaceSunken, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
               paddingHorizontal: Space[4], paddingVertical: Space[3],
               fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  eyeBtn:    { position: 'absolute', right: Space[4], top: 0, bottom: 0, justifyContent: 'center' },
  eyeText:   { fontSize: 16 },
  btn:       { backgroundColor: Colors.sageDark, borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[2] },
  btnDisabled:{ opacity: 0.5 },
  btnText:   { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Space[6] },
  switchText:{ fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted },
  switchLink:{ color: Colors.sageDark, fontFamily: Fonts.sansMedium },
  encNote:   { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[4], letterSpacing: 1 },
});
