'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleVote, deletePost } from '@/app/actions';

type Props = {
  postId: string;
  communityId: string;
  spaceId: string;
  likeCount: number;
  viewerHasVoted: boolean;
};

export default function PostActions({
  postId,
  communityId,
  spaceId,
  likeCount,
  viewerHasVoted,
}: Props) {
  const router = useRouter();
  const [voted, setVoted] = useState(viewerHasVoted);
  const [count, setCount] = useState(likeCount);
  const [isPending, startTransition] = useTransition();

  function handleVote() {
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        await toggleVote(postId, 'post');
      } catch {
        // Revert optimistic update on failure
        setVoted(voted);
        setCount(likeCount);
      }
    });
  }

  function handleDelete() {
    if (!confirm('Delete this post?')) return;
    startTransition(async () => {
      await deletePost(postId);
      router.push(`/c/${communityId}/s/${spaceId}`);
    });
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button
        onClick={handleVote}
        disabled={isPending}
        style={{
          background: voted ? '#000' : '#f0f0f0',
          color: voted ? '#fff' : '#333',
          border: 'none',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ↑ {count}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        style={{
          background: 'transparent',
          color: '#c00',
          border: 'none',
          fontSize: 13,
          cursor: 'pointer',
          padding: '6px 0',
        }}
      >
        Delete
      </button>
    </div>
  );
}
