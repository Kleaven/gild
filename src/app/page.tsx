import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../lib/auth/server';
import { StudioLanding } from '@/components/StudioLanding';
import { StudioWelcome } from '@/components/StudioWelcome';

export default async function RootPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Redirect to first community, or show CTA if none
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .neq('role', 'banned')
      .limit(1);

    const firstMembership = memberships?.[0];
    if (firstMembership) {
      redirect(`/c/${firstMembership.community_id}`);
    }

    return <StudioWelcome />;
  }

  // Landing for unauthenticated visitors
  return <StudioLanding />;
}
