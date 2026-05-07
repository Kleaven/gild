import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getCommunityContext } from '../../../../../lib/community/context';
import { getDashboardStats } from '@/lib/community';
import { StudioDashboard } from '@/components/StudioDashboard';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const { profile } = await requireAuth();
  const { community, membership } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const isAdminOrOwner = membership?.role === 'owner' || membership?.role === 'admin';
  if (!isAdminOrOwner) {
    redirect(`/c/${communityId}`);
  }

  const stats = await getDashboardStats(communityId);

  return (
    <StudioDashboard
      community={{
        id: communityId,
        name: community.name,
        plan: community.plan,
        subscription_status: community.subscription_status,
      }}
      membership={{ role: membership!.role }}
      stats={stats}
      user={{
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      }}
    />
  );
}
