'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reflectionApi } from '@/lib/api';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Sparkles, RefreshCw, Loader2, ChevronRight } from 'lucide-react';
import { cn, MOOD_EMOJI } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ReflectionPage() {
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];
  const qc = useQueryClient();
  const [fallbackReflection, setFallbackReflection] = useState<string | null>(null);

  const { data: latestData, isLoading } = useQuery({
    queryKey: ['reflection-latest'],
    queryFn: () => reflectionApi.latest(),
  });

  const { data: listData } = useQuery({
    queryKey: ['reflections'],
    queryFn: () => reflectionApi.list({ limit: 10 }),
  });

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: () => reflectionApi.generate({ forceRegenerate: Boolean(reflection) }),
    onSuccess: (res) => {
      console.log('[WebReflection] generate success', {
        status: res.status,
        reflectionId: res.data?.data?.reflection?._id,
        entriesAnalyzed: res.data?.data?.reflection?.entriesAnalyzed,
      });
      qc.invalidateQueries({ queryKey: ['reflection-latest'] });
      qc.invalidateQueries({ queryKey: ['reflections'] });
      toast.success('Your reflection is ready');
    },
    onError: (err: any) => {
      console.error('[WebReflection] generate error', {
        status: err?.response?.status,
        message: err?.response?.data?.message || err?.message,
        data: err?.response?.data,
      });

      const moodMessage =
        activeMood === 'calm'
          ? 'You seemed to seek balance and quiet moments this week.'
          : activeMood === 'hopeful'
          ? 'There were signs of optimism and forward movement this week.'
          : activeMood === 'reflective'
          ? 'You spent time thinking deeply about your experiences.'
          : 'This week may have felt emotionally demanding at times.';

      setFallbackReflection(`
    ${moodMessage}

    AI reflection is temporarily unavailable.

    Take a few moments to look back on your journal entries and ask yourself:

    • What moments stood out this week?
    • Which emotions appeared most often?
    • What challenged me?
    • What am I grateful for?
    • What do I want to carry into next week?

    Growth often comes from noticing patterns, not finding perfect answers.
      `.trim());

      toast.success('Showing guided reflection');
    },
  });

  const reflection = latestData?.data?.data?.reflection;
  const allReflections = listData?.data?.data?.reflections || [];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <div className="pb-16 space-y-8 max-w-2xl">

      {/* Header */}
      <header>
        <p className="text-label mb-1">Your AI companion</p>
        <h1 className="font-display text-[28px] font-medium text-[var(--color-text-primary)] tracking-[-0.5px]">
          Weekly Reflection
        </h1>
        <p className="text-[13px] text-[var(--color-text-muted)] font-light mt-1">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </header>

      {/* Latest reflection card */}
      {isLoading ? (
        <ReflectionSkeleton />
      ) : reflection ? (
        <div className="glass rounded-3xl border border-[var(--color-glass-border)] overflow-hidden">

          {/* Card header */}
          <div
            className="px-7 pt-7 pb-5"
            style={{ background: `var(--mood-${activeMood}-bg)` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: config.colorHex + '30' }}
              >
                ✦
              </div>
              <div>
                <p className="text-label" style={{ color: config.colorHex }}>
                  Reverie reflects
                </p>
                <p className="text-[12px] text-[var(--color-text-ghost)] font-mono">
                  {format(new Date(reflection.weekStart), 'MMM d')} –{' '}
                  {format(new Date(reflection.weekEnd), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Mood distribution */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(reflection.moodDistribution || {})
                .filter(([, count]) => (count as number) > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([mood, count]) => (
                  <span
                    key={mood}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
                    style={{
                      background: `var(--mood-${mood}-bg)`,
                      color: `var(--mood-${mood}-text)`,
                      borderColor: `var(--mood-${mood}-border)`,
                    }}
                  >
                    {MOOD_EMOJI[mood]} {mood} × {count as number}
                  </span>
                ))
              }
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--color-border)] mx-6" />

          {/* Reflection content */}
          <div className="px-7 py-6">
            <div className="font-display text-[17px] italic leading-[1.85] text-[var(--color-text-secondary)] whitespace-pre-line">
              {reflection.content}
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 pb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--color-text-ghost)]">
              <Sparkles size={12} style={{ color: config.colorHex }} />
              <span className="text-[10px] font-mono">
                {reflection.entriesAnalyzed} {reflection.entriesAnalyzed === 1 ? 'entry' : 'entries'} read
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-ghost)]">
              {format(new Date(reflection.generatedAt || reflection.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>
        </div>
      ) : (
        /* No reflection yet */
        <div className="glass rounded-3xl border border-[var(--color-glass-border)] p-10 text-center">
          <div className="text-5xl mb-5">✦</div>
          <h2 className="font-display text-[20px] font-medium text-[var(--color-text-primary)] mb-2">
            No reflection yet this week
          </h2>
          <p className="text-[13px] text-[var(--color-text-muted)] font-light max-w-xs mx-auto leading-relaxed mb-6">
            Write a few journal entries this week, then generate your reflection.
          </p>
          <button
            onClick={() => generate()}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-medium text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Reflecting…' : 'Generate reflection'}
          </button>
        </div>
      )}

      {/* Generate new button */}
      {reflection && (
        <div className="flex justify-center">
          <button
            onClick={() => generate()}
            disabled={generating}
            className="flex items-center gap-2 text-[12px] font-mono text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
          >
            {generating
              ? <Loader2 size={13} className="animate-spin" />
              : <RefreshCw size={13} />
            }
            {generating ? 'Reflecting on your week…' : 'Regenerate this weeks reflection'}
          </button>
        </div>
      )}

      {/* Past reflections */}
      {allReflections.length > 1 && (
        <section>
          <h2 className="font-display text-[18px] font-medium text-[var(--color-text-primary)] mb-4">
            Past reflections
          </h2>
          <div className="space-y-2">
            {allReflections.slice(1).map((r: any) => (
              <Link
                key={r._id}
                href={`/reflection/${r._id}`}
                className="flex items-center justify-between glass rounded-xl px-5 py-3.5 border border-[var(--color-glass-border)] hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    {format(new Date(r.weekStart), 'MMM d')} – {format(new Date(r.weekEnd), 'MMM d')}
                  </p>
                  <p className="text-[11px] font-mono text-[var(--color-text-ghost)] mt-0.5">
                    {r.entriesAnalyzed} entries · {r.dominantMood && `${MOOD_EMOJI[r.dominantMood]} ${r.dominantMood}`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-[var(--color-text-ghost)] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReflectionSkeleton() {
  return (
    <div className="glass rounded-3xl border border-[var(--color-glass-border)] p-7 space-y-4">
      <div className="skeleton h-10 w-10 rounded-xl" />
      <div className="skeleton h-4 w-32 rounded" />
      <div className="space-y-2 pt-4">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}