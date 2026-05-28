import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { journalApi, uploadApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import { MoodCard } from '../../components/journal/MoodCard';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, type MoodType } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useOfflineSync } from '../../hooks/useOfflineSync';

const PLACEHOLDERS = [
  "What's sitting with you today?",
  'Begin wherever you are…',
  'What did you notice today?',
  'Write the first thing that comes…',
  'How does this moment feel?',
];

const MOODS: MoodType[] = ['calm', 'reflective', 'hopeful', 'overwhelmed'];

interface UploadedImage { url: string; publicId: string; }

function getPlaceholder() {
  return PLACEHOLDERS[new Date().getDay() % PLACEHOLDERS.length];
}

export default function NewEntryScreen() {
  const insets   = useSafeAreaInsets();
  const qc       = useQueryClient();
  const haptics  = useHaptics();
  const { enqueue }      = useOfflineSync();
  const { activeMood, setMood } = useMoodStore();
  const config   = MOOD_CONFIG[activeMood];

  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');
  const [mood,      setMoodLocal] = useState<MoodType>(activeMood);
  const [images,    setImages]    = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [step,      setStep]      = useState<'mood' | 'write'>('mood');

  const handleMoodSelect = (m: MoodType) => {
    setMoodLocal(m);
    setMood(m);
    haptics.select();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  // Image picker
  const pickImage = async () => {
    if (images.length >= 5) {
      Toast.show({ type: 'error', text1: 'Maximum 5 images per entry' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        result.assets.map(async (asset) => {
          const form = new FormData();
          form.append('image', {
            uri: asset.uri,
            type: 'image/jpeg',
            name: `photo_${Date.now()}.jpg`,
          } as unknown as Blob);
          const res = await uploadApi.image(form);
          return res.data.data as UploadedImage;
        })
      );
      setImages(prev => [...prev, ...uploaded]);
      haptics.success();
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again' });
    } finally {
      setUploading(false);
    }
  };

  // Save entry
  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      journalApi.create({
        title:          title.trim() || `Entry — ${new Date().toLocaleDateString()}`,
        content,
        contentPreview: content.replace(/<[^>]*>/g, '').slice(0, 200),
        mood,
        wordCount,
        images,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journals-mobile'] });
      qc.invalidateQueries({ queryKey: ['stats-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Entry saved' });
      router.back();
    },
    onError: async () => {
      // Queue for offline sync
      await enqueue({
        type: 'create',
        payload: { title, content, mood, wordCount, images },
      });
      haptics.warning();
      Toast.show({ type: 'info', text1: 'Saved offline', text2: "We'll sync when you're back online" });
      router.back();
    },
  });

  const canSave = content.trim().length > 0 && !isPending;

  // ── STEP 1: MOOD ──────────────────────────────────────────
  if (step === 'mood') {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => { haptics.light(); router.back(); }}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[s.moodStep, { paddingBottom: insets.bottom + Space[8] }]}>
          <Text style={s.stepLabel}>How are you feeling?</Text>
          <Text style={s.stepTitle}>Choose your mood</Text>
          <View style={s.moodGrid}>
            {MOODS.map(m => (
              <MoodCard key={m} mood={m} selected={mood === m} onSelect={handleMoodSelect} />
            ))}
          </View>
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: MOOD_CONFIG[mood].hex }]}
            onPress={() => { haptics.light(); setStep('write'); }}
          >
            <Text style={s.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── STEP 2: WRITE ─────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => setStep('mood')}>
          <Text style={s.backText}>← Mood</Text>
        </TouchableOpacity>
        <View style={s.headerRight}>
          <Text style={s.wordCountText}>{wordCount} words</Text>
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: MOOD_CONFIG[mood].hex }, !canSave && s.saveBtnDisabled]}
            onPress={() => save()}
            disabled={!canSave}
          >
            <Text style={s.saveBtnText}>{isPending ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.writeStep, { paddingBottom: insets.bottom + Space[16] }]}
        keyboardDismissMode="interactive"
      >
        {/* Mood badge */}
        <TouchableOpacity
          style={[s.moodBadge, { backgroundColor: MOOD_CONFIG[mood].bg, borderColor: MOOD_CONFIG[mood].border }]}
          onPress={() => setStep('mood')}
        >
          <Text style={s.moodBadgeEmoji}>{MOOD_CONFIG[mood].emoji}</Text>
          <Text style={[s.moodBadgeText, { color: MOOD_CONFIG[mood].text }]}>{MOOD_CONFIG[mood].label}</Text>
          <Text style={s.moodChange}>Change</Text>
        </TouchableOpacity>

        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Give this entry a title (optional)"
          placeholderTextColor={Colors.textGhost}
          style={s.titleInput}
          maxLength={100}
          returnKeyType="next"
        />

        {/* Content */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={getPlaceholder()}
          placeholderTextColor={Colors.textGhost}
          style={s.contentInput}
          multiline
          textAlignVertical="top"
          autoFocus
        />

        {/* Images section */}
        <View style={s.imagesSection}>
          <TouchableOpacity
            style={[s.addImageBtn, { borderColor: `${MOOD_CONFIG[mood].hex}50` }]}
            onPress={pickImage}
            disabled={uploading || images.length >= 5}
          >
            <Text style={[s.addImageText, { color: MOOD_CONFIG[mood].hex }]}>
              {uploading ? 'Uploading…' : `📷  Add image (${images.length}/5)`}
            </Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imageRow}>
              {images.map(img => (
                <TouchableOpacity
                  key={img.publicId}
                  onPress={() => {
                    Alert.alert('Remove image', 'Remove this image from the entry?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => setImages(prev => prev.filter(i => i.publicId !== img.publicId)) },
                    ]);
                  }}
                >
                  <Image source={{ uri: img.url }} style={s.thumbnail} />
                  <View style={s.removeOverlay}><Text style={s.removeText}>✕</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: Space[5], paddingVertical: Space[3],
                    borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText:       { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: Space[3] },
  wordCountText:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost },
  saveBtn:        { paddingHorizontal: Space[4], paddingVertical: Space[2], borderRadius: Radius.full },
  saveBtnDisabled:{ opacity: 0.45 },
  saveBtnText:    { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },
  // Mood step
  moodStep:       { padding: Space[5], gap: Space[5] },
  stepLabel:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost },
  stepTitle:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'], color: Colors.textPrimary, letterSpacing: -0.5 },
  moodGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3] },
  nextBtn:        { borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center' },
  nextBtnText:    { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  // Write step
  writeStep:      { padding: Space[5] },
  moodBadge:      { flexDirection: 'row', alignItems: 'center', gap: Space[2], alignSelf: 'flex-start',
                    paddingHorizontal: Space[3], paddingVertical: Space[2], borderRadius: Radius.full,
                    borderWidth: 1, marginBottom: Space[4] },
  moodBadgeEmoji: { fontSize: 14 },
  moodBadgeText:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1, textTransform: 'uppercase' },
  moodChange:     { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textGhost, marginLeft: Space[1] },
  titleInput:     { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary,
                    marginBottom: Space[4], letterSpacing: -0.3 },
  contentInput:   { fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textSecondary,
                    lineHeight: 30, minHeight: 280, fontStyle: 'italic' },
  imagesSection:  { marginTop: Space[6] },
  addImageBtn:    { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.lg,
                    paddingVertical: Space[3], alignItems: 'center', marginBottom: Space[3] },
  addImageText:   { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm },
  imageRow:       { flexDirection: 'row' },
  thumbnail:      { width: 80, height: 80, borderRadius: Radius.md, marginRight: Space[2] },
  removeOverlay:  { position: 'absolute', top: 4, right: 6, backgroundColor: 'rgba(0,0,0,0.55)',
                    borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeText:     { color: '#fff', fontSize: 10 },
});
