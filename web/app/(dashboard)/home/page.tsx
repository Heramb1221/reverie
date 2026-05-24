'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { journalApi, reflectionApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { JournalCard, JournalCardSkeleton } from '@/components/journal/JournalCard';
import { cn, MOOD_EMOJI } from '@/lib/utils';
import {
  PenLine,
  Sparkles,
  Archive,
  TrendingUp,
  BookOpen,
  Flame,
} from 'lucide-react';

const GREETINGS = [
  'Good morning',
  'Good afternoon',
  'Good evening',
];

const getGreeting = () => {
  const h = new Date().getHours();

  return h < 12
    ? GREETINGS[0]
    : h < 18
    ? GREETINGS[1]
    : GREETINGS[2];
};

const PROMPTS = [
  'What small thing made you pause today?',
  'Describe your mood as a weather pattern.',
  'What are you grateful for in this moment?',
  'What feeling has followed you this week?',
  'Write about something that surprised you recently.',
  'What do you wish you could say to someone right now?',
  'How does your body feel right now?',
];

export default function HomePage() {

  // ── AUTH ──
  const { user, hydrated } = useAuthStore();

  // ── MOOD ──
  const activeMood =
    useMoodStore((state) => state.activeMood) || 'calm';

  const config =
    MOOD_CONFIG[activeMood] ||
    MOOD_CONFIG.calm;

  const containerRef = useRef<HTMLDivElement>(null);

  // ── IMPORTANT: WAIT FOR ZUSTAND HYDRATION ──
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-[13px] text-[var(--color-text-muted)] font-mono">
          Loading Reverie...
        </div>
      </div>
    );
  }

  // ── RANDOM PROMPT ──
  const prompt =
    PROMPTS[new Date().getDay() % PROMPTS.length];

  // ── QUERIES ──
  const {
    data: journalData,
    isLoading: loadingJournals,
  } = useQuery({
    queryKey: ['journals', 'recent'],
    queryFn: () =>
      journalApi.list({
        page: 1,
        limit: 5,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['journal-stats'],
    queryFn: () => journalApi.stats(),
  });

  const { data: reflectionData } = useQuery({
    queryKey: ['reflection-latest'],
    queryFn: () => reflectionApi.latest(),
  });

  // ── DATA ──
  const entries =
    journalData?.data?.data?.entries || [];

  const stats =
    statsData?.data?.data?.stats || {};

  const reflection =
    reflectionData?.data?.data?.reflection;

  // ── ENTRANCE ANIMATION ──
  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    const children =
      el.querySelectorAll<HTMLElement>(
        '.reveal-home'
      );

    children.forEach((child, i) => {
      child.style.opacity = '0';
      child.style.transform =
        'translateY(20px)';

      setTimeout(() => {
        child.style.transition =
          'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)';

        child.style.opacity = '1';
        child.style.transform =
          'translateY(0)';
      }, 100 + i * 80);
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative z-10 space-y-8 pb-16"
    >

      {/* ───────────────── HEADER ───────────────── */}
      <header className="reveal-home">
        <p className="text-label mb-1">
          {getGreeting()}
        </p>

        <h1 className="font-display text-[32px] font-medium leading-tight text-[var(--color-text-primary)] tracking-[-0.5px]">
          {user?.name?.split(' ')[0] || 'Friend'}
        </h1>

        <p className="text-[14px] text-[var(--color-text-muted)] mt-1 font-light">
          {new Date().toLocaleDateString(
            'en-US',
            {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }
          )}
        </p>
      </header>

      {/* ───────────────── QUICK WRITE ───────────────── */}
      <div className="reveal-home">
        <Link
          href="/journal/new"
          className={cn(
            'block glass rounded-3xl p-6 border border-[var(--color-glass-border)]',
            'hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 group'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-label mb-3">
                Today's prompt
              </p>

              <p className="font-display text-[18px] italic text-[var(--color-text-secondary)] leading-relaxed mb-4">
                "{prompt}"
              </p>

              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-white transition-all group-hover:gap-3"
                style={{
                  background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)`,
                }}
              >
                <PenLine size={14} />
                Begin writing
              </div>
            </div>

            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ml-4"
              style={{
                background: `var(--mood-${activeMood}-bg)`,
              }}
            >
              {MOOD_EMOJI[activeMood]}
            </div>
          </div>
        </Link>
      </div>

      {/* ───────────────── STATS ───────────────── */}
      <div className="reveal-home grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total entries',
            value: stats.totalEntries ?? '—',
            icon: BookOpen,
          },
          {
            label: 'Day streak',
            value: stats.currentStreak ?? '—',
            icon: Flame,
          },
          {
            label: 'Words written',
            value: stats.totalWords
              ? `${Math.round(
                  stats.totalWords / 1000
                )}k`
              : '—',
            icon: TrendingUp,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="glass rounded-2xl p-4 border border-[var(--color-glass-border)] text-center"
          >
            <Icon
              size={16}
              className="mx-auto mb-2"
              style={{
                color: config.colorHex,
              }}
            />

            <p className="font-display text-[24px] font-medium text-[var(--color-text-primary)]">
              {value}
            </p>

            <p className="text-label mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ───────────────── REFLECTION ───────────────── */}
      {reflection && (
        <div className="reveal-home">
          <Link
            href="/reflection"
            className={cn(
              'block glass rounded-2xl p-5 border border-[var(--color-glass-border)]',
              'hover:-translate-y-1 transition-all duration-300 group'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{
                  background: `var(--mood-${activeMood}-bg)`,
                }}
              >
                ✦
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-label">
                    Weekly reflection
                  </p>

                  <Sparkles
                    size={13}
                    style={{
                      color: config.colorHex,
                    }}
                  />
                </div>

                <p className="font-display text-[14px] italic text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                  "
                  {reflection.content?.slice(
                    0,
                    140
                  )}
                  …"
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ───────────────── RECENT ENTRIES ───────────────── */}
      <section className="reveal-home">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-medium text-[var(--color-text-primary)]">
            Recent entries
          </h2>

          <Link
            href="/search"
            className="text-[12px] font-mono text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] transition-colors"
          >
            View all →
          </Link>
        </div>

        {loadingJournals ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <JournalCardSkeleton key={i} />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(
              (entry: any, i: number) => (
                <JournalCard
                  key={entry._id}
                  {...entry}
                  className="reveal-home"
                  style={{
                    transitionDelay: `${i * 60}ms`,
                  }}
                />
              )
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* ───────────────── QUICK ACTIONS ───────────────── */}
      <section className="reveal-home">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/capsules"
            className="glass rounded-2xl p-4 border border-[var(--color-glass-border)] hover:-translate-y-1 transition-all duration-200 group"
          >
            <Archive
              size={18}
              className="mb-3"
              style={{
                color: config.colorHex,
              }}
            />

            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              Memory Capsules
            </p>

            <p className="text-[11px] text-[var(--color-text-ghost)] font-light mt-0.5">
              Write to future you
            </p>
          </Link>

          <Link
            href="/calendar"
            className="glass rounded-2xl p-4 border border-[var(--color-glass-border)] hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="text-xl mb-3">
              📅
            </div>

            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              Mood Calendar
            </p>

            <p className="text-[11px] text-[var(--color-text-ghost)] font-light mt-0.5">
              Your emotional history
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl p-10 border border-[var(--color-glass-border)] text-center">
      <div className="text-4xl mb-4">
        🌱
      </div>

      <p className="font-display text-[18px] font-medium text-[var(--color-text-primary)] mb-2">
        Your journal is waiting
      </p>

      <p className="text-[13px] text-[var(--color-text-muted)] font-light mb-6 max-w-xs mx-auto leading-relaxed">
        No entries yet. Write your first
        thought — even a single sentence
        is a start.
      </p>

      <Link
        href="/journal/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium text-white bg-[var(--color-sage-dark)] hover:bg-[var(--color-sage)] transition-colors"
      >
        <PenLine size={14} />
        Write something
      </Link>
    </div>
  );
}