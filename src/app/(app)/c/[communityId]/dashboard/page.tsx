import { notFound, redirect } from 'next/navigation';
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
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</div>
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
    redirect('/sign-in');
  }

  const { community, membership } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const isAdminOrOwner = membership?.role === 'owner' || membership?.role === 'admin';
  if (!isAdminOrOwner) {
    redirect(`/c/${communityId}`);
  }

  const stats: DashboardStats = await getDashboardStats(communityId);
  const isOwner = membership?.role === 'owner';

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Creator Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{community.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Members" value={stats.memberCount} />
        <StatCard label="Posts" value={stats.postCount} />
        <StatCard label="Spaces" value={stats.spaceCount} />
        <StatCard label="Courses" value={stats.courseCount} />
      </div>

      {/* Quick links */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Manage</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/c/${communityId}/members`}
            className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors no-underline"
          >
            Members
          </Link>
          <Link
            href={`/c/${communityId}/search`}
            className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors no-underline"
          >
            Search
          </Link>
        </div>
      </div>

      {/* Billing card — owner only */}
      {isOwner && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Billing</h2>
          <p className="text-sm text-gray-600 mb-4">
            Plan:{' '}
            <strong className="capitalize">{community.plan ?? 'None'}</strong>
            {community.subscription_status && (
              <>
                {' '}
                &mdash; Status:{' '}
                <strong className="capitalize">
                  {community.subscription_status.replace('_', ' ')}
                </strong>
              </>
            )}
          </p>
          <Link
            href={`/onboarding/${communityId}/plan`}
            className="inline-block px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors no-underline"
          >
            Manage Subscription
          </Link>
        </div>
      )}
    </div>
  );
}
