import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  rounded?: 'xl' | '2xl' | '3xl';
  padding?: boolean;
}

export function GlassPanel({ children, className, rounded = '2xl', padding = true }: GlassPanelProps) {
  return (
    <div className={cn(
      'glass border border-[var(--color-glass-border)]',
      rounded === 'xl'  && 'rounded-xl',
      rounded === '2xl' && 'rounded-2xl',
      rounded === '3xl' && 'rounded-3xl',
      padding && 'p-6',
      className
    )}>
      {children}
    </div>
  );
}
