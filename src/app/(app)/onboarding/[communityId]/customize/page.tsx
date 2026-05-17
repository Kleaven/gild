import { redirect, notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity } from '@/lib/community';
import { GILD_FONTS } from '@/components/gild';
import CustomizeClient from './CustomizeClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ communityId: string }> };

export default async function CustomizePage({ params }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const supabase = await getSupabaseServerClient();
  const community = await getCommunity(supabase, communityId);
  if (!community) notFound();

  const isActive =
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing';
  if (!isActive) {
    redirect(`/onboarding/${communityId}/plan`);
  }

  return (
    <>
      <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 24, fontWeight: 800, marginBottom: 6, textAlign: 'center', letterSpacing: '-0.03em' }}>
        Customize your community
      </h1>
      <p style={{ fontSize: 14, color: 'oklch(0.55 0.02 250)', textAlign: 'center', marginBottom: 28 }}>
        Step 4 of 7 — Add branding and pick your spaces.
      </p>

      <CustomizeClient
        communityId={communityId}
        existingLogoUrl={community.logo_url}
        existingBannerUrl={community.banner_url}
      />
    </>
  );
}
