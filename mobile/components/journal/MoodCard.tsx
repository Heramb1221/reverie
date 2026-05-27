import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Space, Radius, MoodType, MOOD_CONFIG } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';

interface Props {
  mood: MoodType;
  selected: boolean;
  onSelect: (mood: MoodType) => void;
  size?: 'sm' | 'md';
}

export function MoodCard({ mood, selected, onSelect, size = 'md' }: Props) {
  const config = MOOD_CONFIG[mood];
  const { select } = useHaptics();

  const handlePress = () => {
    select();
    onSelect(mood);
  };

  const backgroundAlphaColor = `${config.hex}12`;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        size === 'sm' ? styles.cardSm : styles.cardMd,
        selected && { borderColor: config.hex, backgroundColor: backgroundAlphaColor },
        !selected && styles.cardDefault,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {selected && (
        <View style={[styles.checkDot, { backgroundColor: config.hex }]}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
      <Text style={[styles.emoji, size === 'sm' ? styles.emojiSm : styles.emojiMd, selected && styles.emojiSelected]}>
        {config.emoji}
      </Text>
      <Text style={[styles.label, { color: selected ? config.hex : Colors.textMuted }]}>
        {config.label}
      </Text>
      {size === 'md' && (
        <Text style={styles.desc}>{config.atmosphere}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:         { alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1.5, overflow: 'hidden', position: 'relative' },
  cardDefault: { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: Colors.border },
  cardSm:      { padding: Space[3], gap: 4, flex: 1 },
  cardMd:      { padding: Space[4], gap: Space[2], flex: 1 },
  checkDot:    { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  checkMark:   { color: '#fff', fontSize: 10, fontFamily: Fonts.sansMedium },
  emoji:       { },
  emojiSm:     { fontSize: 22 },
  emojiMd:     { fontSize: 28 },
  emojiSelected:{ transform: [{ scale: 1.1 }] },
  label:       { fontFamily: Fonts.sansMedium, fontSize: FontSizes.xs, textAlign: 'center' },
  desc:        { fontFamily: Fonts.sansLight, fontSize: 10, color: Colors.textGhost, textAlign: 'center' },
});