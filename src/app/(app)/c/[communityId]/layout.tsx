import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCommunityContext } from '../../../../lib/community/context';
import { isAccessGranted } from '@/lib/billing';
import type { CommunityBillingState, SubscriptionStatus } from '@/lib/billing';
import type { Plan } from '@/lib/billing';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  children: React.ReactNode;
  params: Promise<{ communityId: string }>;
};

export default async function CommunityLayout({ children, params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const { community, membership, spaces } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  // Private community — non-members must join first
  if (community.is_private && !membership) {
    redirect(`/c/${communityId}/join`);
  }

  const feedSpaces = spaces.filter((s) => s.deleted_at === null);

  // ─── Billing banner (owner-only) ──────────────────────────────────────────
  const isOwner = membership?.role === 'owner';

  const billingState: CommunityBillingState = {
    plan: community.plan as Plan,
    subscriptionStatus: community.subscription_status as SubscriptionStatus | null,
  };

  // Show "trial ending soon" warning even while access is still granted.
  const trialEndingSoon =
    community.subscription_status === 'trialing' &&
    community.trial_ends_at !== null &&
    new Date(community.trial_ends_at) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const showBillingBanner =
    isOwner &&
    (trialEndingSoon ||
      community.subscription_status === 'past_due' ||
      community.subscription_status === 'canceled' ||
      (!isAccessGranted(billingState) && community.subscription_status !== 'trialing'));

  let billingBannerContent: React.ReactNode = null;
  if (showBillingBanner) {
    if (trialEndingSoon) {
      billingBannerContent = (
        <>
          Your trial ends soon.{' '}
          <Link
            href={`/onboarding/${communityId}/plan`}
            style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
          >
            Upgrade to keep your community active.
          </Link>
        </>
      );
    } else if (community.subscription_status === 'past_due') {
      billingBannerContent = (
        <>
          Payment failed.{' '}
          <Link
            href={`/c/${communityId}/settings`}
            style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
          >
            Update your billing to restore access.
          </Link>
        </>
      );
    } else if (
      community.subscription_status === 'canceled' ||
      !isAccessGranted(billingState)
    ) {
      billingBannerContent = (
        <>
          Your subscription has ended.{' '}
          <Link
            href={`/onboarding/${communityId}/plan`}
            style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
          >
            Resubscribe to reactivate.
          </Link>
        </>
      );
    }
  }

  return (
    <>
      {billingBannerContent && (
        <div
          role="alert"
          style={{
            background: '#b91c1c',
            color: '#fff',
            fontSize: 14,
            padding: '10px 20px',
            textAlign: 'center',
          }}
        >
          {billingBannerContent}
        </div>
      )}
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 49px)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          borderRight: '1px solid #eee',
          padding: '24px 0',
          flexShrink: 0,
          background: '#fafafa',
        }}
      >
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{community.name}</h2>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
            {community.member_count} members
          </p>
        </div>
        <nav style={{ padding: '12px 8px' }}>
          {feedSpaces.map((space) => (
            <Link
              key={space.id}
              href={`/c/${communityId}/s/${space.id}`}
              style={{
                display: 'block',
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#333',
                fontSize: 14,
                marginBottom: 2,
              }}
            >
              {space.name}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12 }}>
            <Link
              href={`/c/${communityId}/members`}
              style={{
                display: 'block',
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#555',
                fontSize: 13,
              }}
            >
              Members
            </Link>
            <Link
              href={`/c/${communityId}/search`}
              style={{
                display: 'block',
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#555',
                fontSize: 13,
              }}
            >
              Search
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
    </>
  );
}
