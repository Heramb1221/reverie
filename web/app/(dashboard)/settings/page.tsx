'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { cn } from '@/lib/utils';
import { Save, Loader2, AlertTriangle, Moon, Sun, Bell, BellOff, Download, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];
  const router = useRouter();
  const qc = useQueryClient();

  const [notificationsEnabled, setNotifications] = useState(user?.notificationsEnabled ?? false);
  const [reminderFrequency, setFrequency] = useState(user?.reminderFrequency ?? 'every3days');
  const [theme, setTheme] = useState(user?.theme ?? 'light');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: () => userApi.updateProfile({ notificationsEnabled, reminderFrequency, theme }),
    onSuccess: () => {
      updateUser({ notificationsEnabled, reminderFrequency, theme });
      document.documentElement.classList.toggle('dark', theme === 'dark');
      toast.success('Settings saved');
    },
    onError: () => toast.error('Could not save settings'),
  });

  const { mutate: exportData, isPending: exporting } = useMutation({
    mutationFn: () => userApi.export(),
    onSuccess: (res) => {
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `reverie-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    },
    onError: () => toast.error('Export failed'),
  });

  const { mutate: deleteAccount, isPending: deleting } = useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: () => { logout(); router.push('/'); toast.success('Account deleted'); },
    onError: () => toast.error('Could not delete account'),
  });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="glass rounded-2xl border border-[var(--color-glass-border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        <h2 className="font-display text-[15px] font-medium text-[var(--color-text-primary)]">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn('relative w-11 h-6 rounded-full transition-all duration-200', checked ? 'bg-[var(--color-sage-dark)]' : 'bg-[var(--color-border)]')}>
      <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );

  return (
    <div className="pb-16 space-y-6 max-w-lg">
      <header>
        <p className="text-label mb-1">Preferences</p>
        <h1 className="font-display text-[28px] font-medium text-[var(--color-text-primary)] tracking-[-0.5px]">Settings</h1>
      </header>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Theme</p>
            <p className="text-[11px] text-[var(--color-text-ghost)] font-light mt-0.5">Light or dark mode</p>
          </div>
          <div className="flex bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-1 gap-1">
            {(['light', 'dark'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all', theme === t ? 'bg-[var(--color-sage-dark)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]')}>
                {t === 'light' ? <Sun size={12} /> : <Moon size={12} />} {t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? <Bell size={16} style={{ color: config.colorHex }} /> : <BellOff size={16} className="text-[var(--color-text-ghost)]" />}
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Gentle reminders</p>
              <p className="text-[11px] text-[var(--color-text-ghost)] font-light mt-0.5">Email nudges when you haven't written</p>
            </div>
          </div>
          <Toggle checked={notificationsEnabled} onChange={setNotifications} />
        </div>

        {notificationsEnabled && (
          <div>
            <p className="text-label mb-3">Reminder frequency</p>
            <div className="space-y-2">
              {[{ value: 'daily', label: 'Every day' }, { value: 'every3days', label: 'Every 3 days' }, { value: 'weekly', label: 'Once a week' }].map(opt => (
                <button key={opt.value} onClick={() => setFrequency(opt.value as any)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] transition-all text-left', reminderFrequency === opt.value ? 'border-[var(--color-sage)] bg-[var(--mood-calm-bg)]' : 'border-[var(--color-border)] hover:border-[var(--color-sage)]/50')}>
                  <div className={cn('w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center', reminderFrequency === opt.value ? 'border-[var(--color-sage-dark)]' : 'border-[var(--color-border)]')}>
                    {reminderFrequency === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage-dark)]" />}
                  </div>
                  <span className={reminderFrequency === opt.value ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Data */}
      <Section title="Your data">
        <div className="space-y-3">
          <button onClick={() => exportData()} disabled={exporting}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-sage)]/50 text-[13px] text-left transition-all">
            {exporting ? <Loader2 size={15} className="animate-spin text-[var(--color-text-ghost)]" /> : <Download size={15} className="text-[var(--color-text-ghost)]" />}
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Export my data</p>
              <p className="text-[11px] text-[var(--color-text-ghost)] font-light mt-0.5">Download all entries as JSON</p>
            </div>
          </button>
        </div>
      </Section>

      {/* Save */}
      <button onClick={() => saveSettings()} disabled={saving}
        className="w-full py-3 rounded-xl text-[14px] font-medium text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? 'Saving…' : 'Save settings'}
      </button>

      {/* Danger zone */}
      <div className="glass rounded-2xl border border-red-200/40 dark:border-red-900/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200/30 dark:border-red-900/20 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <h2 className="font-display text-[15px] font-medium text-red-500 dark:text-red-400">Danger zone</h2>
        </div>
        <div className="p-6">
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-[13px] text-red-500 hover:text-red-600 transition-colors">
              <Trash2 size={14} /> Delete my account permanently
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-[var(--color-text-muted)] font-light leading-relaxed">
                This will permanently delete your account, all journal entries, reflections, and capsules. This cannot be undone.
              </p>
              <p className="text-label">Type <span className="font-mono text-red-400">DELETE</span> to confirm</p>
              <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl border border-red-300/50 text-[13px] bg-red-50/20 dark:bg-red-900/10 text-[var(--color-text-primary)] outline-none focus:border-red-400 font-mono" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  className="flex-1 py-2 rounded-xl text-[13px] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors">Cancel</button>
                <button onClick={() => deleteAccount()} disabled={deleteInput !== 'DELETE' || deleting}
                  className="flex-1 py-2 rounded-xl text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {deleting && <Loader2 size={13} className="animate-spin" />} Delete forever
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
