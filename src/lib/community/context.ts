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
  const [community, membership, spaces] = await Promise.all([
    getCommunity(supabase, communityId),
    getMembership(supabase, communityId),
    getSpaces(supabase, communityId),
  ]);
  return { community, membership, spaces };
});
