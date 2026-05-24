'use client';

import { useEffect, useRef } from 'react';

interface StaggerRevealOptions {
  selector?: string;
  delay?: number;
  stagger?: number;
  y?: number;
  duration?: number;
}

export function useStaggerReveal(options: StaggerRevealOptions = {}) {
  const { selector = '.reveal', delay = 100, stagger = 80, y = 20, duration = 600 } = options;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const els = container.querySelectorAll<HTMLElement>(selector);
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = `translateY(${y}px)`;
      const t = setTimeout(() => {
        el.style.transition = `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1), transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay + i * stagger);
      return () => clearTimeout(t);
    });
  }, [selector, delay, stagger, y, duration]);

  return ref;
}

export function useParallax(strength = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      el.style.transform = `translateY(${window.scrollY * strength}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [strength]);

  return ref;
}
