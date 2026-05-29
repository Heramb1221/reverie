'use client';

import { useQuery } from '@tanstack/react-query';
import { journalApi } from '@/lib/api';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { MOOD_EMOJI } from '@/lib/utils';
import { TrendingUp, BookOpen, Flame, Clock } from 'lucide-react';
import { QuoteCard } from '@/components/shared/QuoteCard';

const MOOD_ORDER = ['calm', 'reflective', 'hopeful', 'overwhelmed'] as const;

export default function MoodPage() {
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];

  const { data, isLoading } = useQuery({
    queryKey: ['journal-stats'],
    queryFn: () => journalApi.stats(),
    select: (res: any) => res.data.data.stats,
  });

  const stats: any = data || {};
  const moodDist: Record<string, number> = stats.moodDistribution || {};
  const total = Object.values(moodDist).reduce((a: number, b: any) => a + b, 0) || 1;

  const dominant = MOOD_ORDER.reduce(
    (a, b) => (moodDist[a] || 0) >= (moodDist[b] || 0) ? a : b, 'calm' as typeof MOOD_ORDER[number]
  );

  return (
    <div className="pb-16 space-y-8 max-w-2xl">
      <header>
        <p className="text-label mb-1">Your emotional landscape</p>
        <h1 className="font-display text-[28px] font-medium text-[var(--color-text-primary)] tracking-[-0.5px]">Mood Analytics</h1>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total entries',  value: stats.totalEntries ?? '—',    icon: BookOpen  },
          { label: 'Current streak', value: stats.currentStreak ? `${stats.currentStreak}d` : '—', icon: Flame },
          { label: 'Total words',    value: stats.totalWords   ? `${Math.round(stats.totalWords / 1000)}k` : '—', icon: TrendingUp },
          { label: 'Avg per entry',  value: stats.avgWordsPerEntry ? `${stats.avgWordsPerEntry}w` : '—', icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-[var(--color-glass-border)] flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `var(--mood-${activeMood}-bg)` }}>
              <Icon size={16} style={{ color: config.colorHex }} />
            </div>
            <div>
              <p className="font-display text-[26px] font-medium text-[var(--color-text-primary)] leading-none">{value}</p>
              <p className="text-label mt-1.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
        <h2 className="font-display text-[16px] font-medium text-[var(--color-text-primary)] mb-6">Mood distribution</h2>
        {isLoading ? (
          <div className="space-y-5">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-5">
            {MOOD_ORDER.map(mood => {
              const count = moodDist[mood] || 0;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={mood}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span>{MOOD_EMOJI[mood]}</span>
                      <span className="text-[13px] font-medium text-[var(--color-text-primary)] capitalize">{mood}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-[var(--color-text-ghost)]">{count} {count === 1 ? 'entry' : 'entries'}</span>
                      <span className="text-[13px] font-mono font-medium w-10 text-right" style={{ color: `var(--mood-${mood}-text)` }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: `var(--mood-${mood}-text)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6 text-center">
          <p className="text-label mb-3">Most frequent mood</p>
          <div className="text-5xl mb-3">{MOOD_EMOJI[dominant]}</div>
          <h3 className="font-display text-[22px] font-medium capitalize text-[var(--color-text-primary)] mb-1">{dominant}</h3>
          <p className="text-[13px] text-[var(--color-text-muted)] font-light">{MOOD_CONFIG[dominant].description}</p>
          <p className="text-[11px] font-mono text-[var(--color-text-ghost)] mt-1">{moodDist[dominant]} entries · {Math.round(((moodDist[dominant] || 0) / total) * 100)}%</p>
        </div>
      )}

      <QuoteCard quote={''} />
    </div>
  );
}
