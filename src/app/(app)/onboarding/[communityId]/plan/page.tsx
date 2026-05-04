import { redirect, notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity } from '@/lib/community';
import { PLANS } from '@/lib/billing';
import PlanSelector from './PlanSelector';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ communityId: string }> };

export default async function PlanPage({ params }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const supabase = await getSupabaseServerClient();
  const community = await getCommunity(supabase, communityId);
  if (!community) notFound();

  // Already subscribed — skip ahead to customize
  if (
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing'
  ) {
    redirect(`/onboarding/${communityId}/customize`);
  }

  const hobby = PLANS.hobby;
  const pro = PLANS.pro;

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
        Choose your plan
      </h1>
      <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
        Step 2 of 7 — 14-day free trial. Cancel anytime.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Hobby */}
        <div
          style={{
            border: '2px solid #e0e0e0',
            borderRadius: 12,
            padding: '24px 20px',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{hobby.name}</h2>
          <p style={{ fontSize: 26, fontWeight: 800, margin: '0 0 16px' }}>
            ${hobby.monthlyUsd}
            <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>/mo</span>
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 4px', fontSize: 13, color: '#555' }}>
            {hobby.features.map((f) => (
              <li key={f} style={{ padding: '3px 0' }}>✓ {f}</li>
            ))}
          </ul>
          <PlanSelector communityId={communityId} plan="hobby" label={hobby.name} />
        </div>

        {/* Pro */}
        <div
          style={{
            border: '2px solid #000',
            borderRadius: 12,
            padding: '24px 20px',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#000',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 20,
              letterSpacing: '0.5px',
            }}
          >
            POPULAR
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{pro.name}</h2>
          <p style={{ fontSize: 26, fontWeight: 800, margin: '0 0 16px' }}>
            ${pro.monthlyUsd}
            <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>/mo</span>
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 4px', fontSize: 13, color: '#555' }}>
            {pro.features.map((f) => (
              <li key={f} style={{ padding: '3px 0' }}>✓ {f}</li>
            ))}
          </ul>
          <PlanSelector communityId={communityId} plan="pro" label={pro.name} />
        </div>
      </div>
    </>
  );
}
