'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import { JournalCard, JournalCardSkeleton } from '@/components/journal/JournalCard';
import { useMoodStore, MOOD_CONFIG, MoodType } from '@/store/moodStore';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn, MOOD_EMOJI } from '@/lib/utils';
import { format } from 'date-fns';

const MOODS: MoodType[] = ['calm', 'reflective', 'hopeful', 'overwhelmed'];

export default function SearchPage() {
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];

  const [query, setQuery]           = useState('');
  const [mood, setMood]             = useState<MoodType | ''>('');
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = mood || from || to;

  const { data, isFetching, isSuccess } = useQuery({
    queryKey: ['search', query, mood, from, to],
    queryFn: () => searchApi.search({ q: query || undefined, mood: mood || undefined, from: from || undefined, to: to || undefined }),
    enabled: submitted,
  });

  const entries: any[] = data?.data?.data?.entries || [];

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

  const clearAll = () => {
    setQuery(''); setMood(''); setFrom(''); setTo(''); setSubmitted(false);
    inputRef.current?.focus();
  };

  return (
    <div className="pb-16 space-y-8 max-w-2xl">
      <header>
        <p className="text-label mb-1">Find your memories</p>
        <h1 className="font-display text-[28px] font-medium text-[var(--color-text-primary)] tracking-[-0.5px]">Search</h1>
      </header>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-ghost)] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSubmitted(false); }}
            placeholder="Search by keyword…"
            className="w-full pl-10 pr-20 py-3.5 rounded-2xl border text-[14px] glass text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[var(--color-sage)] outline-none transition-colors placeholder:text-[var(--color-text-ghost)]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {(query || hasFilters) && (
              <button type="button" onClick={clearAll} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-text-ghost)] hover:bg-[var(--color-border)] transition-colors">
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(f => !f)}
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all', (showFilters || hasFilters) ? 'text-white' : 'text-[var(--color-text-ghost)] hover:bg-[var(--color-border)]')}
              style={(showFilters || hasFilters) ? { background: config.colorHex } : {}}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-5 space-y-4">
            <div>
              <p className="text-label mb-2.5">Filter by mood</p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(m => (
                  <button key={m} type="button" onClick={() => { setMood(mood === m ? '' : m); setSubmitted(false); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-mono border transition-all"
                    style={mood === m ? { background: `var(--mood-${m}-bg)`, color: `var(--mood-${m}-text)`, borderColor: `var(--mood-${m}-text)` } : { background: 'transparent', color: 'var(--color-text-ghost)', borderColor: 'var(--color-border)' }}>
                    {MOOD_EMOJI[m]} {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'From', val: from, set: setFrom, max: to || format(new Date(), 'yyyy-MM-dd'), min: '' }, { label: 'To', val: to, set: setTo, min: from, max: format(new Date(), 'yyyy-MM-dd') }].map(({ label, val, set, min, max }) => (
                <div key={label}>
                  <p className="text-label mb-2">{label}</p>
                  <input type="date" value={val} onChange={e => { set(e.target.value); setSubmitted(false); }} min={min} max={max}
                    className="w-full px-3 py-2 rounded-xl border text-[12px] font-mono bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)] focus:border-[var(--color-sage)] outline-none" />
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="w-full py-3 rounded-xl text-[14px] font-medium text-white transition-all hover:-translate-y-0.5"
          style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}>
          {isFetching ? 'Searching…' : 'Search entries'}
        </button>
      </form>

      {isFetching && <div className="space-y-3">{[...Array(3)].map((_, i) => <JournalCardSkeleton key={i} />)}</div>}

      {isSuccess && !isFetching && (
        entries.length > 0 ? (
          <section>
            <p className="text-label mb-4">{entries.length} {entries.length === 1 ? 'result' : 'results'} found</p>
            <div className="space-y-3">{entries.map((e: any) => <JournalCard key={e._id} {...e} />)}</div>
          </section>
        ) : (
          <div className="glass rounded-2xl p-10 border border-[var(--color-glass-border)] text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-display text-[16px] font-medium text-[var(--color-text-primary)] mb-2">Nothing found</p>
            <p className="text-[13px] text-[var(--color-text-muted)] font-light">Try different keywords or adjust your filters.</p>
          </div>
        )
      )}

      {!submitted && !isFetching && (
        <div className="text-center py-12">
          <p className="text-[40px] mb-4">📖</p>
          <p className="font-display text-[16px] italic text-[var(--color-text-ghost)]">Search your inner archive</p>
        </div>
      )}
    </div>
  );
}
