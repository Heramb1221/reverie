import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Fonts, FontSizes, Space, Radius } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const loginSuccess = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: async (res) => {
      const { user, accessToken, refreshToken } = res.data.data;
      await loginSuccess(user, accessToken, refreshToken);
      haptics.success();
      Toast.show({ type: 'success', text1: `Welcome back, ${user.name.split(' ')[0]}` });
      router.replace(user.onboardingComplete ? '/(tabs)' : '/(auth)/onboarding');
    },
    onError: (err: any) => {
      haptics.error();
      const msg = err?.response?.data?.message || 'Login failed. Please try again.';
      Toast.show({ type: 'error', text1: 'Authentication Error', text2: msg });
    },
  });

  const handlePressSubmit = () => {
    haptics.light();
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill in all inputs.' });
      return;
    }
    mutate();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.logoArea}>
          <Text style={styles.logo}>Reverie</Text>
          <Text style={styles.tagline}>A quiet space for your thoughts</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your journal</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textGhost}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textGhost}
                  secureTextEntry={!showPw}
                  autoComplete="current-password"
                  style={[styles.input, { paddingRight: Space[10] }]}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)}>
                  <Text style={styles.eyeText}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
              onPress={handlePressSubmit}
              activeOpacity={0.7}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.switchRow} onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.switchText}>No account? </Text>
          <Text style={[styles.switchText, styles.switchLink]}>Create one</Text>
        </TouchableOpacity>

        <Text style={styles.encryption}>🔒 End-to-end encrypted</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { flexGrow: 1, padding: Space[6], justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: Space[10] },
  logo:     { fontFamily: Fonts.display, fontSize: 40, color: Colors.textPrimary, letterSpacing: -1 },
  tagline:  { fontFamily: Fonts.displayItalic, fontSize: FontSizes.base, color: Colors.textMuted, marginTop: Space[1] },
  card:      { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], padding: Space[6], elevation: 4, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 24 } }) },
  cardTitle: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary, marginBottom: 4 },
  cardSub:   { fontFamily: Fonts.sansLight, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Space[6] },
  form:     { gap: Space[4] },
  field:    { gap: Space[2] },
  label:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.sageDark, letterSpacing: 1 },
  inputWrapper: { position: 'relative' },
  input: {
    backgroundColor: Colors.surfaceSunken,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Space[4], paddingVertical: Space[3],
    fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary,
  },
  eyeBtn:  { position: 'absolute', right: Space[4], top: '50%', transform: [{ translateY: -10 }] },
  eyeText: { fontSize: 16 },
  submitBtn:         { backgroundColor: Colors.sageDark, borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[2], minHeight: 48, justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText:        { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Space[6], paddingVertical: 8 },
  switchText: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted },
  switchLink: { color: Colors.sageDark, fontFamily: Fonts.sansMedium },
  encryption: { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[4], letterSpacing: 1 },
});