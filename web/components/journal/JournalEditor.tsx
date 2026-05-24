'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Bold, Italic, Heading2, Quote, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEHOLDERS = [
  "What's sitting with you today?",
  "Begin wherever you are…",
  "What did you notice today?",
  "How did the day feel in your body?",
  "Write the first thing that comes…",
  "What are you carrying right now?",
];

const randomPlaceholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

interface JournalEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

export function JournalEditor({ content, onChange, editable = true }: JournalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: false,
        codeBlock: false,
        code: false,
      }),
      Placeholder.configure({
        placeholder: randomPlaceholder,
        emptyNodeClass: 'is-editor-empty',
      }),
      CharacterCount,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'tiptap-prose focus:outline-none',
        spellcheck: 'true',
      },
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({
    onClick, active, children, title
  }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-150',
        active
          ? 'text-[var(--color-sage-dark)] bg-[var(--mood-calm-bg)]'
          : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
      )}
    >
      {children}
    </button>
  );

  const wordCount = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className="tiptap-editor flex flex-col gap-0">
      {/* Toolbar — only in edit mode */}
      {editable && (
        <div className={cn(
          'flex items-center gap-1 px-4 py-2.5 border-b border-[var(--color-border)]',
          'sticky top-0 z-10 glass rounded-t-2xl'
        )}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={15} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={15} />
          </ToolbarButton>

          <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading"
          >
            <Heading2 size={15} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote size={15} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="List"
          >
            <List size={15} />
          </ToolbarButton>

          {/* Word count */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--color-text-ghost)]">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="px-6 py-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
