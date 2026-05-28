import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchApi } from '../lib/api';
import { useMoodStore } from '../store/moodStore';
import { JournalListCard } from '../components/journal/JournalListCard';
import { Colors, Fonts, FontSizes, Space, Radius, MOOD_CONFIG, type MoodType } from '../lib/theme';
import { useHaptics } from '../hooks/useHaptics';
import { format } from 'date-fns';

const MOODS: MoodType[] = ['calm', 'reflective', 'hopeful', 'overwhelmed'];

interface SearchEntry {
  _id: string;
  title: string;
  contentPreview?: string;
  mood: MoodType;
  wordCount: number;
  createdAt: string;
}

export default function SearchScreen() {
  const insets   = useSafeAreaInsets();
  const { activeMood } = useMoodStore();
  const config   = MOOD_CONFIG[activeMood];
  const haptics  = useHaptics();

  const [query,      setQuery]      = useState('');
  const [mood,       setMoodFilter] = useState<MoodType | ''>('');
  const [from,       setFrom]       = useState('');
  const [to,         setTo]         = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ['search-mobile', query, mood, from, to],
    queryFn:  () => searchApi.search({
      q:    query  || undefined,
      mood: mood   || undefined,
      from: from   || undefined,
      to:   to     || undefined,
    }),
    enabled: submitted,
  });

  const entries: SearchEntry[] = (data?.data?.data?.entries as SearchEntry[]) ?? [];

  const handleSearch = () => {
    haptics.light();
    setSubmitted(true);
  };

  const clearAll = () => {
    setQuery('');
    setMoodFilter('');
    setFrom('');
    setTo('');
    setSubmitted(false);
    haptics.light();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Search</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={[s.clearText, { color: config.hex }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search input */}
        <View style={s.inputRow}>
          <TextInput
            value={query}
            onChangeText={t => { setQuery(t); setSubmitted(false); }}
            placeholder="Search by keyword…"
            placeholderTextColor={Colors.textGhost}
            style={s.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[s.filterBtn, showFilter && { backgroundColor: config.hex }]}
            onPress={() => { haptics.select(); setShowFilter(v => !v); }}
          >
            <Text style={[s.filterIcon, showFilter && { color: '#fff' }]}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        {showFilter && (
          <View style={s.filterPanel}>
            <Text style={s.filterSectionLabel}>Filter by mood</Text>
            <View style={s.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[
                    s.moodChip,
                    mood === m && {
                      backgroundColor: MOOD_CONFIG[m].bg,
                      borderColor: MOOD_CONFIG[m].hex,
                    },
                  ]}
                  onPress={() => {
                    haptics.select();
                    setMoodFilter(mood === m ? '' : m);
                    setSubmitted(false);
                  }}
                >
                  <Text style={[s.moodChipText, mood === m && { color: MOOD_CONFIG[m].text }]}>
                    {MOOD_CONFIG[m].emoji} {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search button */}
        <TouchableOpacity
          style={[s.searchBtn, { backgroundColor: config.hex }]}
          onPress={handleSearch}
        >
          <Text style={s.searchBtnText}>Search entries</Text>
        </TouchableOpacity>

        {/* Loading */}
        {isFetching && (
          <ActivityIndicator color={config.hex} style={{ marginTop: Space[8] }} />
        )}

        {/* Results */}
        {submitted && !isFetching && (
          entries.length > 0 ? (
            <View style={s.results}>
              <Text style={s.resultsCount}>
                {entries.length} {entries.length === 1 ? 'result' : 'results'} found
              </Text>
              {entries.map(entry => (
                <JournalListCard
                  key={entry._id}
                  entry={entry}
                  onPress={() => router.push(`/journal/${entry._id}` as `/${string}`)}
                />
              ))}
            </View>
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyTitle}>Nothing found</Text>
              <Text style={s.emptySub}>Try different keywords or adjust your filters.</Text>
            </View>
          )
        )}

        {/* Idle state */}
        {!submitted && !isFetching && (
          <View style={s.idle}>
            <Text style={s.idleIcon}>📖</Text>
            <Text style={s.idleText}>Search your inner archive</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: Colors.surface },
  topBar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       paddingHorizontal: Space[5], paddingVertical: Space[3],
                       borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText:          { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textGhost, letterSpacing: 1 },
  topTitle:          { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg, color: Colors.textPrimary },
  clearText:         { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 1 },
  scroll:            { padding: Space[5], paddingBottom: Space[10] },
  inputRow:          { flexDirection: 'row', gap: Space[3], marginBottom: Space[3] },
  searchInput:       { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
                       borderWidth: 1, borderColor: Colors.border,
                       paddingHorizontal: Space[4], paddingVertical: Space[3],
                       fontFamily: Fonts.sans, fontSize: FontSizes.base, color: Colors.textPrimary },
  filterBtn:         { width: 44, height: 44, borderRadius: Radius.xl, backgroundColor: Colors.surfaceElevated,
                       borderWidth: 1, borderColor: Colors.border,
                       alignItems: 'center', justifyContent: 'center' },
  filterIcon:        { fontSize: 18, color: Colors.textMuted },
  filterPanel:       { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
                       padding: Space[4], marginBottom: Space[3],
                       borderWidth: 1, borderColor: Colors.border },
  filterSectionLabel:{ fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                       textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[3] },
  moodRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] },
  moodChip:          { paddingHorizontal: Space[3], paddingVertical: Space[2], borderRadius: Radius.full,
                       borderWidth: 1, borderColor: Colors.border },
  moodChipText:      { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.5,
                       textTransform: 'uppercase', color: Colors.textGhost },
  searchBtn:         { borderRadius: Radius.full, paddingVertical: Space[3],
                       alignItems: 'center', marginBottom: Space[5] },
  searchBtnText:     { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: '#fff' },
  results:           { gap: 0 },
  resultsCount:      { fontFamily: Fonts.mono, fontSize: FontSizes.xs, letterSpacing: 2,
                       textTransform: 'uppercase', color: Colors.textGhost, marginBottom: Space[4] },
  empty:             { alignItems: 'center', paddingVertical: Space[12] },
  emptyIcon:         { fontSize: 36, marginBottom: Space[3] },
  emptyTitle:        { fontFamily: Fonts.displayMedium, fontSize: FontSizes.lg,
                       color: Colors.textPrimary, marginBottom: Space[2] },
  emptySub:          { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' },
  idle:              { alignItems: 'center', paddingVertical: Space[12] },
  idleIcon:          { fontSize: 36, marginBottom: Space[3] },
  idleText:          { fontFamily: Fonts.display, fontSize: FontSizes.md,
                       fontStyle: 'italic', color: Colors.textGhost },
});
