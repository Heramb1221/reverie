'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { capsuleApi } from '@/lib/api';
import { useMoodStore } from '@/store/moodStore';
import { getCapsuleCountdown, MOOD_EMOJI, stripHtml, formatEntryDate } from '@/lib/utils';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CapsuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setMood } = useMoodStore();

  const { data, isLoading } = useQuery({
    queryKey: ['capsule', id],
    queryFn: async () => {
      const res = await capsuleApi.get(id);
      const c = res.data.data.capsule;
      if (c.mood) setMood(c.mood);
      return c;
    },
  });

  const capsule = data as any;

  if (isLoading) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="skeleton h-5 w-16 rounded" />
      <div className="skeleton h-8 w-3/4 rounded" />
      <div className="glass rounded-2xl border border-[var(--color-glass-border)] h-64 skeleton" />
    </div>
  );

  if (!capsule) return <div className="text-center py-20 text-[var(--color-text-ghost)]">Capsule not found</div>;

  const isLocked = capsule.isLocked;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <Link href="/capsules" className="flex items-center gap-2 text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] transition-colors text-[13px]">
          <ArrowLeft size={15} /> All capsules
        </Link>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-3 mb-6">
        {isLocked
          ? <><div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-ghost)]"><Lock size={11} /> Sealed</div><span className="text-[11px] font-mono text-[var(--color-text-ghost)]">Opens in {getCapsuleCountdown(capsule.unlockDate)}</span></>
          : <><div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--mood-calm-bg)] text-[var(--mood-calm-text)] text-[11px] font-mono border border-[var(--mood-calm-border)]"><Unlock size={11} /> Unsealed</div><span className="text-[11px] font-mono text-[var(--color-text-ghost)]">Opened {capsule.unlockDate ? format(new Date(capsule.unlockDate), 'MMM d, yyyy') : ''}</span></>
        }
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border" style={{ background: `var(--mood-${capsule.mood}-bg)`, color: `var(--mood-${capsule.mood}-text)`, borderColor: `var(--mood-${capsule.mood}-border)` }}>
          {MOOD_EMOJI[capsule.mood]} {capsule.mood}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-display text-[26px] font-medium text-[var(--color-text-primary)] leading-snug mb-2 tracking-[-0.5px]">
        {stripHtml(capsule.title) || 'Memory capsule'}
      </h1>
      <p className="text-[12px] font-mono text-[var(--color-text-ghost)] mb-8">
        Written {format(new Date(capsule.createdAt), 'MMMM d, yyyy')} · sealed until {format(new Date(capsule.unlockDate), 'MMMM d, yyyy')}
      </p>

      {/* Content */}
      {isLocked ? (
        <div className="glass rounded-3xl border border-[var(--color-glass-border)] p-12 text-center">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="font-display text-[20px] font-medium text-[var(--color-text-primary)] mb-2">Still sealed</h2>
          <p className="text-[13px] text-[var(--color-text-muted)] font-light leading-relaxed max-w-xs mx-auto mb-4">
            This capsule will open on {format(new Date(capsule.unlockDate), 'MMMM d, yyyy')}.
          </p>
          <p className="font-mono text-[20px] font-medium" style={{ color: 'var(--color-sage-dark)' }}>
            {getCapsuleCountdown(capsule.unlockDate)}
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-[var(--color-glass-border)] overflow-hidden">
          <div className="px-8 py-8">
            <div
              className="font-display text-[17px] leading-[1.9] text-[var(--color-text-secondary)]"
              dangerouslySetInnerHTML={{ __html: capsule.content || '' }}
            />
          </div>
          {capsule.images?.length > 0 && (
            <div className="px-8 pb-8">
              <p className="text-label mb-3">Images</p>
              <div className="grid grid-cols-2 gap-3">
                {capsule.images.map((img: any) => (
                  <div key={img.publicId} className="aspect-video rounded-xl overflow-hidden">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
