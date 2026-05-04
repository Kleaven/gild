import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity } from '@/lib/community';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
  searchParams: Promise<{ checkout?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const { checkout } = await searchParams;

  // No searchParams — user landed here directly
  if (!checkout) {
    redirect(`/onboarding/${communityId}/plan`);
  }

  // Checkout was cancelled — let them retry
  if (checkout === 'cancelled') {
    return (
      <>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
          Checkout cancelled
        </h1>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
          No worries — you can choose a plan whenever you&apos;re ready.
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link
            href={`/onboarding/${communityId}/plan`}
            style={{
              display: 'inline-block',
              background: '#000',
              color: '#fff',
              borderRadius: 9,
              padding: '13px 32px',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to plans →
          </Link>
        </div>
      </>
    );
  }

  // checkout === 'success' — verify the subscription landed
  const supabase = await getSupabaseServerClient();
  const community = await getCommunity(supabase, communityId);
  if (!community) notFound();

  const isActive =
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing';

  if (isActive) {
    redirect(`/onboarding/${communityId}/customize`);
  }

  // Webhook hasn't fired yet — ask user to refresh
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
        Confirming your subscription…
      </h1>
      <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
        We&apos;re waiting for Stripe to confirm your payment. This usually takes a few seconds.
      </p>
      <div style={{ textAlign: 'center' }}>
        <Link
          href={`/onboarding/${communityId}/checkout?checkout=success`}
          style={{
            display: 'inline-block',
            background: '#000',
            color: '#fff',
            borderRadius: 9,
            padding: '13px 32px',
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Refresh status →
        </Link>
      </div>
      <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 16 }}>
        If this persists, check your email for a Stripe receipt and{' '}
        <a href="mailto:support@gild.app" style={{ color: '#888' }}>
          contact support
        </a>
        .
      </p>
    </>
  );
}
