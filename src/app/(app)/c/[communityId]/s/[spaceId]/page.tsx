import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getSpace } from '@/lib/community';
import { getFeedPosts } from '@/lib/feed';
import PostForm from './PostForm';

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

  const posts = postsResult.data;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{space.name}</h1>

      <PostForm communityId={communityId} spaceId={spaceId} />

      {posts.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', paddingTop: 32 }}>
          No posts yet. Be the first to post.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 10,
                padding: '16px 20px',
                background: '#fff',
              }}
            >
              <Link
                href={`/c/${communityId}/s/${spaceId}/p/${post.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {post.title && (
                  <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>{post.title}</h2>
                )}
                <p style={{ fontSize: 14, color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {post.body.slice(0, 200)}
                  {post.body.length > 200 ? '…' : ''}
                </p>
              </Link>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#999' }}>
                <span>{post.author?.display_name ?? 'Unknown'}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span>↑ {post.like_count}</span>
                <span>💬 {post.comment_count}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
