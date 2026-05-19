'use client';

import { useState, useTransition } from 'react';
import { joinCommunity } from '@/app/actions';
import { WelcomeModal } from '@/components/gild/WelcomeModal';

type Props = { communityId: string; communitySlug: string };

export default function JoinButton({ communityId, communitySlug }: Props) {
  const [isPending, startTransition] = useTransition();
  const [welcomeData, setWelcomeData] = useState<{ name: string; message: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      try {
        const inviteToken =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('invite')
            : null;
        const result = await joinCommunity(communityId, inviteToken);
        if (result.ok) {
          // Show the welcome modal first. The modal-close handler does
          // a hard navigation — see below for why we don't use
          // router.refresh() / router.push() in this flow.
          setWelcomeData({ name: result.name, message: result.welcome_message });
          return;
        }
        // Predictable failure — surface the message inline. For
        // already_member specifically, the user IS in the community, so
        // we send them in instead of just showing an error.
        // Hard navigation (not router.push) so middleware refreshes the
        // membership-aware layout cleanly and to preempt the @supabase/ssr
        // cookie-rotation hazard that bit deleteCommunity at c322e5d.
        if (result.code === 'already_member') {
          window.location.assign(`/c/${communitySlug}`);
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
            // Hard navigation — the user just transitioned from non-member
            // to member, and the community route's layout reads membership
            // state from the SSR cookie. router.push + the resulting RSC
            // re-render can hit the @supabase/ssr token-rotation silent-
            // failure path (see deleteCommunity fix at c322e5d) and strand
            // the access token. Hard nav forces a fresh request through
            // middleware so cookies refresh cleanly.
            window.location.assign(`/c/${communitySlug}`);
          }}
        />
      )}
    </>
  );
}
