'use client';

import { useState, useTransition } from 'react';
import { createPost } from '@/app/actions';
import { GILD_FONTS } from '@/components/gild';

type Props = {
  communityId: string;
  spaceId: string;
};

export default function PostForm({ communityId, spaceId }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPost({ communityId, spaceId, title: title || undefined, body });
        setTitle('');
        setBody('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create post');
      }
    });
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
