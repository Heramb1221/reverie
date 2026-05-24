import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';

interface AIInsightCardProps {
  content: string;
  weekLabel?: string;
  entriesAnalyzed?: number;
  dominantMood?: string;
  className?: string;
}

export function AIInsightCard({ content, weekLabel, entriesAnalyzed, dominantMood, className }: AIInsightCardProps) {
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];

  return (
    <div className={cn('glass rounded-2xl border border-[var(--color-glass-border)] overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3" style={{ background: `var(--mood-${activeMood}-bg)` }}>
        <Sparkles size={14} style={{ color: config.colorHex }} />
        <div>
          <p className="text-label" style={{ color: config.colorHex }}>AI Reflection</p>
          {weekLabel && <p className="text-[11px] font-mono text-[var(--color-text-ghost)]">{weekLabel}</p>}
        </div>
        {entriesAnalyzed !== undefined && (
          <span className="ml-auto text-[10px] font-mono text-[var(--color-text-ghost)]">{entriesAnalyzed} entries read</span>
        )}
      </div>
      <div className="p-6">
        <p className="font-display text-[16px] italic leading-[1.85] text-[var(--color-text-secondary)]">{content}</p>
      </div>
    </div>
  );
}
