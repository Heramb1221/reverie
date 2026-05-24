'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: () => { setSent(true); toast.success('Check your inbox'); },
    onError:   () => { setSent(true); }, // Always show success to prevent enumeration
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-surface)]">
      <div className="w-full max-w-sm">
        <Link href="/login" className="flex items-center gap-2 text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] transition-colors text-[13px] mb-10">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--mood-calm-bg)] border border-[var(--mood-calm-border)] flex items-center justify-center mx-auto mb-6">
              <Mail size={24} className="text-[var(--color-sage-dark)]" />
            </div>
            <h1 className="font-display text-[22px] font-medium text-[var(--color-text-primary)] mb-2">Check your inbox</h1>
            <p className="text-[13px] text-[var(--color-text-muted)] font-light leading-relaxed">
              If that email exists in Reverie, a reset link is on its way. Check your spam folder too.
            </p>
            <Link href="/login" className="inline-block mt-8 text-[13px] text-[#4A6B55] hover:underline font-medium">Return to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-[22px] font-medium text-[var(--color-text-primary)] mb-2">Reset your password</h1>
            <p className="text-[13px] text-[var(--color-text-muted)] font-light mb-8">We'll send a reset link to your email.</p>

            <form onSubmit={e => { e.preventDefault(); mutate(); }} className="space-y-4">
              <div>
                <label className="text-label block mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border text-[14px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[#7B9E87] outline-none transition-colors placeholder:text-[var(--color-text-ghost)]" />
              </div>
              <button type="submit" disabled={isPending || !email}
                className="w-full py-3 rounded-xl text-[14px] font-medium text-white bg-[#4A6B55] hover:bg-[#7B9E87] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending && <Loader2 size={15} className="animate-spin" />}
                {isPending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
