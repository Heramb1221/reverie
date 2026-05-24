import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// ── CLASS NAMES ──
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ── DATE FORMATTING ──
export const formatEntryDate = (date: string | Date): string => {
  const d = new Date(date);
  if (isToday(d))     return `Today · ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday · ${format(d, 'h:mm a')}`;
  return format(d, 'MMMM d, yyyy · h:mm a');
};

export const formatRelative = (date: string | Date): string =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatCalendarDate = (date: string | Date): string =>
  format(new Date(date), 'MMM d');

export const formatMonthYear = (date: Date): string =>
  format(date, 'MMMM yyyy');

// ── WORD COUNT ──
export const countWords = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
};

// ── READING TIME ──
export const readingTime = (wordCount: number): string => {
  const mins = Math.ceil(wordCount / 200);
  return mins <= 1 ? '1 min read' : `${mins} min read`;
};

// ── TRUNCATE ──
export const truncate = (text: string, length = 120): string =>
  text.length > length ? text.slice(0, length) + '…' : text;

// ── STRIP HTML ──
export const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, '');

// ── CAPSULE COUNTDOWN ──
export const getCapsuleCountdown = (unlockDate: Date | string): string => {
  const diff = new Date(unlockDate).getTime() - Date.now();
  if (diff <= 0) return 'Ready to open';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// ── MOOD EMOJI ──
export const MOOD_EMOJI: Record<string, string> = {
  calm:        '🌿',
  reflective:  '🌧',
  hopeful:     '🌅',
  overwhelmed: '🌊',
};

// ── LOCAL STORAGE SAFE ACCESS ──
export const safeLocalStorage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, value); } catch {}
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(key); } catch {}
  },
};
