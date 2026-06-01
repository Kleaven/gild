import { notFound } from 'next/navigation';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { listTiers } from '@/lib/community/tiers';
import { getMembershipState, confirmTierCheckout } from '@/lib/billing/member-subscription';
import { MembershipClient } from './MembershipClient';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function MembershipPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { session_id: checkoutSessionId } = await searchParams;

  const { community, membership } = await getCommunityContextBySlug(slug);
  if (!community) notFound();
  if (!membership) notFound(); // members only

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Returned from Checkout here → confirm + grant immediately.
  if (checkoutSessionId) {
    try {
      await confirmTierCheckout(community.id, checkoutSessionId, user.id);
    } catch {
      // webhook is the backstop
    }
  }

  const tiers = await listTiers(community.id);
  const state = await getMembershipState(community.id, user.id);

  return (
    <MembershipClient
      communityId={community.id}
      communitySlug={slug}
      communityName={community.name}
      tiers={tiers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        priceMonthUsd: t.priceMonthUsd,
        position: t.position,
      }))}
      state={state}
    />
  );
}
