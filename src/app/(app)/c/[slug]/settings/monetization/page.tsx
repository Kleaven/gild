import { notFound } from 'next/navigation';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getConnectStatus, refreshConnectStatus } from '@/lib/billing/connect';
import { listTiers } from '@/lib/community/tiers';
import { MonetizationManager } from './MonetizationManager';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ connect?: string }>;
};

export default async function MonetizationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { connect } = await searchParams;

  const { community, membership } = await getCommunityContextBySlug(slug);
  if (!community) notFound();
  // Payouts belong to the owner — admins/mods don't manage money.
  if (membership?.role !== 'owner') notFound();

  // Returning from Stripe onboarding (or an explicit refresh) → sync live
  // state. Stripe hiccups must degrade to cached status, never 500 the page.
  let status;
  try {
    status =
      connect === 'return' || connect === 'refresh'
        ? await refreshConnectStatus(community.id)
        : await getConnectStatus(community.id);
  } catch {
    status = await getConnectStatus(community.id).catch(() => ({
      accountId: null,
      chargesEnabled: false,
    }));
  }

  // Owner view includes inactive tiers so they can see archived ones.
  const tiers = await listTiers(community.id, true);

  return (
    <MonetizationManager
      communityId={community.id}
      communitySlug={slug}
      initialStatus={status}
      initialTiers={tiers}
    />
  );
}
