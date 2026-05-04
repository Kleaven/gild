import { redirect, notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity, getSpaces } from '@/lib/community';
import SpacesStep from './SpacesStep';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ communityId: string }> };

export default async function SpacesPage({ params }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const supabase = await getSupabaseServerClient();
  const [community, spaces] = await Promise.all([
    getCommunity(supabase, communityId),
    getSpaces(supabase, communityId),
  ]);
  if (!community) notFound();

  const isActive =
    community.subscription_status === 'active' ||
    community.subscription_status === 'trialing';
  if (!isActive) {
    redirect(`/onboarding/${communityId}/plan`);
  }

  const spaceNames = spaces.map((s) => s.name);

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
        Create your first spaces
      </h1>
      <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
        Step 5 of 7 — Spaces are channels where your community talks.
      </p>
      <SpacesStep communityId={communityId} initialSpaces={spaceNames} />
    </>
  );
}
