'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const PW_RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.signup({ name, email, password }),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      login(user, accessToken);
      toast.success('Account created!');
      router.push('/onboarding');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not create account');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    const allValid = PW_RULES.every(r => r.test(password));
    if (!allValid) { toast.error('Please meet all password requirements'); return; }
    mutate();
  };

  const pwStrength = PW_RULES.filter(r => r.test(password)).length;

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/backgrounds/secondary.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F4F2EE]/85 to-[#C4956A]/20" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <p className="text-label mb-4 text-[#7A5A35]">Begin your journey</p>
          <h2 className="font-display text-[36px] font-400 leading-tight text-[#1C1C1A] mb-4">
            A quiet space<br />has been<br /><em className="text-[#C4956A]">waiting for you</em>
          </h2>
          <div className="flex flex-col gap-3 mt-2">
            {['End-to-end encrypted', 'Weekly AI reflections', 'Memory capsules'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#4A6B55]/20 flex items-center justify-center">
                  <Check size={10} className="text-[#4A6B55]" />
                </div>
                <span className="text-[13px] text-[#3A3A36] font-light">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--color-surface)]">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <Link href="/" className="font-display text-[24px] font-medium text-[var(--color-text-primary)]">
              Re<span className="text-[#7B9E87]">v</span>erie
            </Link>
            <h1 className="text-[22px] font-display font-medium text-[var(--color-text-primary)] mt-6 mb-1">
              Create your journal
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)] font-light">
              Your private emotional archive begins here
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Your name', type: 'text', value: name, setter: setName, placeholder: 'What should we call you?', autoComplete: 'name' },
              { label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'your@email.com', autoComplete: 'email' },
            ].map(({ label, type, value, setter, placeholder, autoComplete }) => (
              <div key={label}>
                <label className="text-label block mb-2">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  required
                  autoComplete={autoComplete}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-[14px]',
                    'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
                    'border-[var(--color-border)] focus:border-[#7B9E87]',
                    'outline-none transition-colors placeholder:text-[var(--color-text-ghost)]'
                  )}
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="text-label block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={cn(
                    'w-full px-4 py-3 pr-11 rounded-xl border text-[14px]',
                    'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
                    'border-[var(--color-border)] focus:border-[#7B9E87]',
                    'outline-none transition-colors placeholder:text-[var(--color-text-ghost)]'
                  )}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-ghost)]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength indicator */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={cn(
                        'h-1 flex-1 rounded-full transition-all duration-300',
                        i < pwStrength
                          ? pwStrength === 1 ? 'bg-red-400' : pwStrength === 2 ? 'bg-yellow-400' : 'bg-[#7B9E87]'
                          : 'bg-[var(--color-border)]'
                      )} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {PW_RULES.map(r => (
                      <span key={r.label} className={cn(
                        'text-[10px] font-mono flex items-center gap-1 transition-colors',
                        r.test(password) ? 'text-[#4A6B55]' : 'text-[var(--color-text-ghost)]'
                      )}>
                        <Check size={8} className={r.test(password) ? 'opacity-100' : 'opacity-0'} />
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending || !name || !email || !password}
              className={cn(
                'w-full py-3 rounded-xl text-[14px] font-medium text-white mt-2',
                'bg-[#4A6B55] hover:bg-[#7B9E87] transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isPending && <Loader2 size={15} className="animate-spin" />}
              {isPending ? 'Creating account…' : 'Create my journal'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[var(--color-text-muted)] mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[#4A6B55] hover:underline font-medium">Sign in</Link>
          </p>

          <p className="text-center text-[11px] text-[var(--color-text-ghost)] mt-4 font-mono leading-relaxed">
            Your entries are end-to-end encrypted.<br />Even we cannot read them.
          </p>
        </div>
      </div>
    </div>
  );
}
