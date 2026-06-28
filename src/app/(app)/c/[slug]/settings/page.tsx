import { notFound } from 'next/navigation';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getCustomDomainState } from '@/lib/community';
import { isPro } from '@/lib/billing/gates';
import type { Plan } from '@/lib/billing/plans';
import type { SubscriptionStatus } from '@/lib/billing/gates';
import CommunitySettings from './CommunitySettings';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CommunitySettingsPage({ params }: Props) {
  const { slug } = await params;

  const { community, membership } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    notFound();
  }

  // Custom domain is owner-managed; only the owner gets the section.
  const isOwner = membership?.role === 'owner';
  const domainState = isOwner ? await getCustomDomainState(community.id) : null;
  const customDomain = domainState
    ? {
        isPro: isPro({
          plan: community.plan as Plan,
          subscriptionStatus: community.subscription_status as SubscriptionStatus | null,
        }),
        slug,
        initialDomain: domainState.domain,
        initialStatus: domainState.status,
        initialDns: domainState.dns,
      }
    : null;

  return <CommunitySettings community={community} customDomain={customDomain} />;
}
