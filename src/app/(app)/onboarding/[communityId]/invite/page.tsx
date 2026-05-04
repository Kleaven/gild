import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity } from '@/lib/community';
import { env } from '@/lib/env';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ communityId: string }> };

export default async function InvitePage({ params }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const supabase = await getSupabaseServerClient();
  const community = await getCommunity(supabase, communityId);
  if (!community) notFound();

  const isActive =
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing';
  if (!isActive) {
    redirect(`/onboarding/${communityId}/plan`);
  }

  const inviteLink = `${env.NEXT_PUBLIC_APP_URL}/c/${community.slug}/join`;

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
        Invite your members
      </h1>
      <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
        Step 6 of 7 — Share your invite link to get people in.
      </p>

      <div
        style={{
          border: '1.5px solid #e0e0e0',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: '#555',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {inviteLink}
        </span>
      </div>

      <p
        style={{
          fontSize: 13,
          color: '#aaa',
          textAlign: 'center',
          marginBottom: 28,
          border: '1.5px dashed #e8e8e8',
          borderRadius: 8,
          padding: 16,
        }}
      >
        Email invites &amp; CSV import coming soon
      </p>

      <Link
        href={`/onboarding/${communityId}/done`}
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
        Continue →
      </Link>

      <p style={{ textAlign: 'center', marginTop: 12 }}>
        <Link
          href={`/onboarding/${communityId}/done`}
          style={{ fontSize: 13, color: '#aaa', textDecoration: 'underline' }}
        >
          Skip for now
        </Link>
      </p>
    </>
  );
}
