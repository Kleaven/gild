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

  const [{ profile }, { membership }, space, postsResult] = await Promise.all([
    requireAuth(),
    getCommunityContext(communityId),
    getSpace(supabase, spaceId),
    getFeedPosts(supabase, communityId, spaceId, { limit: 20 }),
  ]);

  if (!space) {
    notFound();
  }

  const canPin =
    membership?.role === 'owner' ||
    membership?.role === 'moderator' ||
    membership?.role === 'admin';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{space.name}</h1>

      <FeedClient
        initialPosts={postsResult.data}
        communityId={communityId}
        spaceId={spaceId}
        spaceName={space.name}
        spaceType={space.type}
        author={{
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        }}
        canPin={canPin}
      />
    </div>
  );
}
