import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { requireAuth } from '@/lib/auth';
import { getSpace } from '@/lib/community';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getFeedPosts } from '@/lib/feed';
import { getFlag } from '@/lib/feature-flags';
import FeedClient from './FeedClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ slug: string; spaceId: string }>;
};

export default async function SpacePage({ params }: Props) {
  const { slug, spaceId } = await params;

  if (!UUID_RE.test(spaceId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();

  const [{ user, profile }, { community, membership }, space] = await Promise.all([
    requireAuth(),
    getCommunityContextBySlug(slug),
    getSpace(supabase, spaceId),
  ]);

  if (!space || !community) {
    notFound();
  }

  const communityId = community.id;
  const [postsResult, reactionsFlag] = await Promise.all([
    getFeedPosts(supabase, communityId, spaceId, { limit: 20 }),
    getFlag('reactions', communityId),
  ]);

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
      communitySlug={slug}
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
      currentUserRole={membership?.role}
      communityMemberCount={community.member_count}
      reactionsEnabled={reactionsFlag.enabled}
    />
  );
}
