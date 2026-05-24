'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { AnimatedBackground } from '@/components/background/AnimatedBackground';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    else if (user && !user.onboardingComplete) router.push('/onboarding');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className={cn(
        'relative z-10 min-h-screen',
        'ml-[72px] xl:ml-[220px]',
        'transition-all duration-300'
      )}>
        <div className="max-w-5xl mx-auto px-6 xl:px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
