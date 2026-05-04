import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity } from '@/lib/community';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ communityId: string }> };

export default async function CustomizePage({ params }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const supabase = await getSupabaseServerClient();
  const community = await getCommunity(supabase, communityId);
  if (!community) notFound();

  // Must have an active subscription to reach this step
  const isActive =
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing';
  if (!isActive) {
    redirect(`/onboarding/${communityId}/plan`);
  }

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
        Customize your community
      </h1>
      <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
        Step 4 of 7 — Add branding. You can always update this later.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Logo upload — placeholder */}
        <label style={labelStyle}>
          Logo
          <div
            style={{
              border: '1.5px dashed #d0d0d0',
              borderRadius: 8,
              padding: '24px',
              textAlign: 'center',
              color: '#bbb',
              fontSize: 13,
            }}
          >
            Logo upload coming soon
          </div>
        </label>

        {/* Banner upload — placeholder */}
        <label style={labelStyle}>
          Banner image
          <div
            style={{
              border: '1.5px dashed #d0d0d0',
              borderRadius: 8,
              padding: '24px',
              textAlign: 'center',
              color: '#bbb',
              fontSize: 13,
            }}
          >
            Banner upload coming soon
          </div>
        </label>
      </div>

      <Link
        href={`/onboarding/${communityId}/spaces`}
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
          marginTop: 28,
        }}
      >
        Continue →
      </Link>

      <p style={{ textAlign: 'center', marginTop: 12 }}>
        <Link
          href={`/onboarding/${communityId}/spaces`}
          style={{ fontSize: 13, color: '#aaa', textDecoration: 'underline' }}
        >
          Skip for now
        </Link>
      </p>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: '#333',
};
