import { cn } from '@/lib/utils';

interface QuoteCardProps {
  quote: string;
  author?: string;
  className?: string;
}

export function QuoteCard({ quote, author, className }: QuoteCardProps) {
  return (
    <div className={cn('glass rounded-2xl p-6 border border-[var(--color-glass-border)] text-center', className)}>
      <span className="font-display text-5xl text-[var(--color-sage)] opacity-30 leading-none block mb-2">"</span>
      <p className="font-display text-[16px] italic text-[var(--color-text-secondary)] leading-relaxed mb-3">{quote}</p>
      {author && <p className="text-label">{author}</p>}
    </div>
  );
}
