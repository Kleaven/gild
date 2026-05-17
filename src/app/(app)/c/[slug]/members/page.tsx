import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { requireAuth } from '@/lib/auth';
import { getCommunityMembers } from '@/lib/community';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { StudioMembers } from '@/components/StudioMembers';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function MembersPage({ params }: Props) {
  const { slug } = await params;

  const { profile } = await requireAuth();
  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  const communityId = community.id;
  const result = await getCommunityMembers(supabase, communityId, { limit: 50 });
  const members = result.data;

  return (
    <StudioMembers
      community={{
        id: communityId,
        name: community.name,
        member_count: community.member_count,
      }}
      members={members}
      currentUserId={profile.id}
      currentUserRole={membership?.role ?? 'free_member'}
    />
  );
}
