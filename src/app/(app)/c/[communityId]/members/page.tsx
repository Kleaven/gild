import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityMembers } from '@/lib/community';
import { getCommunityContext } from '@/lib/community/context';
import { StudioMembers } from './StudioMembers';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function MembersPage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { community } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const result = await getCommunityMembers(supabase, communityId, { limit: 50 });
  const members = result.data;

  return (
    <StudioMembers 
      community={{
        id: community.id,
        name: community.name,
        member_count: community.member_count,
      }} 
      members={members} 
    />
  );
}
