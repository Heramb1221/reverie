import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, type MoodType, MOOD_EMOJI } from '../../lib/theme';
import { format, isToday, isYesterday } from 'date-fns';

interface Props {
  entry: {
    _id: string;
    title: string;
    contentPreview?: string;
    mood: MoodType;
    wordCount: number;
    createdAt: string;
  };
  onPress: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function formatDate(d: string): string {
  const date = new Date(d);
  if (isToday(date))     return `Today · ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d · h:mm a');
}

export function JournalListCard({ entry, onPress }: Props) {
  const cfg = MOOD_CONFIG[entry.mood];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.accent, { backgroundColor: cfg.hex }]} />
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={styles.badgeEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {stripHtml(entry.title || 'Untitled')}
        </Text>
        {!!entry.contentPreview && (
          <Text style={styles.preview} numberOfLines={2}>
            {stripHtml(entry.contentPreview)}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.meta}>{formatDate(entry.createdAt)}</Text>
          <Text style={styles.meta}>{entry.wordCount} words</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: Radius.xl, marginBottom: Space[3], overflow: 'hidden',
             shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  accent:  { height: 2 },
  body:    { padding: Space[4] },
  badge:   { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
             paddingHorizontal: Space[3], paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1, marginBottom: Space[2] },
  badgeEmoji: { fontSize: 11 },
  badgeText:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  title:   { fontFamily: Fonts.displayMedium, fontSize: FontSizes.md, color: Colors.textPrimary, marginBottom: 4 },
  preview: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 20, marginBottom: Space[3] },
  footer:  { flexDirection: 'row', justifyContent: 'space-between' },
  meta:    { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost },
});
