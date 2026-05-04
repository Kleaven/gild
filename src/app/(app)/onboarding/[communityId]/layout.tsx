import { notFound, redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity, getMembership } from '@/lib/community';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  children: React.ReactNode;
  params: Promise<{ communityId: string }>;
};

export default async function OnboardingCommunityLayout({ children, params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();

  const [community, membership] = await Promise.all([
    getCommunity(supabase, communityId),
    getMembership(supabase, communityId),
  ]);

  if (!community) {
    notFound();
  }

  // Only the community owner can access their own onboarding flow
  if (!membership || membership.role !== 'owner') {
    redirect('/onboarding');
  }

  return <>{children}</>;
}
