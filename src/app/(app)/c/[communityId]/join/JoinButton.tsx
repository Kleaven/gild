'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { joinCommunity } from '@/app/actions';

type Props = { communityId: string };

export default function JoinButton({ communityId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleJoin() {
    startTransition(async () => {
      await joinCommunity(communityId);
      router.push(`/c/${communityId}`);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleJoin}
      disabled={isPending}
      style={{
        background: '#000',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '13px 36px',
        fontSize: 16,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {isPending ? 'Joining…' : 'Join community'}
    </button>
  );
}
