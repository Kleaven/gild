'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { joinCommunity } from '@/app/actions';
import { WelcomeModal } from '@/components/gild/WelcomeModal';

type Props = { communityId: string; communitySlug: string };

export default function JoinButton({ communityId, communitySlug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [welcomeData, setWelcomeData] = useState<{ name: string; message: string | null } | null>(null);

  function handleJoin() {
    startTransition(async () => {
      try {
        const result = await joinCommunity(communityId);
        setWelcomeData({ name: result.name, message: result.welcome_message });
        router.refresh();
      } catch (err) {
        console.error('Failed to join:', err);
      }
    });
  }

  return (
    <>
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
          cursor: isPending ? 'wait' : 'pointer',
        }}
      >
        {isPending ? 'Joining…' : 'Join community'}
      </button>

      {welcomeData && (
        <WelcomeModal
          communityName={welcomeData.name}
          message={welcomeData.message}
          isOpen={true}
          onClose={() => {
            setWelcomeData(null);
            router.push(`/c/${communitySlug}`);
          }}
        />
      )}
    </>
  );
}
