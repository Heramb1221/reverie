'use client';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sage)] focus-visible:ring-offset-2',
        variant === 'primary'  && 'bg-[var(--color-sage-dark)] text-white hover:bg-[var(--color-sage)] hover:-translate-y-0.5 hover:shadow-mood',
        variant === 'ghost'    && 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]',
        variant === 'outline'  && 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-sage)] hover:text-[var(--color-text-primary)]',
        size === 'sm' && 'px-3 py-1.5 text-[12px]',
        size === 'md' && 'px-5 py-2.5 text-[14px]',
        size === 'lg' && 'px-8 py-3.5 text-[15px]',
        (disabled || loading) && 'opacity-50 cursor-not-allowed translate-y-0',
        className
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
