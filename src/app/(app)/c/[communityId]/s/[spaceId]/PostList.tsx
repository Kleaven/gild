'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FeedPost } from '@/lib/feed';
import { useRealtimePosts } from '@/hooks';

type Props = {
  initialPosts: FeedPost[];
  communityId: string;
  spaceId: string;
};

// PostList renders the feed and subscribes to new posts via Realtime.
// On INSERT event: router.refresh() re-fetches the Server Component so
// initialPosts contains the full FeedPost (with author, counts etc).
// No partial payload merging — the realtime payload lacks joined fields.

export default function PostList({ initialPosts, communityId, spaceId }: Props) {
  const router = useRouter();

  useRealtimePosts(communityId, spaceId, () => {
    router.refresh();
  });

  if (initialPosts.length === 0) {
    return (
      <p style={{ color: '#888', textAlign: 'center', paddingTop: 32 }}>
        No posts yet. Be the first to post.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {initialPosts.map((post) => (
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
  );
}
