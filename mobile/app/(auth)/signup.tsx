import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
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
  const insets  = useSafeAreaInsets();
  const { login } = useAuthStore();
  const haptics = useHaptics();

  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [pw,     setPw]     = useState('');
  const [showPw, setShowPw] = useState(false);

  const strength = PW_RULES.filter(r => r.test(pw)).length;
  const allValid = strength === 3;

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.signup({ name, email, password: pw }),
    onSuccess: async (res) => {
      const { user, accessToken, refreshToken } = res.data.data;
      await login(user, accessToken, refreshToken);
      haptics.success();
      Toast.show({ type: 'success', text1: 'Account created!' });
      router.replace('/(auth)/onboarding');
    },
    onError: (err: any) => {
      haptics.error();
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Could not create account' });
    },
  });

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <Text style={styles.logo}>Reverie</Text>
          <Text style={styles.tagline}>Begin your emotional archive</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create your journal</Text>
          <Text style={styles.cardSub}>Private, encrypted, yours alone</Text>

          <View style={styles.form}>
            {[
              { label: 'Your name', value: name, set: setName, placeholder: 'What should we call you?', type: 'default' as const },
              { label: 'Email',     value: email, set: setEmail, placeholder: 'your@email.com', type: 'email-address' as const },
            ].map(f => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput value={f.value} onChangeText={f.set} placeholder={f.placeholder}
                  placeholderTextColor={Colors.textGhost} keyboardType={f.type}
                  autoCapitalize={f.type === 'email-address' ? 'none' : 'words'}
                  style={styles.input} />
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput value={pw} onChangeText={setPw} placeholder="••••••••"
                  placeholderTextColor={Colors.textGhost} secureTextEntry={!showPw}
                  style={[styles.input, { paddingRight: Space[10] }]} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)}>
                  <Text>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {pw.length > 0 && (
                <View style={styles.strengthArea}>
                  <View style={styles.strengthBar}>
                    {[0,1,2].map(i => (
                      <View key={i} style={[styles.strengthSegment,
                        i < strength && { backgroundColor: strength === 1 ? '#EF4444' : strength === 2 ? '#F59E0B' : Colors.sage }
                      ]} />
                    ))}
                  </View>
                  <View style={styles.rules}>
                    {PW_RULES.map(r => (
                      <Text key={r.label} style={[styles.ruleText, r.test(pw) && { color: Colors.sageDark }]}>
                        {r.test(pw) ? '✓ ' : '· '}{r.label}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.submitBtn, (!allValid || isPending) && styles.btnDisabled]}
              onPress={() => { haptics.light(); mutate(); }} disabled={!name || !email || !allValid || isPending}>
              <Text style={styles.submitText}>{isPending ? 'Creating account…' : 'Create my journal'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.switchRow} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Text style={[styles.switchText, { color: Colors.sageDark, fontFamily: Fonts.sansMedium }]}>Sign in</Text>
        </TouchableOpacity>
        <Text style={styles.encryption}>🔒 End-to-end encrypted</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { flexGrow: 1, padding: Space[6], justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: Space[8] },
  logo:     { fontFamily: Fonts.display, fontSize: 38, color: Colors.textPrimary, letterSpacing: -1 },
  tagline:  { fontFamily: Fonts.displayItalic, fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 4 },
  card:     { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], padding: Space[6], shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 24 },
  cardTitle:{ fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary, marginBottom: 4 },
  cardSub:  { fontFamily: Fonts.sansLight, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Space[5] },
  form:     { gap: Space[4] },
  field:    { gap: Space[2] },
  label:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost },
  inputWrapper: { position: 'relative' },
  input:    { backgroundColor: Colors.surfaceSunken, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Space[4], paddingVertical: Space[3], fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  eyeBtn:   { position: 'absolute', right: Space[4], top: '50%', transform: [{ translateY: -12 }] },
  strengthArea: { marginTop: Space[2], gap: Space[2] },
  strengthBar:  { flexDirection: 'row', gap: 4 },
  strengthSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  rules:    { flexDirection: 'row', gap: Space[3] },
  ruleText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  submitBtn:  { backgroundColor: Colors.sageDark, borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[2] },
  btnDisabled:{ opacity: 0.5 },
  submitText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Space[5] },
  switchText: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted },
  encryption: { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[3] },
});
