'use client';

import { useState, useTransition } from 'react';
import { createPost } from '@/app/actions';

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
        background: '#f9f9f9',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        style={inputStyle}
      />
      <textarea
        placeholder="What's on your mind?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      {error && <p style={{ color: '#c00', fontSize: 13, margin: 0 }}>{error}</p>}
      <button type="submit" disabled={isPending} style={btnStyle}>
        {isPending ? 'Posting…' : 'Post'}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 11px',
  border: '1.5px solid #ddd',
  borderRadius: 7,
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  background: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  padding: '9px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
