import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { authApi } from '../../lib/api';
import { Colors, Fonts, FontSizes, Space, Radius } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent,  setSent]  = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: () => {
      setSent(true);
      Toast.show({ type: 'success', text1: 'Check your inbox' });
    },
    onError: () => {
      // Always show success to prevent email enumeration
      setSent(true);
    },
  });

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top + Space[4] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity onPress={() => router.back()} style={s.back}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      {sent ? (
        <View style={s.center}>
          <Text style={s.icon}>✉️</Text>
          <Text style={s.title}>Check your inbox</Text>
          <Text style={s.sub}>
            If that email exists in Reverie, a reset link is on its way. Check your spam too.
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as `/${string}`)}>
            <Text style={s.link}>Return to sign in →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.form}>
          <Text style={s.title}>Reset password</Text>
          <Text style={s.sub}>We'll send a reset link to your email.</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textGhost}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
          />

          <TouchableOpacity
            style={[s.btn, (!email || isPending) && s.btnDisabled]}
            onPress={() => mutate()}
            disabled={!email || isPending}
          >
            <Text style={s.btnText}>
              {isPending ? 'Sending…' : 'Send reset link'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: Space[6] },
  back:   { marginBottom: Space[10] },
  backText: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Space[4], paddingBottom: Space[16] },
  form:   { flex: 1, justifyContent: 'center', gap: Space[4], paddingBottom: Space[16] },
  icon:   { fontSize: 48 },
  title:  { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary, letterSpacing: -0.3 },
  sub:    { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 22 },
  label:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost },
  input:  { backgroundColor: Colors.surfaceSunken, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
            paddingHorizontal: Space[4], paddingVertical: Space[3],
            fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  btn:    { backgroundColor: Colors.sageDark, borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText:{ fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  link:   { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.sageDark, letterSpacing: 1 },
});
