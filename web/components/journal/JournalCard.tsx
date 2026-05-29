'use client';

import Link from 'next/link';
import { formatEntryDate, MOOD_EMOJI, countWords, readingTime, stripHtml, cn } from '@/lib/utils';
import { useMoodStore } from '@/store/moodStore';
import { Image as ImageIcon } from 'lucide-react';

export interface JournalCardProps {
  _id: string;
  title: string;
  contentPreview: string;
  mood: string;
  wordCount: number;
  images?: Array<{ url: string }>;
  createdAt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function JournalCard({
  _id, title, contentPreview, mood, wordCount, images, createdAt, className, style
}: JournalCardProps) {
  const { activeMood } = useMoodStore();

  const preview = stripHtml(contentPreview || '');
  const moodKey = mood as string;

  return (
    <Link href={`/journal/${_id}`} className={cn('block group', className)} style={style}>
      <article className={cn(
        'glass rounded-2xl p-5 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-card-hover',
        'border border-[var(--color-glass-border)]',
        'relative overflow-hidden'
      )}>
        {/* Mood accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-60`}
          style={{ background: `var(--mood-${moodKey}-text)` }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="text-[10px] font-mono tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border flex-shrink-0"
              style={{
                background: `var(--mood-${moodKey}-bg)`,
                color: `var(--mood-${moodKey}-text)`,
                borderColor: `var(--mood-${moodKey}-border)`,
              }}
            >
              {MOOD_EMOJI[moodKey]} {moodKey}
            </span>
          </div>
          {images && images.length > 0 && (
            <div className="flex items-center gap-1 text-[var(--color-text-ghost)] flex-shrink-0">
              <ImageIcon size={12} />
              <span className="text-[10px] font-mono">{images.length}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-display text-[16px] font-medium leading-snug mb-2',
          'text-[var(--color-text-primary)]',
          'group-hover:text-[var(--color-sage-dark)] dark:group-hover:text-[var(--color-sage-light)]',
          'transition-colors duration-200 line-clamp-2'
        )}>
          {stripHtml(title) || 'Untitled'}
        </h3>

        {/* Preview */}
        {preview && (
          <p className="text-[13px] font-light leading-relaxed text-[var(--color-text-muted)] line-clamp-2 mb-4">
            {preview}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-[var(--color-text-ghost)]">
            {formatEntryDate(createdAt)}
          </span>
          <span className="text-[11px] font-mono text-[var(--color-text-ghost)]">
            {readingTime(wordCount)}
          </span>
        </div>
      </article>
    </Link>
  );
}

// SKELETON
export function JournalCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 border border-[var(--color-glass-border)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded-lg mb-2" />
      <div className="skeleton h-4 w-full rounded mb-1" />
      <div className="skeleton h-4 w-2/3 rounded mb-4" />
      <div className="flex justify-between">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  );
}
