'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MoodSelector } from '@/components/journal/MoodSelector';
import { MoodType, useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { AnimatedBackground } from '@/components/background/AnimatedBackground';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  {
    step: 1,
    eyebrow: 'Welcome',
    title: 'This is your\nquiet space',
    subtitle: 'Reverie is a private emotional archive. Write freely, reflect deeply, and preserve what matters — for yourself alone.',
  },
  {
    step: 2,
    eyebrow: 'Your first moment',
    title: 'How are you\nfeeling right now?',
    subtitle: "There's no right answer. This sets the atmosphere for your first session.",
  },
  {
    step: 3,
    eyebrow: "You're ready",
    title: 'Your journal\nis waiting',
    subtitle: 'Write when you feel ready. Even a single sentence is enough. Reverie will be here.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUser, user } = useAuthStore();
  const { setMood, activeMood } = useMoodStore();
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState<MoodType>('calm');
  const config = MOOD_CONFIG[activeMood];

  const handleMoodSelect = (m: MoodType) => {
    setSelectedMood(m);
    setMood(m);
  };

  const { mutate: complete, isPending } = useMutation({
    mutationFn: () => authApi.onboarding(),
    onSuccess: () => {
      updateUser({ onboardingComplete: true });
      toast.success('Welcome to Reverie ✦');
      router.push('/home');
    },
    onError: () => {
      // Even if fails, navigate
      updateUser({ onboardingComplete: true });
      router.push('/home');
    },
  });

  const current = STEPS[step - 1];

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1);
    else complete();
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-8">
      <AnimatedBackground />

      <div className="relative z-10 max-w-md w-full text-center">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map(s => (
            <div
              key={s.step}
              className={cn(
                'rounded-full transition-all duration-400',
                step === s.step ? 'w-6 h-1.5' : 'w-1.5 h-1.5',
                step >= s.step ? 'opacity-100' : 'opacity-30'
              )}
              style={{ background: config.colorHex }}
            />
          ))}
        </div>

        {/* Step label */}
        <p
          className="text-label mb-4 transition-all duration-300"
          style={{ color: config.colorHex }}
        >
          {current.eyebrow}
        </p>

        {/* Title */}
        <h1 className="font-display text-[36px] md:text-[44px] font-medium leading-tight tracking-[-1px] text-[var(--color-text-primary)] mb-4 whitespace-pre-line">
          {current.title}
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] font-light text-[var(--color-text-muted)] leading-relaxed max-w-sm mx-auto mb-10">
          {current.subtitle}
        </p>

        {/* Step 2: Mood selector */}
        {step === 2 && (
          <div className="mb-10">
            <MoodSelector value={selectedMood} onChange={handleMoodSelect} size="lg" />
          </div>
        )}

        {/* Step 3: Feature preview cards */}
        {step === 3 && (
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: '✍️', label: 'Rich journaling' },
              { icon: '🔒', label: 'Memory capsules' },
              { icon: '✦', label: 'AI reflection' },
            ].map(f => (
              <div
                key={f.label}
                className="glass rounded-2xl p-4 border border-[var(--color-glass-border)] text-center"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-[11px] text-[var(--color-text-muted)] font-light">{f.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={isPending}
          className={cn(
            'inline-flex items-center gap-3 px-8 py-3.5 rounded-full',
            'text-white text-[15px] font-medium',
            'transition-all duration-200 hover:-translate-y-0.5',
            'disabled:opacity-60'
          )}
          style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {step < 3 ? 'Continue' : isPending ? 'Starting…' : 'Open my journal'}
          {!isPending && <ArrowRight size={16} />}
        </button>

        {step === 1 && (
          <p className="mt-4 text-[11px] font-mono text-[var(--color-text-ghost)]">
            Your entries are end-to-end encrypted
          </p>
        )}
      </div>
    </div>
  );
}
