'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi, uploadApi } from '@/lib/api';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { MoodSelector } from '@/components/journal/MoodSelector';
import { MoodType, useMoodStore } from '@/store/moodStore';
import { countWords, stripHtml, cn } from '@/lib/utils';
import { ArrowLeft, ImagePlus, Save, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface UploadedImage { url: string; publicId: string; }

export default function NewEntryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeMood, setMood } = useMoodStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMoodLocal] = useState<MoodType>(activeMood);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleMoodChange = (m: MoodType) => {
    setMoodLocal(m);
    setMood(m); // Update global atmosphere
  };

  // ── IMAGE UPLOAD ──
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images per entry');
      return;
    }
    setUploading(true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const form = new FormData();
          form.append('image', file);
          const res = await uploadApi.image(form);
          return res.data.data as UploadedImage;
        })
      );
      setImages(prev => [...prev, ...results]);
      toast.success(`${results.length} image${results.length > 1 ? 's' : ''} uploaded`);
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [images.length]);

  const removeImage = useCallback(async (publicId: string) => {
    try {
      await uploadApi.delete(publicId);
      setImages(prev => prev.filter(i => i.publicId !== publicId));
    } catch {
      toast.error('Could not remove image');
    }
  }, []);

  // ── SAVE ──
  const { mutate: saveEntry, isPending } = useMutation({
    mutationFn: () => journalApi.create({
      title: title.trim() || `Entry — ${new Date().toLocaleDateString()}`,
      content,
      plainTextContent: stripHtml(content),
      contentPreview: stripHtml(content).slice(0, 200),
      mood,
      wordCount: countWords(content),
      images,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['journals'] });
      qc.invalidateQueries({ queryKey: ['journal-stats'] });
      toast.success('Entry saved');
      router.push(`/journal/${res.data.data.entry._id}`);
    },
    onError: () => toast.error('Could not save entry. Please try again.'),
  });

  const canSave = content.trim().length > 0 && !isPending;

  return (
    <div className="max-w-2xl mx-auto pb-20">

      {/* ── TOPBAR ── */}
      <div className="flex items-center justify-between mb-8 reveal-home">
        <Link
          href="/home"
          className="flex items-center gap-2 text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] transition-colors text-[13px]"
        >
          <ArrowLeft size={15} /> Back
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-label">
            {countWords(content)} words
          </span>
          <button
            onClick={() => saveEntry()}
            disabled={!canSave}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium text-white',
              'transition-all duration-200',
              canSave
                ? 'bg-[var(--color-sage-dark)] hover:bg-[var(--color-sage)] hover:-translate-y-0.5 hover:shadow-mood'
                : 'bg-[var(--color-border)] text-[var(--color-text-ghost)] cursor-not-allowed'
            )}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save entry
          </button>
        </div>
      </div>

      {/* ── MOOD SELECTOR ── */}
      <section className="glass rounded-2xl p-5 border border-[var(--color-glass-border)] mb-5">
        <p className="text-label mb-4">How are you feeling?</p>
        <MoodSelector value={mood} onChange={handleMoodChange} />
      </section>

      {/* ── TITLE ── */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Give this entry a title (optional)"
          maxLength={120}
          className={cn(
            'w-full bg-transparent font-display text-[22px] font-medium',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)]',
            'border-none outline-none py-2 px-1 leading-snug'
          )}
        />
      </div>

      {/* ── EDITOR ── */}
      <div className="glass rounded-2xl border border-[var(--color-glass-border)] mb-5 overflow-hidden">
        <JournalEditor content={content} onChange={setContent} />
      </div>

      {/* ── IMAGES ── */}
      <section className="glass rounded-2xl p-5 border border-[var(--color-glass-border)]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-label">Images</p>
          <label className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer',
            'border border-[var(--color-border)] text-[var(--color-text-muted)]',
            'hover:text-[var(--color-text-primary)] hover:border-[var(--color-sage)] transition-all',
            uploading && 'opacity-50 pointer-events-none'
          )}>
            {uploading
              ? <Loader2 size={13} className="animate-spin" />
              : <ImagePlus size={13} />
            }
            {uploading ? 'Uploading…' : 'Add image'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading || images.length >= 5}
            />
          </label>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {images.map(img => (
              <div key={img.publicId} className="relative group aspect-square rounded-xl overflow-hidden">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(img.publicId)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[var(--color-text-ghost)] font-light">
            Add up to 5 images to this entry
          </p>
        )}
      </section>
    </div>
  );
}