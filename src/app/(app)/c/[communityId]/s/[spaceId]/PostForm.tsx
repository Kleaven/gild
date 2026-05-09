'use client';

import { useState } from 'react';
import { GILD_FONTS } from '@/components/gild';

type Props = {
  communityId: string;
  spaceId: string;
  /** Called with (title, body) when user submits. Caller owns the server action. */
  onSubmit: (title: string, body: string) => Promise<void>;
  /** Error injected from parent (e.g. after optimistic rollback). */
  externalError?: string | null;
  onClearError?: () => void;
};

export default function PostForm({ onSubmit, externalError, onClearError }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const error = externalError ?? localError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLocalError(null);
    onClearError?.();
    setIsPending(true);
    try {
      await onSubmit(title, body);
      setTitle('');
      setBody('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'oklch(0.985 0.003 250)',
        border: '1px solid oklch(0.92 0.01 250)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: GILD_FONTS.sans,
      }}
    >
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        style={{
          padding: '10px 14px',
          border: '1px solid oklch(0.90 0.01 250)',
          borderRadius: 8,
          fontSize: 14,
          outline: 'none',
          background: '#fff',
          fontFamily: 'inherit',
        }}
      />
      <textarea
        placeholder="What's on your mind?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={3}
        style={{
          padding: '10px 14px',
          border: '1px solid oklch(0.90 0.01 250)',
          borderRadius: 8,
          fontSize: 14,
          outline: 'none',
          background: '#fff',
          fontFamily: 'inherit',
          resize: 'vertical',
          minHeight: 80,
        }}
      />
      {error && <p style={{ color: '#c00', fontSize: 13, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: 'oklch(0.55 0.02 250)', margin: 0 }}>
          Markdown supported
        </p>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            background: 'oklch(0.20 0.02 250)',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
