'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCheckoutSession } from '@/app/actions';
import type { Plan } from '@/lib/billing/plans';
import type { CheckoutReturnContext } from '@/lib/billing/subscription';

type Props = {
  communityId: string;
  plan: Plan;
  label: string;
  returnContext: CheckoutReturnContext;
};

export default function PlanSelector({ communityId, plan, label, returnContext }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChoose() {
    setError(null);
    startTransition(async () => {
      try {
        const { url } = await createCheckoutSession(
          communityId,
          plan,
          returnContext,
        );
        router.push(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start checkout');
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleChoose}
        disabled={isPending}
        style={{
          display: 'block',
          width: '100%',
          background: plan === 'pro' ? '#000' : '#fff',
          color: plan === 'pro' ? '#fff' : '#000',
          border: '2px solid #000',
          borderRadius: 9,
          padding: '12px 0',
          fontSize: 15,
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
          marginTop: 16,
        }}
      >
        {isPending ? 'Redirecting to checkout…' : `Choose ${label} →`}
      </button>
      {error && (
        <p style={{ color: '#c00', fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
}
