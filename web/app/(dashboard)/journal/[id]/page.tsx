'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/lib/api';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { MoodSelector } from '@/components/journal/MoodSelector';
import { MoodType, useMoodStore } from '@/store/moodStore';
import { formatEntryDate, countWords, stripHtml, MOOD_EMOJI, cn } from '@/lib/utils';
import { ArrowLeft, Edit3, Save, Trash2, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const qc      = useQueryClient();
  const { setMood } = useMoodStore();

  const [editing, setEditing]   = useState(false);
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [mood, setMoodLocal]    = useState<MoodType>('calm');
  const [hydrated, setHydrated] = useState(false);

  const { data: entry, isLoading } = useQuery({
    queryKey: ['journal', id],
    queryFn: async () => {
      const res = await journalApi.get(id);
      const e = res.data.data.entry;
      if (!hydrated) {
        setTitle(e.title || '');
        setContent(e.content || '');
        setMoodLocal(e.mood);
        setMood(e.mood);
        setHydrated(true);
      }
      return e;
    },
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => journalApi.update(id, { title, content, plainTextContent: stripHtml(content), contentPreview: stripHtml(content).slice(0, 200), mood, wordCount: countWords(content) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal', id] }); qc.invalidateQueries({ queryKey: ['journals'] }); toast.success('Entry saved'); setEditing(false); },
    onError: () => toast.error('Could not save entry'),
  });

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: () => journalApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journals'] }); toast.success('Entry deleted'); router.push('/home'); },
    onError: () => toast.error('Could not delete entry'),
  });

  if (isLoading) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="skeleton h-5 w-16 rounded" />
      <div className="skeleton h-8 w-3/4 rounded" />
      <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6 space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className={`skeleton h-4 rounded ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />)}
      </div>
    </div>
  );

  if (!entry) return <div className="text-center py-20 text-[var(--color-text-ghost)]">Entry not found</div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <Link href="/home" className="flex items-center gap-2 text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] transition-colors text-[13px]">
          <ArrowLeft size={15} /> Back
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setTitle(entry.title); setContent(entry.content); setMoodLocal(entry.mood); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[var(--color-text-ghost)] hover:bg-[var(--color-border)] transition-colors">
                <X size={13} /> Cancel
              </button>
              <button onClick={() => save()} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium text-white bg-[var(--color-sage-dark)] hover:bg-[var(--color-sage)] transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-sage)] transition-colors">
                <Edit3 size={12} /> Edit
              </button>
              <button onClick={() => { if (confirm('Delete this entry permanently?')) remove(); }} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[var(--color-text-ghost)] hover:text-red-400 border border-[var(--color-border)] transition-colors">
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="glass rounded-2xl p-5 border border-[var(--color-glass-border)] mb-5">
          <p className="text-label mb-3">Mood</p>
          <MoodSelector value={mood} onChange={m => { setMoodLocal(m); setMood(m); }} />
        </div>
      )}

      {!editing && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
            style={{ background: `var(--mood-${entry.mood}-bg)`, color: `var(--mood-${entry.mood}-text)`, borderColor: `var(--mood-${entry.mood}-border)` }}>
            {MOOD_EMOJI[entry.mood]} {entry.mood}
          </span>
          <span className="text-[11px] font-mono text-[var(--color-text-ghost)]">{formatEntryDate(entry.createdAt)} · {entry.wordCount} words</span>
        </div>
      )}

      {editing
        ? <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Entry title" maxLength={120}
            className="w-full bg-transparent font-display text-[24px] font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] border-none outline-none py-2 px-1 mb-4" />
        : <h1 className="font-display text-[26px] font-medium text-[var(--color-text-primary)] leading-snug mb-6 tracking-[-0.5px]">{stripHtml(title) || 'Untitled entry'}</h1>
      }

      <div className="glass rounded-2xl border border-[var(--color-glass-border)] overflow-hidden">
        <JournalEditor content={editing ? content : (entry.content || '')} onChange={setContent} editable={editing} />
      </div>

      {entry.images?.length > 0 && (
        <div className="mt-5">
          <p className="text-label mb-3">Images</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {entry.images.map((img: any) => (
              <div key={img.publicId} className="aspect-square rounded-xl overflow-hidden">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}