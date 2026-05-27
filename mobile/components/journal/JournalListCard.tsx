import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, MoodType } from '../../lib/theme';
import { format, isToday, isYesterday } from 'date-fns';

interface Props {
  entry: {
    _id: string;
    title: string;
    contentPreview: string;
    mood: MoodType;
    wordCount: number;
    createdAt: string;
  };
  onPress: () => void;
}

function formatDate(d: string) {
  const date = new Date(d);
  if (isToday(date))     return `Today · ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d · h:mm a');
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '');
}

export function JournalListCard({ entry, onPress }: Props) {
  const currentMood = entry.mood && MOOD_CONFIG[entry.mood] ? entry.mood : 'Calm';
  const config = MOOD_CONFIG[currentMood];

  const backgroundAlphaColor = `${config.hex}15`; 
  const borderAlphaColor     = `${config.hex}30`;
  const textContrastColor    = config.hex;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Mood accent top border */}
      <View style={[styles.accent, { backgroundColor: config.hex }]} />

      <View style={styles.body}>
        {/* Mood badge */}
        <View style={[styles.badge, { backgroundColor: backgroundAlphaColor, borderColor: borderAlphaColor }]}>
          <Text style={styles.badgeEmoji}>{config.emoji}</Text>
          <Text style={[styles.badgeText, { color: textContrastColor }]}>{config.label}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {stripHtml(entry.title) || 'Untitled'}
        </Text>

        {/* Preview */}
        {entry.contentPreview ? (
          <Text style={styles.preview} numberOfLines={2}>
            {stripHtml(entry.contentPreview)}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.meta}>{formatDate(entry.createdAt)}</Text>
          <Text style={styles.meta}>{entry.wordCount} words</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderRadius: Radius.xl,
    marginBottom: Space[3],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  accent: { height: 2 },
  body:   { padding: Space[4] },
  badge:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Space[3], paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
    marginBottom: Space[2],
  },
  badgeEmoji: { fontSize: 11 },
  badgeText:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  title:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.md, color: Colors.textPrimary, marginBottom: 4 },
  preview:    { fontFamily: Fonts.sansLight, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20, marginBottom: Space[3] },
  footer:     { flexDirection: 'row', justifyContent: 'space-between' },
  meta:       { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
});