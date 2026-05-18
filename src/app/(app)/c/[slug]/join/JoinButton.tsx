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
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await joinCommunity(communityId);
        if (result.ok) {
          setWelcomeData({ name: result.name, message: result.welcome_message });
          router.refresh();
          return;
        }
        // Predictable failure — surface the message inline. For
        // already_member specifically, the user IS in the community, so
        // we send them in instead of just showing an error.
        if (result.code === 'already_member') {
          router.push(`/c/${communitySlug}`);
          return;
        }
        setError(result.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join. Please try again.');
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

      {error && (
        <p
          role="alert"
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'oklch(0.96 0.04 25)',
            border: '1px solid oklch(0.88 0.08 25)',
            borderRadius: 8,
            color: 'oklch(0.40 0.16 25)',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      )}

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
