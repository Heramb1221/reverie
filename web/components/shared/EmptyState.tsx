import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({ icon = '🌱', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('glass rounded-2xl p-12 border border-[var(--color-glass-border)] text-center', className)}>
      <div className="text-4xl mb-4">{icon}</div>
      <p className="font-display text-[18px] font-medium text-[var(--color-text-primary)] mb-2">{title}</p>
      <p className="text-[13px] text-[var(--color-text-muted)] font-light max-w-xs mx-auto leading-relaxed mb-6">{description}</p>
      {action && (
        <Link href={action.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium text-white bg-[var(--color-sage-dark)] hover:bg-[var(--color-sage)] transition-colors">
          {action.label}
        </Link>
      )}
    </div>
  );
}
