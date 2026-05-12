import { cache } from 'react';
import { getSupabaseServerClient } from '../auth/server';
import { getCommunity, getMembership, getSpaces } from './index';
import type { Community, CommunityMember, Space } from './index';

export type CommunityContext = {
  community: Community | null;
  membership: CommunityMember | null;
  spaces: Space[];
};

export const getCommunityContext = cache(async (communityId: string): Promise<CommunityContext> => {
  const supabase = await getSupabaseServerClient();
  const results = await Promise.allSettled([
    getCommunity(supabase, communityId),
    getMembership(supabase, communityId),
    getSpaces(supabase, communityId),
  ]);

  const community = results[0].status === 'fulfilled' ? results[0].value : null;
  const membership = results[1].status === 'fulfilled' ? results[1].value : null;
  const spaces = results[2].status === 'fulfilled' ? results[2].value : [];

  if (results.some(r => r.status === 'rejected')) {
    console.error('[getCommunityContext] some fetches failed', results.filter(r => r.status === 'rejected'));
  }
  return { community, membership, spaces };
});
