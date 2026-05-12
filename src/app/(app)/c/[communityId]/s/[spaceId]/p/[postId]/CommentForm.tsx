'use client';

import { useState, useTransition } from 'react';
import { createComment } from '@/app/actions';
import { GILD_FONTS } from '@/components/gild';

export default function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    const content = body;
    setBody('');

    startTransition(async () => {
      try {
        await createComment({ postId, parentId: null, body: content });
      } catch (err) {
        // Simple error handling for now, would typically use a toast
        console.error('Failed to post comment', err);
        setBody(content);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, fontFamily: GILD_FONTS.sans }}>
      <textarea
        id="comment-body"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid oklch(0.90 0.01 250)',
          fontFamily: 'inherit',
          fontSize: 14,
          resize: 'vertical',
          minHeight: 80,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 10,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={!body.trim() || isPending}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: !body.trim() || isPending ? 'oklch(0.85 0.01 250)' : 'oklch(0.20 0.02 250)',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: !body.trim() || isPending ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {isPending ? 'Posting...' : 'Post comment'}
        </button>
      </div>
    </form>
  );
}
