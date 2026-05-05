import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getSpace } from '@/lib/community';
import { getFeedPosts } from '@/lib/feed';
import PostForm from './PostForm';
import PostList from './PostList';

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

  const [space, postsResult] = await Promise.all([
    getSpace(supabase, spaceId),
    getFeedPosts(supabase, communityId, spaceId, { limit: 20 }),
  ]);

  if (!space) {
    notFound();
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{space.name}</h1>

      <PostForm communityId={communityId} spaceId={spaceId} />

      <PostList
        initialPosts={postsResult.data}
        communityId={communityId}
        spaceId={spaceId}
      />
    </div>
  );
}
