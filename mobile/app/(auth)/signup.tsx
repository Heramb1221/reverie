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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const router = useRouter();
  const loginSuccess = useAuthStore((state) => state.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.signup({ name: name.trim(), email: email.trim(), password }),
    onSuccess: async (res) => {
      const { user, accessToken, refreshToken } = res.data.data;
      await loginSuccess(user, accessToken, refreshToken);
      haptics.success();
      Toast.show({ type: 'success', text1: 'Account Created', text2: `Welcome to Reverie, ${name}!` });
      router.replace('/(auth)/onboarding');
    },
    onError: (err: any) => {
      haptics.error();
      const msg = err?.response?.data?.message || 'Registration failed. Try again.';
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: msg });
    },
  });

  const handlePressRegister = () => {
    haptics.light();
    if (!name.trim() || !email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please populate all fields.' });
      return;
    }
    if (password.length < 8) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Password must be at least 8 characters.' });
      return;
    }
    mutate();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
        <View style={styles.logoArea}>
          <Text style={styles.logo}>Reverie</Text>
          <Text style={styles.tagline}>Create your secure journal container</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get Started</Text>
          <Text style={styles.cardSub}>Your repository is fully end-to-end encrypted</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Alex Mercer"
                placeholderTextColor={Colors.textGhost}
                autoComplete="name"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@domain.com"
                placeholderTextColor={Colors.textGhost}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 8 characters"
                placeholderTextColor={Colors.textGhost}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
              onPress={handlePressRegister}
              activeOpacity={0.7}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.switchRow} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Text style={[styles.switchText, styles.switchLink]}>Sign in</Text>
        </TouchableOpacity>
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
  input: {
    backgroundColor: Colors.surfaceSunken,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Space[4], paddingVertical: Space[3],
    fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary,
  },
  submitBtn:         { backgroundColor: Colors.sageDark, borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[2], minHeight: 48, justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText:        { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Space[6], paddingVertical: 8 },
  switchText: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted },
  switchLink: { color: Colors.sageDark, fontFamily: Fonts.sansMedium },
});