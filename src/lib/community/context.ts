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
  if (communityId === '00000000-0000-0000-0000-000000000010') {
    return {
      community: {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'Gild Public Demo',
        slug: 'gild-public-demo',
        description: 'A high-end community for testing Gild UI.',
        is_private: false,
        member_count: 242,
        plan: 'pro',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        owner_id: '00000000-0000-0000-0000-000000000000',
        logo_url: null,
        banner_url: null,
        trial_ends_at: null,
      },
      membership: {
        id: 'mock-membership',
        community_id: '00000000-0000-0000-0000-000000000010',
        user_id: 'mock-user',
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
      spaces: [
        {
          id: 'mock-space-1',
          community_id: '00000000-0000-0000-0000-000000000010',
          name: 'general',
          slug: 'general',
          description: 'The main lounge.',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          position: 0,
        }
      ],
    };
  }

  const [community, membership, spaces] = await Promise.all([
    getCommunity(supabase, communityId),
    getMembership(supabase, communityId),
    getSpaces(supabase, communityId),
  ]);
  return { community, membership, spaces };
});
