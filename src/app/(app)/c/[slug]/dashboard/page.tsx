import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getCommunityContextBySlug } from '../../../../../lib/community/context';
import { getDashboardStats } from '@/lib/community';
import { StudioDashboard } from '@/components/StudioDashboard';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { slug } = await params;

  await requireAuth();
  const { community, membership } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  const communityId = community.id;
  const isAdminOrOwner = membership?.role === 'owner' || membership?.role === 'admin';
  if (!isAdminOrOwner) {
    redirect(`/c/${slug}`);
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
      stats={stats}
    />
  );
}
