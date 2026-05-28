import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday,
} from 'date-fns';
import { journalApi } from '../../lib/api';
import { useMoodStore } from '../../store/moodStore';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, type MoodType } from '../../lib/theme';
import { useHaptics } from '../../hooks/useHaptics';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalEntry { _id: string; mood: MoodType; createdAt: string; title?: string; }

export default function CalendarScreen() {
  const insets       = useSafeAreaInsets();
  const { activeMood } = useMoodStore();
  const config       = MOOD_CONFIG[activeMood];
  const haptics      = useHaptics();

  const [current,  setCurrent]  = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const year  = current.getFullYear();
  const month = current.getMonth() + 1;

  const { data } = useQuery({
    queryKey: ['calendar-mobile', year, month],
    queryFn:  () => journalApi.calendar(year, month),
  });

  const entries: CalEntry[] = (data?.data?.data?.entries as CalEntry[]) ?? [];

  const days     = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startDay = getDay(startOfMonth(current));

  const getForDay = (d: Date) =>
    entries.filter(e => isSameDay(new Date(e.createdAt), d));

  const prevMonth = () => {
    haptics.light();
    setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelected(null);
  };
  const nextMonth = () => {
    haptics.light();
    setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelected(null);
  };

  const selectedEntries = selected ? getForDay(selected) : [];

  return (
    <View style={[s.root, { paddingTop: insets.top + Space[4] }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={s.pageLabel}>Your emotional timeline</Text>
        <Text style={s.pageTitle}>Calendar</Text>

        {/* Calendar card */}
        <View style={s.calCard}>

          {/* Month nav */}
          <View style={s.monthNav}>
            <TouchableOpacity style={s.navBtn} onPress={prevMonth}>
              <Text style={s.navArrow}>‹</Text>
            </TouchableOpacity>
            <View style={s.monthCenter}>
              <Text style={s.monthName}>{format(current, 'MMMM')}</Text>
              <Text style={s.yearText}>{format(current, 'yyyy')}</Text>
            </View>
            <TouchableOpacity style={s.navBtn} onPress={nextMonth}>
              <Text style={s.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={s.dayHeaders}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={s.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={s.grid}>
            {Array.from({ length: startDay }).map((_, i) => (
              <View key={`offset-${i}`} style={s.cell} />
            ))}
            {days.map(day => {
              const de  = getForDay(day);
              const has = de.length > 0;
              const sel = selected !== null && isSameDay(day, selected);
              const tod = isToday(day);

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[s.cell, sel && { backgroundColor: `${config.hex}18`, borderRadius: Radius.md }]}
                  onPress={() => { haptics.select(); setSelected(sel ? null : day); }}
                >
                  <Text
                    style={[
                      s.dayNum,
                      tod && { color: config.hex, fontFamily: Fonts.sansMedium },
                      !has && !tod && { color: Colors.textGhost },
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                  {has && (
                    <View style={s.dotRow}>
                      {de.slice(0, 3).map((e, i) => (
                        <View
                          key={i}
                          style={[s.dot, { backgroundColor: MOOD_CONFIG[e.mood].hex }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={s.legend}>
            {(['calm', 'reflective', 'hopeful', 'overwhelmed'] as MoodType[]).map(m => (
              <View key={m} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: MOOD_CONFIG[m].hex }]} />
                <Text style={s.legendText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected day entries */}
        {selected !== null && (
          <View style={s.daySection}>
            <Text style={s.daySectionTitle}>
              {format(selected, 'MMMM d, yyyy')}
            </Text>

            {selectedEntries.length > 0 ? (
              selectedEntries.map(entry => (
                <TouchableOpacity
                  key={entry._id}
                  style={s.entryRow}
                  onPress={() => router.push(`/journal/${entry._id}` as `/${string}`)}
                >
                  <View style={[s.entryDot, { backgroundColor: MOOD_CONFIG[entry.mood].hex }]} />
                  <View style={s.entryInfo}>
                    <Text style={s.entryTitle} numberOfLines={1}>
                      {(entry.title ?? '').replace(/<[^>]*>/g, '') || 'Untitled entry'}
                    </Text>
                    <Text style={s.entryTime}>{format(new Date(entry.createdAt), 'h:mm a')}</Text>
                  </View>
                  <Text style={s.entryArrow}>›</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={s.noDayCard}>
                <Text style={s.noDayText}>No entries on this day</Text>
                <TouchableOpacity onPress={() => router.push('/journal/new' as `/${string}`)}>
                  <Text style={[s.noDayLink, { color: config.hex }]}>Write one →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  scroll:         { padding: Space[5], paddingBottom: 110 },
  pageLabel:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.textGhost, marginBottom: 4 },
  pageTitle:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes['2xl'], color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Space[5] },
  calCard:        { backgroundColor: Colors.surfaceElevated, borderRadius: Radius['2xl'], overflow: 'hidden', marginBottom: Space[5],
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  monthNav:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: Space[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  navBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceSunken,
                    alignItems: 'center', justifyContent: 'center' },
  navArrow:       { fontFamily: Fonts.display, fontSize: 22, color: Colors.textMuted, lineHeight: 28 },
  monthCenter:    { alignItems: 'center' },
  monthName:      { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary },
  yearText:       { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 2 },
  dayHeaders:     { flexDirection: 'row', paddingHorizontal: Space[3], paddingVertical: Space[2],
                    borderBottomWidth: 1, borderBottomColor: Colors.border },
  dayLabel:       { flex: 1, textAlign: 'center', fontFamily: Fonts.mono, fontSize: 10,
                    letterSpacing: 1, textTransform: 'uppercase', color: Colors.textGhost },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Space[3], paddingVertical: Space[2] },
  cell:           { width: `${100 / 7}%` as `${number}%`, alignItems: 'center', paddingVertical: Space[2], minHeight: 46 },
  dayNum:         { fontFamily: Fonts.mono, fontSize: 13, color: Colors.textMuted },
  dotRow:         { flexDirection: 'row', gap: 2, marginTop: 3 },
  dot:            { width: 5, height: 5, borderRadius: 2.5 },
  legend:         { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3],
                    padding: Space[4], borderTopWidth: 1, borderTopColor: Colors.border },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:      { width: 7, height: 7, borderRadius: 3.5 },
  legendText:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, textTransform: 'capitalize' },
  daySection:     { marginTop: Space[2] },
  daySectionTitle:{ fontFamily: Fonts.displayMedium, fontSize: FontSizes.md, color: Colors.textPrimary, marginBottom: Space[3] },
  entryRow:       { flexDirection: 'row', alignItems: 'center', gap: Space[3],
                    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                    padding: Space[4], marginBottom: Space[2],
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  entryDot:       { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  entryInfo:      { flex: 1 },
  entryTitle:     { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.textPrimary },
  entryTime:      { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textGhost, marginTop: 2 },
  entryArrow:     { fontFamily: Fonts.display, fontSize: 18, color: Colors.textGhost },
  noDayCard:      { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                    padding: Space[5], alignItems: 'center', gap: Space[2] },
  noDayText:      { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textGhost },
  noDayLink:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1 },
});
