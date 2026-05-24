'use client';

import { useEffect, useRef } from 'react';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

// Background image map per mood
const MOOD_IMAGES: Record<string, string> = {
  calm:        '/assets/backgrounds/hero.jpg',
  reflective:  '/assets/backgrounds/emotional.jpg',
  hopeful:     '/assets/backgrounds/secondary.jpg',
  overwhelmed: '/assets/backgrounds/dashboard.jpg',
};

export function AnimatedBackground() {
  const activeMood = useMoodStore(state => state.activeMood) || 'calm';
  const { user } = useAuthStore();
  const isDark = user?.theme === 'dark';
  const config =
  MOOD_CONFIG[activeMood] ||
  MOOD_CONFIG.calm;
  const particlesRef = useRef<HTMLDivElement>(null);

  // Animate subtle floating particles
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    // Clear old particles
    container.innerHTML = '';

    const count = activeMood === 'reflective' ? 18 : activeMood === 'calm' ? 8 : 6;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 3 + 1;
      const x = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = 8 + Math.random() * 12;

      p.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${activeMood === 'reflective' ? Math.random() * 60 + 20 : size}px;
        left: ${x}%;
        top: -10%;
        border-radius: ${activeMood === 'reflective' ? '1px' : '50%'};
        background: ${config.colorHex};
        opacity: ${activeMood === 'reflective' ? 0.12 : 0.15};
        animation: particleFall ${duration}s ${delay}s linear infinite;
        pointer-events: none;
      `;
      container.appendChild(p);
      particles.push(p);
    }

    // Inject keyframe if not exists
    if (!document.getElementById('particle-style')) {
      const style = document.createElement('style');
      style.id = 'particle-style';
      style.textContent = `
        @keyframes particleFall {
          0%   { transform: translateY(-10vh) translateX(0px); opacity: 0; }
          10%  { opacity: 0.15; }
          90%  { opacity: 0.08; }
          100% { transform: translateY(110vh) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 40)}px); opacity: 0; }
        }
        @keyframes fogDrift {
          0%, 100% { transform: translateX(-5%) scale(1.05); opacity: 0.4; }
          50%       { transform: translateX(5%) scale(1.08); opacity: 0.55; }
        }
        @keyframes moodPulse {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.12; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => { container.innerHTML = ''; };
  }, [activeMood, config.colorHex]);

  const overlay = isDark ? config.overlayDark : config.overlayLight;

  return (
    <div className="fixed inset-0 -z-0 overflow-hidden pointer-events-none" aria-hidden>

      {/* Base background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-[1400ms] ease-in-out"
        style={{
          backgroundImage: `url(${
            MOOD_IMAGES[activeMood] || MOOD_IMAGES.calm
          })`
        }}
      />

      {/* Mood-tinted overlay */}
      <div
        className="absolute inset-0 transition-all duration-[1200ms] ease-in-out"
        style={{ background: overlay }}
      />

      {/* Gradient wash */}
      <div
        className="absolute inset-0 transition-all duration-[1200ms]"
        style={{ background: config.gradient }}
      />

      {/* Fog layer for calm mood */}
      {activeMood === 'calm' && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 120% 60% at 50% 80%, rgba(200,220,210,0.6) 0%, transparent 70%)',
            animation: 'fogDrift 14s ease-in-out infinite',
          }}
        />
      )}

      {/* Warm glow for hopeful */}
      {activeMood === 'hopeful' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(196,149,106,0.12) 0%, transparent 60%)',
            animation: 'moodPulse 6s ease-in-out infinite',
          }}
        />
      )}

      {/* Deep vignette for overwhelmed */}
      {activeMood === 'overwhelmed' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(30,70,85,0.15) 100%)',
          }}
        />
      )}

      {/* Particles container */}
      <div ref={particlesRef} className="absolute inset-0" />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
