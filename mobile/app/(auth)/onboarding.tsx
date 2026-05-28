import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useMoodStore } from '../../store/moodStore';
import { MoodCard } from '../../components/journal/MoodCard';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, type MoodType } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';

const { width: SW } = Dimensions.get('window');

const STEPS = [
  {
    step: 1,
    eyebrow: 'Welcome',
    title: 'A quiet space\nfor your thoughts',
    sub: 'Reverie is a private emotional archive. Write freely, reflect deeply, and preserve what matters — for yourself alone.',
  },
  {
    step: 2,
    eyebrow: 'Your first moment',
    title: 'How are you\nfeeling right now?',
    sub: "There's no right answer. This sets your atmosphere.",
  },
  {
    step: 3,
    eyebrow: "You're ready",
    title: 'Your journal\nis waiting',
    sub: 'Write when you feel ready. Even a single sentence is enough. Reverie will be here.',
  },
];

const MOODS: MoodType[] = ['calm', 'reflective', 'hopeful', 'overwhelmed'];

export default function OnboardingScreen() {
  const insets          = useSafeAreaInsets();
  const { updateUser }  = useAuthStore();
  const { setMood, activeMood } = useMoodStore();
  const haptics         = useHaptics();
  const config          = MOOD_CONFIG[activeMood];

  const [step, setStep]             = useState(1);
  const [selectedMood, setSelected] = useState<MoodType>('calm');

  const handleMoodSelect = (m: MoodType) => {
    setSelected(m);
    setMood(m);
    haptics.select();
  };

  const { mutate: complete, isPending } = useMutation({
    mutationFn: () => authApi.onboarding(),
    onSuccess: () => {
      updateUser({ onboardingComplete: true });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Welcome to Reverie ✦' });
      router.replace('/(tabs)' as `/${string}`);
    },
    onError: () => {
      updateUser({ onboardingComplete: true });
      router.replace('/(tabs)' as `/${string}`);
    },
  });

  const handleNext = () => {
    haptics.light();
    if (step < 3) setStep(s => s + 1);
    else complete();
  };

  const current = STEPS[step - 1];

  return (
    <View style={[s.root, { paddingTop: insets.top + Space[6], paddingBottom: insets.bottom + Space[6] }]}>

      {/* Progress dots */}
      <View style={s.dots}>
        {STEPS.map(st => (
          <View
            key={st.step}
            style={[
              s.dot,
              step === st.step
                ? [s.dotActive, { backgroundColor: config.hex, width: 24 }]
                : step > st.step
                ? [s.dotDone, { backgroundColor: config.hex }]
                : s.dotInactive,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: config.hex }]}>{current.eyebrow}</Text>
        <Text style={s.title}>{current.title}</Text>
        <Text style={s.sub}>{current.sub}</Text>

        {/* Step 2: mood selector */}
        {step === 2 && (
          <View style={s.moodGrid}>
            {MOODS.map(m => (
              <MoodCard key={m} mood={m} selected={selectedMood === m} onSelect={handleMoodSelect} />
            ))}
          </View>
        )}

        {/* Step 3: feature icons */}
        {step === 3 && (
          <View style={s.features}>
            {[
              { icon: '✍️', label: 'Rich journaling' },
              { icon: '🔒', label: 'Capsules' },
              { icon: '✦',  label: 'AI reflection' },
            ].map(f => (
              <View key={f.label} style={[s.featureCard, { borderColor: `${config.hex}30` }]}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity
        style={[s.nextBtn, { backgroundColor: config.hex }, isPending && s.btnDisabled]}
        onPress={handleNext}
        disabled={isPending}
      >
        <Text style={s.nextBtnText}>
          {isPending ? 'Starting…' : step < 3 ? 'Continue →' : 'Open my journal →'}
        </Text>
      </TouchableOpacity>

      {step === 1 && (
        <Text style={s.encNote}>🔒 End-to-end encrypted</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: Space[6] },
  dots:        { flexDirection: 'row', gap: Space[2], justifyContent: 'center', marginBottom: Space[10] },
  dot:         { height: 6, borderRadius: 3 },
  dotActive:   { },
  dotDone:     { width: 6, opacity: 0.5 },
  dotInactive: { width: 6, backgroundColor: Colors.border },
  content:     { flexGrow: 1, justifyContent: 'center', paddingBottom: Space[6] },
  eyebrow:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: Space[3] },
  title:       { fontFamily: Fonts.display, fontSize: FontSizes['3xl'], color: Colors.textPrimary, letterSpacing: -1, lineHeight: 44, marginBottom: Space[4] },
  sub:         { fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textMuted, lineHeight: 24, marginBottom: Space[8] },
  moodGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3] },
  features:    { flexDirection: 'row', gap: Space[3] },
  featureCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: Radius.xl,
                 padding: Space[4], alignItems: 'center', gap: Space[2], borderWidth: 1 },
  featureIcon: { fontSize: 24 },
  featureLabel:{ fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center' },
  nextBtn:     { borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[4] },
  btnDisabled: { opacity: 0.6 },
  nextBtnText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  encNote:     { textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: Space[4] },
});
