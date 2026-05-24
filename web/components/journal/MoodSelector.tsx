'use client';

import { cn } from '@/lib/utils';
import { MoodType, MOOD_CONFIG, useMoodStore } from '@/store/moodStore';
import { Check } from 'lucide-react';

const MOOD_ICONS: Record<MoodType, string> = {
  calm:        '🌿',
  reflective:  '🌧',
  hopeful:     '🌅',
  overwhelmed: '🌊',
};

interface MoodSelectorProps {
  value: MoodType;
  onChange: (mood: MoodType) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function MoodSelector({ value, onChange, size = 'md' }: MoodSelectorProps) {
  const moods = Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][];

  return (
    <div className="grid grid-cols-4 gap-3">
      {moods.map(([mood, config]) => {
        const active = value === mood;
        return (
          <button
            key={mood}
            type="button"
            onClick={() => onChange(mood)}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-2xl border transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              size === 'sm' && 'p-3',
              size === 'md' && 'p-4',
              size === 'lg' && 'p-5',
              active
                ? 'border-opacity-60 shadow-md -translate-y-0.5'
                : 'border-[var(--color-border)] hover:-translate-y-0.5 hover:border-opacity-30'
            )}
            style={active ? {
              background: `var(--mood-${mood}-bg)`,
              borderColor: config.colorHex,
              boxShadow: `0 8px 24px ${config.colorHex}22`,
            } : {
              background: 'var(--color-glass)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Check indicator */}
            {active && (
              <span
                className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: config.colorHex }}
              >
                <Check size={10} className="text-white" strokeWidth={3} />
              </span>
            )}

            {/* Emoji */}
            <span className={cn(
              'transition-transform duration-200',
              size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl',
              active && 'scale-110'
            )}>
              {MOOD_ICONS[mood]}
            </span>

            {/* Label */}
            <div className="text-center">
              <p
                className={cn('font-medium transition-colors duration-200', size === 'sm' ? 'text-[11px]' : 'text-[12px]')}
                style={active ? { color: config.colorHex } : { color: 'var(--color-text-muted)' }}
              >
                {config.label}
              </p>
              {size !== 'sm' && (
                <p className="text-[10px] text-[var(--color-text-ghost)] font-light mt-0.5">
                  {config.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
