'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { journalApi } from '@/lib/api';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, MOOD_EMOJI, formatEntryDate } from '@/lib/utils';
import Link from 'next/link';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => journalApi.calendar(year, month),
  });

  const entries: any[] = data?.data?.data?.entries || [];

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const startDay = getDay(startOfMonth(currentDate)); // 0=Sun

  const getEntriesForDay = (day: Date) =>
    entries.filter(e => isSameDay(new Date(e.createdAt), day));

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Selected day state
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const selectedEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  return (
    <div className="pb-16 space-y-8">
      {/* Header */}
      <header>
        <p className="text-label mb-1">Your emotional timeline</p>
        <h1 className="font-display text-[28px] font-medium text-[var(--color-text-primary)] tracking-[-0.5px]">
          Calendar
        </h1>
      </header>

      {/* Calendar card */}
      <div className="glass rounded-3xl border border-[var(--color-glass-border)] overflow-hidden">

        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-center">
            <h2 className="font-display text-[20px] font-medium text-[var(--color-text-primary)]">
              {format(currentDate, 'MMMM')}
            </h2>
            <p className="text-label">{format(currentDate, 'yyyy')}</p>
          </div>

          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-label">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Offset for first day */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`offset-${i}`} className="aspect-square p-1" />
          ))}

          {days.map(day => {
            const dayEntries = getEntriesForDay(day);
            const hasEntries = dayEntries.length > 0;
            const today = isToday(day);
            const selected = selectedDay && isSameDay(day, selectedDay);
            const primaryMood = dayEntries[0]?.mood;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(selected ? null : day)}
                className={cn(
                  'aspect-square p-1 flex flex-col items-center justify-center gap-0.5',
                  'transition-all duration-150 hover:bg-[var(--color-border)] rounded-xl m-0.5',
                  selected && 'ring-1 ring-offset-0',
                )}
                style={selected ? { ringColor: config.colorHex } : {}}
              >
                <span className={cn(
                  'text-[12px] font-mono leading-none',
                  today ? 'text-[var(--color-sage-dark)] font-medium' : 'text-[var(--color-text-muted)]',
                  !hasEntries && 'text-[var(--color-text-ghost)]'
                )}>
                  {format(day, 'd')}
                </span>

                {hasEntries && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayEntries.slice(0, 3).map((e, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: `var(--mood-${e.mood}-text)` }}
                      />
                    ))}
                  </div>
                )}

                {today && (
                  <div
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{ background: config.colorHex }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Mood legend */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center gap-4 flex-wrap">
          <p className="text-label mr-2">Mood key</p>
          {(['calm', 'reflective', 'hopeful', 'overwhelmed'] as const).map(m => (
            <div key={m} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: `var(--mood-${m}-text)` }} />
              <span className="text-[10px] font-mono text-[var(--color-text-ghost)] capitalize">{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day entries */}
      {selectedDay && (
        <section>
          <h3 className="font-display text-[16px] font-medium text-[var(--color-text-primary)] mb-4">
            {format(selectedDay, 'MMMM d, yyyy')}
          </h3>

          {selectedEntries.length > 0 ? (
            <div className="space-y-3">
              {selectedEntries.map((entry: any) => (
                <Link
                  key={entry._id}
                  href={`/journal/${entry._id}`}
                  className={cn(
                    'block glass rounded-2xl p-4 border border-[var(--color-glass-border)]',
                    'hover:-translate-y-0.5 transition-all duration-200'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                      style={{
                        background: `var(--mood-${entry.mood}-bg)`,
                        color: `var(--mood-${entry.mood}-text)`,
                        borderColor: `var(--mood-${entry.mood}-border)`,
                      }}
                    >
                      {MOOD_EMOJI[entry.mood]} {entry.mood}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--color-text-ghost)]">
                      {format(new Date(entry.createdAt), 'h:mm a')}
                    </span>
                  </div>
                  <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                    {entry.title || 'Untitled entry'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 border border-[var(--color-glass-border)] text-center">
              <p className="text-[13px] text-[var(--color-text-ghost)] font-light">
                No entries on this day
              </p>
              <Link
                href="/journal/new"
                className="inline-block mt-3 text-[12px] font-mono text-[var(--color-sage-dark)] hover:underline"
              >
                Write one now →
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
