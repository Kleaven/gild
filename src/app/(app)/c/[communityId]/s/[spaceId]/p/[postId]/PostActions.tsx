'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleVote, deletePost } from '@/app/actions';
import { ConfirmModal } from '@/components/gild';

type Props = {
  postId: string;
  communityId: string;
  spaceId: string;
  likeCount: number;
  viewerHasVoted: boolean;
  canDelete?: boolean;
};

export default function PostActions({
  postId,
  communityId,
  spaceId,
  likeCount,
  viewerHasVoted,
  canDelete = false,
}: Props) {
  const router = useRouter();
  const [voted, setVoted] = useState(viewerHasVoted);
  const [count, setCount] = useState(likeCount);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

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
    startTransition(async () => {
      await deletePost(postId);
      router.push(`/c/${communityId}/s/${spaceId}`);
    });
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
      <button
        onClick={handleVote}
        disabled={isPending}
        style={{
          background: voted ? 'oklch(0.20 0.02 250)' : 'oklch(0.96 0.005 250)',
          color: voted ? '#fff' : 'oklch(0.30 0.02 250)',
          border: '1px solid',
          borderColor: voted ? 'transparent' : 'oklch(0.90 0.01 250)',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: isPending ? 'default' : 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 14 }}>{voted ? '▲' : '△'}</span>
        {count}
      </button>
      {canDelete && (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          style={{
            background: 'transparent',
            color: 'oklch(0.60 0.15 25)',
            border: 'none',
            fontSize: 13,
            fontWeight: 500,
            cursor: isPending ? 'default' : 'pointer',
            padding: '8px',
            fontFamily: 'inherit',
          }}
        >
          Delete
        </button>
      )}
    </div>
  );
}
