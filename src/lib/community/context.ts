import { cache } from 'react';
import { getSupabaseServerClient } from '../auth/server';
import { getCommunity, getCommunityBySlug, getMembership, getSpaces } from './index';
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

// Resolves a slug to a UUID then calls the cached getCommunityContext so all
// pages under c/[slug] deduplicate to one DB round-trip per request.
export async function getCommunityContextBySlug(slug: string): Promise<CommunityContext> {
  const supabase = await getSupabaseServerClient();
  const community = await getCommunityBySlug(supabase, slug);
  if (!community) return { community: null, membership: null, spaces: [] };
  return getCommunityContext(community.id);
}
