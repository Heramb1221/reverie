import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { journalApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import { MoodCard } from '../../components/journal/MoodCard';
import {
  Colors, Fonts, FontSizes, Space, Radius,
  MOOD_CONFIG, MOOD_EMOJI, type MoodType,
} from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { format, isToday, isYesterday } from 'date-fns';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function formatDate(d: string): string {
  const date = new Date(d);
  if (isToday(date))     return `Today · ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`;
  return format(date, 'MMMM d, yyyy · h:mm a');
}

const MOODS: MoodType[] = ['calm', 'reflective', 'hopeful', 'overwhelmed'];

interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  contentPreview?: string;
  mood: MoodType;
  wordCount: number;
  createdAt: string;
  images?: Array<{ url: string; publicId: string }>;
}

export default function JournalDetailScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const insets    = useSafeAreaInsets();
  const qc        = useQueryClient();
  const haptics   = useHaptics();
  const { setMood } = useMoodStore();

  const [editing,  setEditing]  = useState(false);
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [mood,     setMoodLocal] = useState<MoodType>('calm');
  const [hydrated, setHydrated] = useState(false);

  const { data: entry, isLoading } = useQuery({
    queryKey: ['journal-mobile', id],
    queryFn: async () => {
      const res = await journalApi.get(id as string);
      const e   = res.data.data.entry as JournalEntry;
      if (!hydrated) {
        setTitle(stripHtml(e.title ?? ''));
        setContent(stripHtml(e.content ?? ''));
        setMoodLocal(e.mood);
        setMood(e.mood);
        setHydrated(true);
      }
      return e;
    },
    enabled: !!id,
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () =>
      journalApi.update(id as string, {
        title,
        content,
        plainTextContent: content,
        contentPreview: content.slice(0, 200),
        mood,
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-mobile', id] });
      qc.invalidateQueries({ queryKey: ['journals-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Entry saved' });
      setEditing(false);
    },
    onError: () => {
      haptics.error();
      Toast.show({ type: 'error', text1: 'Could not save entry' });
    },
  });

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: () => journalApi.delete(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journals-mobile'] });
      qc.invalidateQueries({ queryKey: ['stats-mobile'] });
      haptics.success();
      Toast.show({ type: 'success', text1: 'Entry deleted' });
      router.back();
    },
    onError: () => {
      haptics.error();
      Toast.show({ type: 'error', text1: 'Could not delete entry' });
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete entry',
      'This entry will be permanently deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove() },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.sageDark} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.notFound}>Entry not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[s.notFoundLink, { color: Colors.sageDark }]}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg = MOOD_CONFIG[editing ? mood : entry.mood];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { haptics.light(); router.back(); }}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={s.topActions}>
          {editing ? (
            <>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => {
                  haptics.light();
                  setEditing(false);
                  setTitle(stripHtml(entry.title ?? ''));
                  setContent(stripHtml(entry.content ?? ''));
                  setMoodLocal(entry.mood);
                  setMood(entry.mood);
                }}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: cfg.hex }, saving && s.btnDisabled]}
                onPress={() => { haptics.light(); save(); }}
                disabled={saving}
              >
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => { haptics.light(); setEditing(true); }}
              >
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={handleDelete}
                disabled={deleting}
              >
                <Text style={s.deleteBtnText}>{deleting ? '…' : '🗑'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >

        {/* Edit mode: mood selector */}
        {editing && (
          <View style={s.moodEditSection}>
            <Text style={s.moodEditLabel}>Mood</Text>
            <View style={s.moodGrid}>
              {MOODS.map(m => (
                <MoodCard
                  key={m}
                  mood={m}
                  selected={mood === m}
                  onSelect={m2 => { setMoodLocal(m2); setMood(m2); }}
                  size="sm"
                />
              ))}
            </View>
          </View>
        )}

        {/* View mode: meta */}
        {!editing && (
          <View style={s.meta}>
            <View style={[s.moodBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Text style={s.moodBadgeEmoji}>{cfg.emoji}</Text>
              <Text style={[s.moodBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
            </View>
            <Text style={s.metaDate}>{formatDate(entry.createdAt)}</Text>
            <Text style={s.metaWords}>{entry.wordCount} words</Text>
          </View>
        )}

        {/* Title */}
        {editing ? (
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Entry title"
            placeholderTextColor={Colors.textGhost}
            style={s.titleInput}
            maxLength={120}
          />
        ) : (
          <Text style={s.titleView}>
            {stripHtml(entry.title || '') || 'Untitled entry'}
          </Text>
        )}

        {/* Content */}
        {editing ? (
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write here…"
            placeholderTextColor={Colors.textGhost}
            style={s.contentInput}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        ) : (
          <View style={s.contentCard}>
            <Text style={s.contentView}>
              {stripHtml(entry.content || '')}
            </Text>
          </View>
        )}

        {/* Images */}
        {!editing && entry.images && entry.images.length > 0 && (
          <View style={s.imagesSection}>
            <Text style={s.imagesLabel}>Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {entry.images.map(img => (
                <Image
                  key={img.publicId}
                  source={{ uri: img.url }}
                  style={s.image}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: Space[5], paddingVertical: Space[3],
                    borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText:       { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  topActions:     { flexDirection: 'row', alignItems: 'center', gap: Space[2] },
  cancelBtn:      { paddingHorizontal: Space[3], paddingVertical: Space[2],
                    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText:  { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.textMuted },
  saveBtn:        { paddingHorizontal: Space[4], paddingVertical: Space[2], borderRadius: Radius.full },
  saveBtnText:    { fontFamily: Fonts.sansMedium, fontSize: FontSizes.xs, color: '#fff' },
  btnDisabled:    { opacity: 0.5 },
  editBtn:        { paddingHorizontal: Space[3], paddingVertical: Space[2],
                    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  editBtnText:    { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.textMuted },
  deleteBtn:      { paddingHorizontal: Space[3], paddingVertical: Space[2] },
  deleteBtnText:  { fontSize: 16 },
  scroll:         { padding: Space[5], paddingBottom: Space[16] },
  moodEditSection:{ marginBottom: Space[4] },
  moodEditLabel:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                    textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[3] },
  moodGrid:       { flexDirection: 'row', gap: Space[2] },
  meta:           { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
                    gap: Space[2], marginBottom: Space[5] },
  moodBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: Space[3], paddingVertical: 4,
                    borderRadius: Radius.full, borderWidth: 1 },
  moodBadgeEmoji: { fontSize: 12 },
  moodBadgeText:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  metaDate:       { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  metaWords:      { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
  titleView:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'],
                    color: Colors.textPrimary, letterSpacing: -0.5, lineHeight: 36,
                    marginBottom: Space[5] },
  titleInput:     { fontFamily: Fonts.displayMedium, fontSize: FontSizes.xl,
                    color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: Space[4] },
  contentCard:    { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
                    padding: Space[5], marginBottom: Space[5],
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  contentView:    { fontFamily: Fonts.display, fontSize: FontSizes.md,
                    color: Colors.textSecondary, lineHeight: 30, fontStyle: 'italic' },
  contentInput:   { fontFamily: Fonts.display, fontSize: FontSizes.md,
                    color: Colors.textSecondary, lineHeight: 30, minHeight: 280,
                    fontStyle: 'italic' },
  imagesSection:  { marginTop: Space[4] },
  imagesLabel:    { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                    textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[3] },
  image:          { width: 120, height: 120, borderRadius: Radius.lg, marginRight: Space[3] },
  notFound:       { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg,
                    color: Colors.textPrimary, marginBottom: Space[3] },
  notFoundLink:   { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1 },
});