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
    const { data: profile } = await supabase
      .from('profiles')
      .select('persona')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !profile.persona) {
      redirect('/onboarding');
    }

    // Redirect to first community, or show CTA if none. Routes are
    // slug-keyed (post-S1 rename), so we JOIN to communities and grab
    // the slug in the same round-trip — sending the user to /c/<uuid>
    // would just bounce them to 404.
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id, communities!inner(slug, deleted_at)')
      .eq('user_id', user.id)
      .neq('role', 'banned')
      .is('communities.deleted_at', null)
      .limit(1);

    const firstMembership = memberships?.[0];
    const firstSlug = (firstMembership?.communities as { slug?: string } | null)?.slug;
    if (firstSlug) {
      redirect(`/c/${firstSlug}`);
    }

    return <StudioWelcome />;
  }

  // Landing for unauthenticated visitors
  return <StudioLanding />;
}
