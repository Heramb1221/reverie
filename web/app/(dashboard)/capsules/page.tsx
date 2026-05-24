'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { capsuleApi } from '@/lib/api';
import { useMoodStore, MOOD_CONFIG, MoodType } from '@/store/moodStore';
import { MoodSelector } from '@/components/journal/MoodSelector';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { getCapsuleCountdown, cn, MOOD_EMOJI, stripHtml } from '@/lib/utils';
import { Lock, Unlock, Plus, Loader2, X, Trash2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function CapsulesPage() {
  const { activeMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['capsules'],
    queryFn: () => capsuleApi.list(),
  });

  const capsules: any[] = data?.data?.data?.capsules || [];
  const locked   = capsules.filter(c => c.isLocked);
  const unlocked = capsules.filter(c => !c.isLocked);

  return (
    <div className="pb-16 space-y-8 max-w-2xl">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-label mb-1">Write to your future self</p>
          <h1 className="font-display text-[28px] font-medium text-[var(--color-text-primary)] tracking-[-0.5px]">Memory Capsules</h1>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-white transition-all hover:-translate-y-0.5 flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}>
          <Plus size={14} /> New capsule
        </button>
      </header>

      {showCreate && <CreateCapsuleModal onClose={() => setShowCreate(false)} />}

      {isLoading && <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 skeleton border border-[var(--color-glass-border)]" />)}</div>}

      {locked.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4"><Lock size={14} style={{ color: config.colorHex }} /><p className="text-label" style={{ color: config.colorHex }}>Sealed</p></div>
          <div className="space-y-3">{locked.map((c: any) => <CapsuleCard key={c._id} capsule={c} locked />)}</div>
        </section>
      )}

      {unlocked.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4"><Unlock size={14} className="text-[var(--color-sage)]" /><p className="text-label text-[var(--color-sage-dark)]">Ready to open</p></div>
          <div className="space-y-3">{unlocked.map((c: any) => <CapsuleCard key={c._id} capsule={c} locked={false} />)}</div>
        </section>
      )}

      {!isLoading && capsules.length === 0 && (
        <div className="glass rounded-3xl p-12 border border-[var(--color-glass-border)] text-center">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="font-display text-[20px] font-medium text-[var(--color-text-primary)] mb-2">No capsules yet</h2>
          <p className="text-[13px] text-[var(--color-text-muted)] font-light max-w-xs mx-auto leading-relaxed mb-6">Write a letter to your future self. Seal it. Come back when the time is right.</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-medium text-white"
            style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}>
            <Plus size={14} /> Create your first capsule
          </button>
        </div>
      )}
    </div>
  );
}

function CapsuleCard({ capsule, locked }: { capsule: any; locked: boolean }) {
  const qc = useQueryClient();
  const { mutate: del, isPending } = useMutation({
    mutationFn: () => capsuleApi.delete(capsule._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['capsules'] }); toast.success('Capsule removed'); },
    onError: () => toast.error('Could not delete capsule'),
  });

  return (
    <div className={cn('glass rounded-2xl border border-[var(--color-glass-border)] transition-all duration-300', !locked && 'ring-1 ring-[var(--color-sage-dark)]/20')}>
      <Link href={`/capsules/${capsule._id}`} className="block p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `var(--mood-${capsule.mood}-bg)` }}>
            {locked ? '🔒' : '✨'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate mb-1">{stripHtml(capsule.title) || 'Untitled capsule'}</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{ background: `var(--mood-${capsule.mood}-bg)`, color: `var(--mood-${capsule.mood}-text)`, borderColor: `var(--mood-${capsule.mood}-border)` }}>
                {MOOD_EMOJI[capsule.mood]} {capsule.mood}
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-ghost)]">Written {format(new Date(capsule.createdAt), 'MMM d, yyyy')}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {locked
                ? <><Lock size={11} className="text-[var(--color-text-ghost)]" /><span className="text-[11px] font-mono text-[var(--color-text-ghost)]">Opens in {getCapsuleCountdown(capsule.unlockDate)}</span></>
                : <><Unlock size={11} className="text-[var(--color-sage-dark)]" /><span className="text-[11px] font-mono text-[var(--color-sage-dark)]">Ready · {format(new Date(capsule.unlockDate), 'MMM d, yyyy')}</span></>
              }
            </div>
          </div>
          <ChevronRight size={14} className="text-[var(--color-text-ghost)] flex-shrink-0 mt-1" />
        </div>
      </Link>
      <div className="px-5 pb-3 flex justify-end border-t border-[var(--color-border)] pt-3">
        <button onClick={() => { if (confirm('Delete this capsule permanently?')) del(); }} disabled={isPending}
          className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-text-ghost)] hover:text-red-400 transition-colors">
          {isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Delete
        </button>
      </div>
    </div>
  );
}

function CreateCapsuleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { activeMood, setMood } = useMoodStore();
  const config = MOOD_CONFIG[activeMood];
  const [title, setTitle]         = useState('');
  const [content, setContent]     = useState('');
  const [mood, setMoodLocal]      = useState<MoodType>(activeMood);
  const [unlockDate, setUnlockDate] = useState('');
  const minDate = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => capsuleApi.create({ title, content, mood, unlockDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['capsules'] }); toast.success('Capsule sealed ✦'); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not create capsule'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg glass rounded-3xl border border-[var(--color-glass-border)] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="font-display text-[18px] font-medium text-[var(--color-text-primary)]">New memory capsule</h2>
            <p className="text-[12px] text-[var(--color-text-ghost)] font-light mt-0.5">Sealed until your chosen date</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-ghost)] hover:bg-[var(--color-border)] transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div><p className="text-label mb-3">Your mood right now</p><MoodSelector value={mood} onChange={m => { setMoodLocal(m); setMood(m); }} size="sm" /></div>
          <div><p className="text-label mb-2">Capsule title</p>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. A letter to myself in 2027" maxLength={100}
              className="w-full px-4 py-3 rounded-xl border text-[14px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[var(--color-sage)] outline-none transition-colors placeholder:text-[var(--color-text-ghost)]" />
          </div>
          <div><p className="text-label mb-2">Unlock on</p>
            <input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)} min={minDate}
              className="w-full px-4 py-3 rounded-xl border text-[14px] font-mono bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[var(--color-sage)] outline-none" />
          </div>
          <div><p className="text-label mb-2">Your message</p>
            <div className="glass rounded-xl border border-[var(--color-glass-border)] overflow-hidden min-h-[180px]">
              <JournalEditor content={content} onChange={setContent} />
            </div>
          </div>
          <button onClick={() => create()} disabled={!title.trim() || !content.trim() || !unlockDate || isPending}
            className="w-full py-3 rounded-xl text-[14px] font-medium text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${config.colorHex}, #4A6B55)` }}>
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {isPending ? 'Sealing capsule…' : 'Seal this capsule'}
          </button>
        </div>
      </div>
    </div>
  );
}
