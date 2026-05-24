'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      login(user, accessToken);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      router.push(user.onboardingComplete ? '/home' : '/onboarding');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    mutate();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — atmospheric panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/backgrounds/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F4F2EE]/80 to-[#7B9E87]/30" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <p className="text-label mb-4 text-[#4A6B55]">Reverie</p>
          <h2 className="font-display text-[40px] font-400 leading-tight text-[#1C1C1A] mb-4">
            Your memories<br />deserve a<br /><em className="text-[#4A6B55]">quiet home</em>
          </h2>
          <p className="text-[14px] font-light text-[#7A7A74] max-w-xs leading-relaxed">
            An emotional archive for reflection, mood tracking, and mindful journaling.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--color-surface)]">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10">
            <Link href="/" className="font-display text-[24px] font-medium text-[var(--color-text-primary)]">
              Re<span className="text-[#7B9E87]">v</span>erie
            </Link>
            <h1 className="text-[22px] font-display font-medium text-[var(--color-text-primary)] mt-6 mb-1">
              Welcome back
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)] font-light">
              Sign in to your journal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-label block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-[14px]',
                  'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
                  'border-[var(--color-border)] focus:border-[#7B9E87]',
                  'outline-none transition-colors placeholder:text-[var(--color-text-ghost)]'
                )}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label">Password</label>
                <Link href="/forgot-password" className="text-[11px] text-[#4A6B55] hover:underline font-mono">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={cn(
                    'w-full px-4 py-3 pr-11 rounded-xl border text-[14px]',
                    'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
                    'border-[var(--color-border)] focus:border-[#7B9E87]',
                    'outline-none transition-colors placeholder:text-[var(--color-text-ghost)]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !email || !password}
              className={cn(
                'w-full py-3 rounded-xl text-[14px] font-medium text-white',
                'bg-[#4A6B55] hover:bg-[#7B9E87] transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isPending && <Loader2 size={15} className="animate-spin" />}
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[var(--color-text-muted)] mt-8">
            No account?{' '}
            <Link href="/signup" className="text-[#4A6B55] hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
