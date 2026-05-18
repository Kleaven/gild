import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCommunityContextBySlug } from '../../../../lib/community/context';
import { isAccessGranted } from '@/lib/billing';
import { requireAuth } from '@/lib/auth';
import { getFlag } from '@/lib/feature-flags';
import { StudioSidebar, NotificationListener, JoinGate, WelcomeHandler, GildChatProvider, GildChatDrawer } from '@/components/gild';
import type { Person } from '@/components/gild';
import type { CommunityBillingState, SubscriptionStatus } from '@/lib/billing';
import type { Plan } from '@/lib/billing';

const SLUG_RE = /^[a-z0-9-]{3,50}$/;

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function CommunityLayout({ children, params }: Props) {
  const { slug } = await params;

  if (!SLUG_RE.test(slug)) {
    notFound();
  }

  const { community, membership, spaces } = await getCommunityContextBySlug(slug);
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

  const communityId = community.id;

  // Join Gate — non-members must join to see community content
  if (!membership) {
    return (
      <JoinGate
        community={{
          id: community.id,
          slug: community.slug,
          name: community.name,
          description: community.description,
          member_count: community.member_count,
          welcome_message: community.welcome_message,
          theme_hue: community.theme_hue,
          pricing_type: community.pricing_type as 'free' | 'paid',
          price_amount: Number(community.price_amount || 0),
          price_currency: community.price_currency,
        }}
      />
    );
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
            href={`/c/${slug}/settings`}
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
            href={`/c/${slug}/billing`}
            style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
          >
            Resubscribe to reactivate.
          </Link>
        </>
      );
    }
  }

  return (
    <GildChatProvider>
      <NotificationListener communityId={communityId} communitySlug={slug} />
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
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 49px)',
      // @ts-ignore
      '--theme-hue': community.theme_hue || 250
    } as React.CSSProperties}>
      <WelcomeHandler
        communityName={community.name}
        welcomeMessage={community.welcome_message}
      />
      <StudioSidebar
        community={{
          id: communityId,
          name: community.name,
          member_count: community.member_count,
          plan: community.plan,
          theme_hue: community.theme_hue,
          welcome_message: community.welcome_message,
          goodbye_message: community.goodbye_message,
          is_private: community.is_private,
          slug: community.slug,
        }}
        spaces={feedSpaces}
        currentUser={currentUser}
        showCourses={showCourses}
      />

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
    {/* Sliding chat overlay — anchored at layout root so it floats above
        all community-scoped pages without affecting URL state. */}
    <GildChatDrawer currentUserId={profile.id} />
    </GildChatProvider>
  );
}
