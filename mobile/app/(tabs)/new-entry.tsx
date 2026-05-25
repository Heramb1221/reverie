import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image, Alert,
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
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, MoodType } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useOfflineSync } from '../../hooks/useOfflineSync';

const PLACEHOLDERS = [
  "What's sitting with you today?",
  'Begin wherever you are…',
  'What did you notice today?',
  'Write the first thing that comes…',
];
const placeholder = PLACEHOLDERS[new Date().getDay() % PLACEHOLDERS.length];

interface UploadedImage { url: string; publicId: string; }

export default function NewEntryScreen() {
  const insets    = useSafeAreaInsets();
  const qc        = useQueryClient();
  const haptics   = useHaptics();
  const { enqueue } = useOfflineSync();
  const { activeMood, setMood } = useMoodStore();

  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');
  const [mood,      setMoodLocal] = useState<MoodType>(activeMood);
  const [images,    setImages]    = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [step,      setStep]      = useState<'mood' | 'write'>('mood');

  const config = MOOD_CONFIG[mood];

  const handleMoodSelect = (m: MoodType) => {
    setMoodLocal(m);
    setMood(m);
    haptics.select();
  };

  const handleNext = () => {
    haptics.light();
    setStep('write');
  };

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
            uri:  asset.uri,
            type: 'image/jpeg',
            name: `photo_${Date.now()}.jpg`,
          } as any);
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

  // Save
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => journalApi.create({
      title:          title.trim() || `Entry — ${new Date().toLocaleDateString()}`,
      content,
      contentPreview: content.replace(/<[^>]*>/g, '').slice(0, 200),
      mood,
      wordCount,
      images,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['journals-mobile'] });
      qc.invalidateQueries({ queryKey: ['stats-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Entry saved' });
      router.back();
    },
    onError: async () => {
      // Offline — enqueue
      await enqueue({
        type: 'create',
        payload: { title, content, mood, wordCount, images },
      });
      haptics.warning();
      Toast.show({ type: 'info', text1: 'Saved offline', text2: "We'll sync when you're back online" });
      router.back();
    },
  });

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: Colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <TouchableOpacity onPress={() => { haptics.light(); router.back(); }} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <Text style={styles.wordCount}>{wordCount} words</Text>
          {step === 'write' && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: config.hex }, (!content.trim() || isPending) && styles.saveBtnDisabled]}
              onPress={() => save()}
              disabled={!content.trim() || isPending}
            >
              <Text style={styles.saveBtnText}>{isPending ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {step === 'mood' ? (
        /* ── STEP 1: MOOD SELECTION ── */
        <ScrollView contentContainerStyle={styles.moodStep}>
          <Text style={styles.stepLabel}>How are you feeling?</Text>
          <Text style={styles.stepTitle}>Choose your mood</Text>

          <View style={styles.moodGrid}>
            {(['calm', 'reflective', 'hopeful', 'overwhelmed'] as MoodType[]).map(m => (
              <MoodCard key={m} mood={m} selected={mood === m} onSelect={handleMoodSelect} />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: config.hex }]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* ── STEP 2: WRITING ── */
        <ScrollView
          contentContainerStyle={styles.writeStep}
          keyboardDismissMode="interactive"
        >
          {/* Mood badge */}
          <TouchableOpacity
            style={[styles.moodBadge, { backgroundColor: config.bg, borderColor: config.border }]}
            onPress={() => setStep('mood')}
          >
            <Text style={styles.moodBadgeEmoji}>{config.emoji}</Text>
            <Text style={[styles.moodBadgeText, { color: config.text }]}>{config.label}</Text>
            <Text style={styles.moodBadgeChange}>Change</Text>
          </TouchableOpacity>

          {/* Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give this entry a title (optional)"
            placeholderTextColor={Colors.textGhost}
            style={styles.titleInput}
            maxLength={100}
            returnKeyType="next"
          />

          {/* Content */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={placeholder}
            placeholderTextColor={Colors.textGhost}
            style={styles.contentInput}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* Images */}
          <View style={styles.imagesSection}>
            <TouchableOpacity
              style={[styles.addImageBtn, { borderColor: `${config.hex}50` }]}
              onPress={pickImage}
              disabled={uploading || images.length >= 5}
            >
              <Text style={[styles.addImageText, { color: config.hex }]}>
                {uploading ? 'Uploading…' : `📷 Add image (${images.length}/5)`}
              </Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                {images.map(img => (
                  <TouchableOpacity
                    key={img.publicId}
                    onPress={() => setImages(prev => prev.filter(i => i.publicId !== img.publicId))}
                  >
                    <Image source={{ uri: img.url }} style={styles.thumbnail} />
                    <View style={styles.removeOverlay}>
                      <Text style={styles.removeText}>✕</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space[5], paddingBottom: Space[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { padding: Space[1] },
  backText:     { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: Space[3] },
  wordCount:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost },
  saveBtn:      { paddingHorizontal: Space[4], paddingVertical: Space[2], borderRadius: Radius.full },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:  { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: '#fff' },

  // Mood step
  moodStep:  { padding: Space[5], gap: Space[4] },
  stepLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost },
  stepTitle: { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'], color: Colors.textPrimary, letterSpacing: -0.5 },
  moodGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3] },
  nextBtn:   { borderRadius: Radius.full, paddingVertical: Space[4], alignItems: 'center', marginTop: Space[4] },
  nextBtnText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },

  // Write step
  writeStep:    { padding: Space[5], paddingBottom: Space[16] },
  moodBadge:    { flexDirection: 'row', alignItems: 'center', gap: Space[2], alignSelf: 'flex-start', paddingHorizontal: Space[3], paddingVertical: Space[2], borderRadius: Radius.full, borderWidth: 1, marginBottom: Space[4] },
  moodBadgeEmoji: { fontSize: 14 },
  moodBadgeText:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1, textTransform: 'uppercase' },
  moodBadgeChange:{ fontFamily: Fonts.mono, fontSize: 9, color: Colors.textGhost, marginLeft: Space[1] },
  titleInput:   { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl, color: Colors.textPrimary, marginBottom: Space[4], letterSpacing: -0.3 },
  contentInput: { fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 30, minHeight: 280 },

  // Images
  imagesSection: { marginTop: Space[6] },
  addImageBtn:   { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.lg, paddingVertical: Space[3], alignItems: 'center', marginBottom: Space[3] },
  addImageText:  { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm },
  imageRow:      { flexDirection: 'row' },
  thumbnail:     { width: 80, height: 80, borderRadius: Radius.md, marginRight: Space[2] },
  removeOverlay: { position: 'absolute', top: 4, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeText:    { color: '#fff', fontSize: 10 },
});
