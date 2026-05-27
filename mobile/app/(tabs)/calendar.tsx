import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday,
} from 'date-fns';
import { journalApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, MoodType } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarScreen() {
  const insets       = useSafeAreaInsets();
  const router       = useRouter();
  const { activeMood } = useMoodStore();
  
  const currentMood  = activeMood && MOOD_CONFIG[activeMood as MoodType] ? activeMood : 'Calm';
  const config       = MOOD_CONFIG[currentMood as MoodType];
  const haptics      = useHaptics();

  const [current, setCurrent]       = useState(new Date());
  const [selected, setSelected]     = useState<Date | null>(null);

  const year  = current.getFullYear();
  const month = current.getMonth() + 1;

  const { data } = useQuery({
    queryKey: ['calendar-mobile', year, month],
    queryFn:  () => journalApi.calendar(year, month),
  });

  const entries: any[] = data?.data?.data?.entries || [];

  const days     = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startDay = getDay(startOfMonth(current));

  const getForDay = (d: Date) => entries.filter(e => isSameDay(new Date(e.createdAt), d));

  const prevMonth = () => { haptics.light(); setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); };
  const nextMonth = () => { haptics.light(); setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); };

  const selectedEntries = selected ? getForDay(selected) : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + Space[4] }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.label}>Your emotional timeline</Text>
        <Text style={styles.title}>Calendar</Text>

        {/* Calendar card */}
        <View style={styles.calCard}>

          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <View style={styles.monthCenter}>
              <Text style={styles.monthName}>{format(current, 'MMMM')}</Text>
              <Text style={styles.yearText}>{format(current, 'yyyy')}</Text>
            </View>
            <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            ={DAY_LABELS.map(d => (
              <Text key={d} style={styles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {/* Offset */}
            {Array.from({ length: startDay }).map((_, i) => (
              <View key={`o${i}`} style={styles.cell} />
            ))}

            {days.map(day => {
              const dayEntries = getForDay(day);
              const hasEntries = dayEntries.length > 0;
              const isSelected = selected && isSameDay(day, selected);
              const todayDay   = isToday(day);

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[
                    styles.cell,
                    isSelected && { backgroundColor: `${config.hex}18`, borderRadius: Radius.md },
                  ]}
                  onPress={() => {
                    haptics.select();
                    setSelected(isSelected ? null : day);
                  }}
                >
                  <Text style={[
                    styles.dayNum,
                    todayDay    && { color: config.hex, fontFamily: Fonts.sansMedium },
                    !hasEntries && { color: Colors.textGhost },
                  ]}>
                    {format(day, 'd')}
                  </Text>
                  {hasEntries && (
                    <View style={styles.dotRow}>
                      {dayEntries.slice(0, 3).map((e, i) => (
                        <View
                          key={i}
                          style={[styles.dot, { backgroundColor: MOOD_CONFIG[e.mood as MoodType]?.hex || Colors.textGhost }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {/* FIX: Standardized loop configuration iteration keys to utilize valid PascalCase properties */}
            {(['Calm', 'Reflective', 'Hopeful', 'Overwhelmed'] as const).map(m => (
              <View key={m} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MOOD_CONFIG[m].hex }]} />
                <Text style={styles.legendText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected day entries */}
        {selected && (
          <View style={styles.daySection}>
            <Text style={styles.daySectionTitle}>
              {format(selected, 'MMMM d, yyyy')}
            </Text>

            {selectedEntries.length > 0 ? (
              selectedEntries.map((entry: any) => (
                <TouchableOpacity
                  key={entry._id}
                  style={styles.entryRow}
                  onPress={() => router.push({ pathname: '/journal/[id]', params: { id: entry._id } })}
                >
                  <View style={[styles.entryMoodDot, { backgroundColor: MOOD_CONFIG[entry.mood as MoodType]?.hex || Colors.textGhost }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryTitle} numberOfLines={1}>
                      {entry.title?.replace(/<[^>]*>/g, '') || 'Untitled entry'}
                    </Text>
                    <Text style={styles.entryTime}>{format(new Date(entry.createdAt), 'h:mm a')}</Text>
                  </View>
                  <Text style={styles.entryArrow}>›</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDayEntry}>
                <Text style={styles.noDayText}>No entries on this day</Text>
                {/* FIX: Updated routing params property to look up valid target directory components */}
                <TouchableOpacity onPress={() => router.push('/(tabs)/new-entry')}>
                  <Text style={[styles.noDayLink, { color: config.hex }]}>Write one →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const CELL_SIZE = 46;

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Space[5], paddingBottom: 100 },
  label:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: 4 },
  title:  { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'], color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Space[5] },

  calCard:    { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, marginBottom: Space[5] },
  monthNav:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Space[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  navBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
  navArrow:   { fontFamily: Fonts.display, fontSize: 22, color: Colors.textMuted, lineHeight: 26 },
  monthCenter:{ alignItems: 'center' },
  monthName:  { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary },
  yearText:   { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 2 },

  dayHeaders: { flexDirection: 'row', paddingHorizontal: Space[3], paddingVertical: Space[2], borderBottomWidth: 1, borderBottomColor: Colors.border },
  dayLabel:   { flex: 1, textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: Colors.textGhost },

  grid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Space[3], paddingVertical: Space[2] },
  cell:    { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: Space[2], minHeight: CELL_SIZE },
  dayNum:  { fontFamily: Fonts.mono, fontSize: 13, color: Colors.textMuted },
  dotRow:  { flexDirection: 'row', gap: 2, marginTop: 3 },
  dot:     { width: 4, height: 4, borderRadius: 2 },

  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3], padding: Space[4], borderTopWidth: 1, borderTopColor: Colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, textTransform: 'capitalize' },

  daySection:      { marginTop: Space[2] },
  daySectionTitle: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.md, color: Colors.textPrimary, marginBottom: Space[3] },
  entryRow:        { flexDirection: 'row', alignItems: 'center', gap: Space[3], backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Space[4], marginBottom: Space[2], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8 },
  entryMoodDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  entryTitle:      { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.textPrimary },
  entryTime:       { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: 2 },
  entryArrow:      { fontFamily: Fonts.display, fontSize: 18, color: Colors.textGhost },

  noDayEntry: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Space[5], alignItems: 'center', gap: Space[2] },
  noDayText:  { fontFamily: Fonts.sansLight, fontSize: FontSizes.sm, color: Colors.textGhost },
  noDayLink:  { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1 },
});