import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { requireAuth } from '@/lib/auth';
import { getSpace } from '@/lib/community';
import { getCommunityContext } from '@/lib/community/context';
import { getFeedPosts } from '@/lib/feed';
import FeedClient from './FeedClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string; spaceId: string }>;
};

export default async function SpacePage({ params }: Props) {
  const { communityId, spaceId } = await params;

  if (!UUID_RE.test(spaceId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();

  const [{ user, profile }, { community, membership }, space, postsResult] = await Promise.all([
    requireAuth(),
    getCommunityContext(communityId),
    getSpace(supabase, spaceId),
    getFeedPosts(supabase, communityId, spaceId, { limit: 20 }),
  ]);

  if (!space || !community) {
    notFound();
  }

  // Moderators and owners can pin AND delete any post
  const canPin =
    membership?.role === 'owner' ||
    membership?.role === 'moderator' ||
    membership?.role === 'admin';

  // Derive a stable hue from the space ID
  const spaceHue = spaceId.charCodeAt(0) * 10 % 360;

  return (
    <FeedClient
      initialPosts={postsResult.data}
      communityId={communityId}
      spaceId={spaceId}
      spaceName={space.name}
      spaceDesc={space.description}
      spaceType={space.type}
      spaceHue={spaceHue}
      spaceMembersCount={community.member_count}
      allowMemberPosts={space.allow_member_posts}
      author={{
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      }}
      currentUserId={user.id}
      canPin={canPin}
      rolePermissions={space.role_permissions}
      isPrivate={space.is_private}
    />
  );
}
