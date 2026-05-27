import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { authApi } from '../../lib/api';
import { Colors, Fonts } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your email address.',
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSubmitted(true);
      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Check your inbox for a reset token link.',
      });
    } catch (error: any) {
      const serverMessage = error.response?.data?.message || 'Failed to request reset token.';
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: serverMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Login</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Recover Memory Capsule</Text>
        <Text style={styles.subtitle}>
          {submitted 
            ? "We've dispatched password recovery procedures to your email address."
            : "Enter your registered email below, and we'll transmit instructions to securely restore your repository access."}
        </Text>

        {!submitted ? (
          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@domain.com"
              placeholderTextColor={Colors.textGhost}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Pressable 
              onPress={handleSubmit} 
              style={({ pressed }) => [
                styles.submitButton,
                pressed && { opacity: 0.8 },
                loading && { backgroundColor: Colors.borderLight }
              ]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.textGhost} />
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Instructions</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable 
            onPress={() => router.replace('/(auth)/login')}
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.doneButtonText}>Return to Login</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textGhost,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginTop: -40, // Visual centering balancing spacing constraints
  },
  title: {
    fontFamily: Fonts.displayBold,
    fontSize: 32,
    color: Colors.textLight,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: Fonts.sans, // FIX: Updated key from Fonts.body to Fonts.sans
    fontSize: 16,
    color: Colors.textGhost,
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: Fonts.sans, // FIX: Updated key from Fonts.body to Fonts.sans
    fontSize: 16,
    color: Colors.textLight,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: Colors.textLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  submitButtonText: {
    fontFamily: Fonts.sansMedium, // FIX: Updated key from Fonts.bodyMedium to Fonts.sansMedium
    fontSize: 16,
    color: '#FFF',
  },
  doneButton: {
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    color: Colors.textLight,
  },
});