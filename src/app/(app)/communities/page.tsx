import { getSupabaseServerClient } from '@/lib/auth/server';
import { getDiscoverCommunities } from '@/lib/community';
import { StudioDiscover } from '@/components/StudioDiscover';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const supabase = await getSupabaseServerClient();
  const communities = await getDiscoverCommunities(supabase, { limit: 50 });

  return <StudioDiscover initialCommunities={communities} />;
}
