'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, BookOpen, Calendar, Sparkles, Search,
  Archive, User, Settings, LogOut, Moon, Sun, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/home',       icon: Home,      label: 'Home' },
  { href: '/journal/new',icon: PenLine,   label: 'Write' },
  { href: '/calendar',   icon: Calendar,  label: 'Calendar' },
  { href: '/reflection', icon: Sparkles,  label: 'Reflection' },
  { href: '/search',     icon: Search,    label: 'Search' },
  { href: '/capsules',   icon: Archive,   label: 'Capsules' },
];

const BOTTOM_ITEMS = [
  { href: '/profile',  icon: User,     label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];

  const isDark = user?.theme === 'dark';

  const handleThemeToggle = () => {
    const next = isDark ? 'light' : 'dark';
    updateUser({ theme: next });
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    router.push('/login');
    toast.success('Signed out');
  };

  const isActive = (href: string) =>
    href === '/home' ? pathname === '/home' : pathname.startsWith(href);

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full w-[72px] xl:w-[220px] z-50 flex flex-col',
      'glass border-r border-[var(--color-border)]',
      'transition-all duration-300'
    )}>

      {/* Logo */}
      <div className="px-4 xl:px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
        <Link href="/home" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-display font-medium"
            style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}
          >
            R
          </div>
          <span className="hidden xl:block font-display text-[17px] font-medium tracking-[-0.3px] text-[var(--color-text-primary)]">
            Reverie
          </span>
        </Link>
      </div>

      {/* Mood indicator */}
      <div className="px-4 xl:px-6 py-3 border-b border-[var(--color-border)]">
        <div className="hidden xl:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: config.colorHex }} />
          <span className="text-[10px] font-mono font-light tracking-[0.15em] uppercase text-[var(--color-text-ghost)]">
            {config.label}
          </span>
        </div>
        <div className="xl:hidden flex justify-center">
          <div className="w-2 h-2 rounded-full" style={{ background: config.colorHex }} />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 xl:px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                'relative overflow-hidden',
                active
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
              )}
            >
              {active && (
                <div
                  className="absolute inset-0 rounded-xl opacity-10"
                  style={{ background: config.colorHex }}
                />
              )}
              {active && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                  style={{ background: config.colorHex }}
                />
              )}
              <Icon
                size={18}
                className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={active ? { color: config.colorHex } : {}}
              />
              <span className={cn(
                'hidden xl:block text-[13px] font-medium transition-all',
                active ? 'text-[var(--color-text-primary)]' : ''
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="py-4 px-3 xl:px-4 border-t border-[var(--color-border)] space-y-1">
        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-border)] transition-all duration-200 group'
          )}
        >
          {isDark
            ? <Sun size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
            : <Moon size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
          }
          <span className="hidden xl:block text-[13px] font-medium">
            {isDark ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
            )}
          >
            <Icon size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:block text-[13px] font-medium">{label}</span>
          </Link>
        ))}

        {/* User avatar + logout */}
        <div className="pt-2 border-t border-[var(--color-border)] mt-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
              style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}
            >
              {user?.name?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="hidden xl:block flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">{user?.name}</p>
              <p className="text-[10px] text-[var(--color-text-ghost)] truncate font-mono">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="hidden xl:flex text-[var(--color-text-ghost)] hover:text-red-400 transition-colors ml-auto"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
