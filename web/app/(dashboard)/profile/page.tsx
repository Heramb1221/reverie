'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userApi, uploadApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMoodStore, MOOD_CONFIG } from '@/store/moodStore';
import { useQuery } from '@tanstack/react-query';
import { journalApi } from '@/lib/api';
import { cn, MOOD_EMOJI } from '@/lib/utils';
import { Camera, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];

  const [name, setName]         = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['journal-stats'],
    queryFn: () => journalApi.stats(),
  });
  const stats = statsData?.data?.data?.stats || {};

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => userApi.updateProfile({ name, avatar: avatarUrl }),
    onSuccess: () => { updateUser({ name, avatar: avatarUrl }); toast.success('Profile updated'); },
    onError: () => toast.error('Could not update profile'),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await uploadApi.image(form);
      const url = res.data.data.url;
      setAvatarUrl(url);
      toast.success('Photo updated');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const dominantMood = stats.moodDistribution
    ? Object.entries(stats.moodDistribution).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]
    : null;

  return (
    <div className="pb-16 space-y-8 max-w-lg">
      <header>
        <p className="text-label mb-1">Your journal identity</p>
        <h1 className="font-display text-[28px] font-medium text-[var(--color-text-primary)] tracking-[-0.5px]">Profile</h1>
      </header>

      {/* Avatar + name */}
      <div className="glass rounded-3xl border border-[var(--color-glass-border)] p-8">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center font-display text-[32px] text-white font-medium">{name?.[0]?.toUpperCase() || 'R'}</div>
              }
            </div>
            <label className={cn('absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center cursor-pointer hover:border-[var(--color-sage)] transition-colors', uploading && 'opacity-60 pointer-events-none')}>
              {uploading ? <Loader2 size={13} className="animate-spin text-[var(--color-text-ghost)]" /> : <Camera size={13} className="text-[var(--color-text-muted)]" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>

          {/* Name input */}
          <div className="w-full">
            <p className="text-label mb-2 text-center">Display name</p>
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60}
              className="w-full text-center px-4 py-3 rounded-xl border text-[15px] font-display bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[var(--color-sage)] outline-none transition-colors" />
          </div>

          <div className="w-full">
            <p className="text-label mb-1 text-center">Email</p>
            <p className="text-center text-[13px] text-[var(--color-text-ghost)] font-mono">{user?.email}</p>
          </div>

          <p className="text-[11px] font-mono text-[var(--color-text-ghost)]">
            Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : '—'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
        <h2 className="font-display text-[15px] font-medium text-[var(--color-text-primary)] mb-5">Your journal at a glance</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total entries', value: stats.totalEntries ?? '—' },
            { label: 'Words written', value: stats.totalWords ? (stats.totalWords > 1000 ? `${(stats.totalWords/1000).toFixed(1)}k` : stats.totalWords) : '—' },
            { label: 'Avg per entry', value: stats.avgWordsPerEntry ? `${stats.avgWordsPerEntry} words` : '—' },
            { label: 'Day streak', value: stats.currentStreak ? `${stats.currentStreak} days` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[var(--color-surface-elevated)] rounded-xl p-4 border border-[var(--color-border)]">
              <p className="font-display text-[22px] font-medium text-[var(--color-text-primary)]">{value}</p>
              <p className="text-label mt-1">{label}</p>
            </div>
          ))}
        </div>

        {dominantMood && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            <span className="text-xl">{MOOD_EMOJI[dominantMood]}</span>
            <div>
              <p className="text-[12px] font-medium text-[var(--color-text-primary)] capitalize">Most felt: {dominantMood}</p>
              <p className="text-[10px] font-mono text-[var(--color-text-ghost)]">{stats.moodDistribution?.[dominantMood]} entries</p>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <button onClick={() => save()} disabled={saving || !name.trim()}
        className="w-full py-3 rounded-xl text-[14px] font-medium text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </div>
  );
}
