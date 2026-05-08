import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCommunityContext } from '../../../../lib/community/context';
import { isAccessGranted } from '@/lib/billing';
import { requireAuth } from '@/lib/auth';
import { getFlag } from '@/lib/feature-flags';
import { StudioSidebar } from '@/components/gild';
import type { Person } from '@/components/gild';
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
  const { profile } = await requireAuth();

  const currentUser: Person = {
    id: profile.id,
    name: profile.display_name,
    role: (membership?.role ?? 'free_member') as Person['role'],
    hue: profile.id.charCodeAt(0) * 10 % 360,
    online: true,
  };

  if (!community) {
    notFound();
  }

  // Private community — non-members must join first
  if (community.is_private && !membership) {
    redirect(`/c/${communityId}/join`);
  }

  const feedSpaces = spaces.filter((s) => s.deleted_at === null && s.type !== 'course');

  const coursesFlag = await getFlag('courses_v1', communityId);
  const showCourses = coursesFlag.enabled;

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
      <StudioSidebar
        community={{
          id: communityId,
          name: community.name,
          member_count: community.member_count,
          plan: community.plan,
        }}
        spaces={feedSpaces}
        currentUser={currentUser}
        showCourses={showCourses}
      />

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
    </>
  );
}
