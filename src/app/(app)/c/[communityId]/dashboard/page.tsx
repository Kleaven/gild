import { notFound, redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContext } from '../../../../../lib/community/context';
import { getDashboardStats } from '@/lib/community';
import { getFeedPosts } from '@/lib/feed/queries';
import { StudioDashboard } from './StudioDashboard';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

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

  const [stats, feedResult, { data: profile }] = await Promise.all([
    getDashboardStats(communityId),
    getFeedPosts(supabase, communityId, null, { limit: 5 }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  return (
    <StudioDashboard
      community={{
        id: community.id,
        name: community.name,
        plan: community.plan,
        subscription_status: community.subscription_status,
      }}
      membership={{
        role: membership.role,
      }}
      stats={stats}
      recentPosts={feedResult.data}
      user={{
        id: user.id,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
      }}
    />
  );
}
