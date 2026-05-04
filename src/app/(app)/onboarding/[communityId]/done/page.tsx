import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity, getSpaces } from '@/lib/community';
import { getPlanLabel } from '@/lib/billing';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ communityId: string }> };

export default async function DonePage({ params }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const supabase = await getSupabaseServerClient();
  const [community, spaces] = await Promise.all([
    getCommunity(supabase, communityId),
    getSpaces(supabase, communityId),
  ]);
  if (!community) notFound();

  const isActive =
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing';
  if (!isActive) {
    redirect(`/onboarding/${communityId}/plan`);
  }

  const planLabel = getPlanLabel(community.plan as 'hobby' | 'pro');

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          You&apos;re all set!
        </h1>
        <p style={{ fontSize: 14, color: '#888' }}>
          Step 7 of 7 — Your community is live and ready.
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          border: '1.5px solid #e0e0e0',
          borderRadius: 12,
          padding: '20px 20px',
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <SummaryRow label="Community" value={community.name} />
        <SummaryRow label="Plan" value={`${planLabel} — 14-day free trial`} />
        <SummaryRow
          label="Spaces"
          value={spaces.length > 0 ? spaces.map((s) => `#${s.name}`).join(', ') : 'None yet'}
        />
        <SummaryRow label="Status" value="Active ✓" />
      </div>

      <Link
        href={`/c/${communityId}`}
        style={{
          display: 'block',
          textAlign: 'center',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 9,
          padding: '13px 0',
          fontSize: 15,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Go to my community →
      </Link>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: '#888', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#111', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  );
}
