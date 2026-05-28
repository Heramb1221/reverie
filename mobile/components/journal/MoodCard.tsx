import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Space, Radius, type MoodType, MOOD_CONFIG } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';

interface Props {
  mood: MoodType;
  selected: boolean;
  onSelect: (mood: MoodType) => void;
  size?: 'sm' | 'md';
}

export function MoodCard({ mood, selected, onSelect, size = 'md' }: Props) {
  const cfg     = MOOD_CONFIG[mood];
  const haptics = useHaptics();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        size === 'sm' ? styles.sm : styles.md,
        selected
          ? { borderColor: cfg.hex, backgroundColor: cfg.bg,
              shadowColor: cfg.hex, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }
          : styles.default,
      ]}
      onPress={() => { haptics.select(); onSelect(mood); }}
      activeOpacity={0.8}
    >
      {selected && (
        <View style={[styles.check, { backgroundColor: cfg.hex }]}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
      <Text style={[styles.emoji, selected && styles.emojiSelected, size === 'sm' ? styles.emojiSm : styles.emojiMd]}>
        {cfg.emoji}
      </Text>
      <Text style={[styles.label, { color: selected ? cfg.hex : Colors.textMuted }]}>{cfg.label}</Text>
      {size === 'md' && <Text style={styles.desc}>{cfg.description}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:    { alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1.5, position: 'relative', flex: 1 },
  default: { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: Colors.border },
  sm:      { padding: Space[3], gap: 4 },
  md:      { padding: Space[4], gap: Space[2] },
  check:   { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  checkMark:    { color: '#fff', fontSize: 10, fontFamily: Fonts.sansMedium },
  emoji:        { },
  emojiSm:      { fontSize: 22 },
  emojiMd:      { fontSize: 28 },
  emojiSelected:{ transform: [{ scale: 1.1 }] },
  label:   { fontFamily: Fonts.sansMedium, fontSize: FontSizes.xs, textAlign: 'center' },
  desc:    { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textGhost, textAlign: 'center' },
});
