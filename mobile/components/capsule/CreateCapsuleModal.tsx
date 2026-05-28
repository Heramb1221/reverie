import {
  View, Text, TextInput, Modal, StyleSheet,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { capsuleApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import { MoodCard } from '../journal/MoodCard';
import {
  Colors, Fonts, FontSizes, Space, Radius,
  MOOD_CONFIG, type MoodType,
} from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { format, addDays } from 'date-fns';

interface Props {
  onClose:   () => void;
  onSuccess: () => void;
}

const MOODS: MoodType[] = ['calm', 'reflective', 'hopeful', 'overwhelmed'];

// Simple date presets instead of a date picker
const DATE_PRESETS = [
  { label: '1 week',   days: 7 },
  { label: '1 month',  days: 30 },
  { label: '6 months', days: 180 },
  { label: '1 year',   days: 365 },
  { label: '2 years',  days: 730 },
  { label: '5 years',  days: 1825 },
];

export default function CreateCapsuleModal({ onClose, onSuccess }: Props) {
  const { activeMood, setMood } = useMoodStore();
  const config  = MOOD_CONFIG[activeMood];
  const haptics = useHaptics();

  const [title,       setTitle]       = useState('');
  const [content,     setContent]     = useState('');
  const [mood,        setMoodLocal]   = useState<MoodType>(activeMood);
  const [daysPreset,  setDaysPreset]  = useState<number>(365);

  const unlockDate = format(addDays(new Date(), daysPreset), 'yyyy-MM-dd');
  const unlockLabel = format(addDays(new Date(), daysPreset), 'MMMM d, yyyy');

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      capsuleApi.create({ title, content, mood, unlockDate }),
    onSuccess: () => {
      haptics.success();
      Toast.show({ type: 'success', text1: 'Capsule sealed ✦' });
      onSuccess();
    },
    onError: (err: unknown) => {
      haptics.error();
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.show({ type: 'error', text1: msg ?? 'Could not create capsule' });
    },
  });

  const canCreate = title.trim().length > 0 && content.trim().length > 0;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Handle + header */}
        <View style={s.header}>
          <View style={s.handle} />
          <View style={s.headerRow}>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>New capsule</Text>
            <TouchableOpacity
              style={[s.sealBtn, { backgroundColor: config.hex }, (!canCreate || isPending) && s.btnDisabled]}
              onPress={() => { haptics.medium(); create(); }}
              disabled={!canCreate || isPending}
            >
              <Text style={s.sealBtnText}>{isPending ? 'Sealing…' : '🔒 Seal'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Mood */}
          <Text style={s.fieldLabel}>Your mood right now</Text>
          <View style={s.moodGrid}>
            {MOODS.map(m => (
              <MoodCard
                key={m}
                mood={m}
                selected={mood === m}
                onSelect={m2 => { setMoodLocal(m2); setMood(m2); haptics.select(); }}
                size="sm"
              />
            ))}
          </View>

          {/* Title */}
          <Text style={s.fieldLabel}>Capsule title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. A letter to myself in 2027"
            placeholderTextColor={Colors.textGhost}
            style={s.input}
            maxLength={100}
          />

          {/* Unlock date preset */}
          <Text style={s.fieldLabel}>Unlock on</Text>
          <Text style={[s.unlockDateDisplay, { color: config.hex }]}>
            {unlockLabel}
          </Text>
          <View style={s.presetGrid}>
            {DATE_PRESETS.map(p => (
              <TouchableOpacity
                key={p.days}
                style={[
                  s.presetBtn,
                  daysPreset === p.days && { backgroundColor: config.bg, borderColor: config.hex },
                ]}
                onPress={() => { haptics.select(); setDaysPreset(p.days); }}
              >
                <Text style={[
                  s.presetText,
                  daysPreset === p.days && { color: config.text },
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message */}
          <Text style={s.fieldLabel}>Your message</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write to your future self…"
            placeholderTextColor={Colors.textGhost}
            style={s.contentInput}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.surface },
  header:             { paddingTop: Space[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  handle:             { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
                        alignSelf: 'center', marginBottom: Space[3] },
  headerRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: Space[5], paddingBottom: Space[3] },
  cancelText:         { fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textMuted },
  headerTitle:        { fontFamily: Fonts.displayMedium, fontSize: FontSizes.base, color: Colors.textPrimary },
  sealBtn:            { paddingHorizontal: Space[4], paddingVertical: Space[2], borderRadius: Radius.full },
  btnDisabled:        { opacity: 0.5 },
  sealBtnText:        { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },
  scroll:             { padding: Space[5], paddingBottom: Space[16] },
  fieldLabel:         { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                        textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[3], marginTop: Space[4] },
  moodGrid:           { flexDirection: 'row', gap: Space[2], marginBottom: Space[2] },
  input:              { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                        borderWidth: 1, borderColor: Colors.border,
                        paddingHorizontal: Space[4], paddingVertical: Space[3],
                        fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  unlockDateDisplay:  { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg,
                        letterSpacing: -0.3, marginBottom: Space[3] },
  presetGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2], marginBottom: Space[2] },
  presetBtn:          { paddingHorizontal: Space[3], paddingVertical: Space[2],
                        borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  presetText:         { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost },
  contentInput:       { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                        borderWidth: 1, borderColor: Colors.border,
                        paddingHorizontal: Space[4], paddingVertical: Space[3],
                        fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textSecondary,
                        minHeight: 200, fontStyle: 'italic' },
});
