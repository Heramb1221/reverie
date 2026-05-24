'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const PW_RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase',     test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number',        test: (p: string) => /\d/.test(p) },
];

export default function ResetPasswordPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get('token') || '';
  const [pw, setPw]         = useState('');
  const [show, setShow]     = useState(false);
  const [done, setDone]     = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.resetPassword({ token, password: pw }),
    onSuccess: () => { setDone(true); toast.success('Password reset'); setTimeout(() => router.push('/login'), 2000); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Reset failed — link may have expired.'),
  });

  const valid    = PW_RULES.every(r => r.test(pw));
  const strength = PW_RULES.filter(r => r.test(pw)).length;

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <p className="font-display text-[18px] text-[var(--color-text-primary)] mb-3">Invalid reset link</p>
        <Link href="/forgot-password" className="text-[13px] text-[#4A6B55] hover:underline">Request a new one</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-surface)]">
      <div className="w-full max-w-sm">
        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--mood-calm-bg)] border border-[var(--mood-calm-border)] flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-[var(--color-sage-dark)]" />
            </div>
            <h1 className="font-display text-[22px] font-medium text-[var(--color-text-primary)] mb-2">Password reset</h1>
            <p className="text-[13px] text-[var(--color-text-muted)] font-light">Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <Link href="/" className="font-display text-[22px] font-medium text-[var(--color-text-primary)]">Re<span className="text-[#7B9E87]">v</span>erie</Link>
              <h1 className="text-[20px] font-display font-medium text-[var(--color-text-primary)] mt-6 mb-1">Choose a new password</h1>
              <p className="text-[13px] text-[var(--color-text-muted)] font-light">Make it something you'll remember.</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (valid) mutate(); }} className="space-y-5">
              <div>
                <label className="text-label block mb-2">New password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" required autoComplete="new-password"
                    className="w-full px-4 py-3 pr-11 rounded-xl border text-[14px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[#7B9E87] outline-none transition-colors placeholder:text-[var(--color-text-ghost)]" />
                  <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-ghost)]">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pw.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <div key={i} className={cn('h-1 flex-1 rounded-full transition-all', i < strength ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-yellow-400' : 'bg-[#7B9E87]') : 'bg-[var(--color-border)]')} />)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {PW_RULES.map(r => (
                        <span key={r.label} className={cn('text-[10px] font-mono flex items-center gap-1', r.test(pw) ? 'text-[#4A6B55]' : 'text-[var(--color-text-ghost)]')}>
                          <Check size={8} className={r.test(pw) ? 'opacity-100' : 'opacity-0'} />{r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" disabled={isPending || !valid}
                className="w-full py-3 rounded-xl text-[14px] font-medium text-white bg-[#4A6B55] hover:bg-[#7B9E87] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending && <Loader2 size={15} className="animate-spin" />}
                {isPending ? 'Resetting…' : 'Set new password'}
              </button>
            </form>
            <p className="text-center text-[12px] text-[var(--color-text-ghost)] mt-8 font-mono">
              Remember it? <Link href="/login" className="text-[#4A6B55] hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
