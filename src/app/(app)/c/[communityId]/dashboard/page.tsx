import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContext } from '../../../../../lib/community/context';
import { getDashboardStats } from '@/lib/community';
import type { DashboardStats } from '@/lib/community';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

type StatCardProps = {
  label: string;
  value: number;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: '24px 28px',
        minWidth: 140,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default async function DashboardPage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { community, membership } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const isAdminOrOwner = membership?.role === 'owner' || membership?.role === 'admin';
  if (!isAdminOrOwner) {
    notFound();
  }

  const stats: DashboardStats = await getDashboardStats(communityId);
  const isOwner = membership?.role === 'owner';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Creator Dashboard</h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{community.name}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
        <StatCard label="Members" value={stats.memberCount} />
        <StatCard label="Posts" value={stats.postCount} />
        <StatCard label="Spaces" value={stats.spaceCount} />
        <StatCard label="Courses" value={stats.courseCount} />
      </div>

      {/* Quick links */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Manage</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href={`/c/${communityId}/members`}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#f5f5f5',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#333',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Members
          </Link>
          <Link
            href={`/c/${communityId}/search`}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#f5f5f5',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#333',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Search
          </Link>
        </div>
      </div>

      {/* Billing card — owner only */}
      {isOwner && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 10,
            padding: '24px 28px',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Billing</h2>
          <p style={{ fontSize: 14, color: '#555', margin: '0 0 16px' }}>
            Plan:{' '}
            <strong style={{ textTransform: 'capitalize' }}>{community.plan ?? 'None'}</strong>
            {community.subscription_status && (
              <>
                {' '}
                &mdash; Status:{' '}
                <strong style={{ textTransform: 'capitalize' }}>
                  {community.subscription_status.replace('_', ' ')}
                </strong>
              </>
            )}
          </p>
          <Link
            href={`/onboarding/${communityId}/plan`}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#111',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Manage Subscription
          </Link>
        </div>
      )}
    </div>
  );
}
