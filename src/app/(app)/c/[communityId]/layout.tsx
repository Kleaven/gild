import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCommunityContext } from '../../../../lib/community/context';
import { isAccessGranted } from '@/lib/billing';
import type { CommunityBillingState, SubscriptionStatus } from '@/lib/billing';
import type { Plan } from '@/lib/billing';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { StudioSidebar } from '@/components/gild/StudioSidebar';
import { GILD_FONTS } from '@/components/gild';
import type { Person } from '@/components/gild';

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

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && communityId !== '00000000-0000-0000-0000-000000000010') {
    redirect('/sign-in');
  }

  // Use a mock user for the sandbox if no real user exists
  const activeUser = user || {
    id: 'mock-user-id',
    email: 'sandbox@gild.app',
  };

  const [{ community, membership, spaces }, { data: profile }] = await Promise.all([
    getCommunityContext(communityId),
    supabase.from('profiles').select('*').eq('id', activeUser.id).single(),
  ]);

  if (!community) {
    notFound();
  }

  // Private community — non-members must join first
  if (community.is_private && !membership) {
    redirect(`/c/${communityId}/join`);
  }

  const activeSpaces = spaces.filter((s) => s.deleted_at === null);

  const currentUser: Person = {
    id: activeUser.id,
    name: profile?.display_name || 'Member',
    role: (membership?.role as Person['role']) || 'free_member',
    hue: (activeUser.id.charCodeAt(0) * 10) % 360,
    online: true,
  };

  // ─── Billing banner (owner-only) ──────────────────────────────────────────
  const isOwner = membership?.role === 'owner';

  const billingState: CommunityBillingState = {
    plan: community.plan as Plan,
    subscriptionStatus: community.subscription_status as SubscriptionStatus | null,
  };

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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      fontFamily: GILD_FONTS.sans,
    }}>
      {billingBannerContent && (
        <div
          role="alert"
          style={{
            background: 'oklch(0.55 0.18 20)',
            color: '#fff',
            fontSize: 14,
            padding: '10px 20px',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {billingBannerContent}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1 }}>
        <StudioSidebar 
          community={{
            id: community.id,
            name: community.name,
            member_count: community.member_count,
            plan: community.plan,
          }}
          spaces={activeSpaces}
          currentUser={currentUser}
        />
        <main style={{ flex: 1, overflow: 'auto', background: '#fff' }}>{children}</main>
      </div>
    </div>
  );
}
