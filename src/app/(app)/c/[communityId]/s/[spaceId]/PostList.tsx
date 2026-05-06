'use client';

import { useRouter } from 'next/navigation';
import type { FeedPost } from '@/lib/feed';
import { useRealtimePosts } from '@/hooks';
import { StudioPostCard } from '@/components/gild';

type Props = {
  initialPosts: FeedPost[];
  communityId: string;
  spaceId: string;
  hue?: number;
};

// PostList renders the feed and subscribes to new posts via Realtime.
// On INSERT event: router.refresh() re-fetches the Server Component so
// initialPosts contains the full FeedPost (with author, counts etc).
export default function PostList({ initialPosts, communityId, spaceId, hue }: Props) {
  const router = useRouter();

  useRealtimePosts(communityId, spaceId, () => {
    router.refresh();
  });

  if (initialPosts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ color: 'oklch(0.50 0.02 250)', fontSize: 14 }}>
          No posts yet. Be the first to post.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {initialPosts.map((post) => (
        <StudioPostCard
          key={post.id}
          post={{ ...post, author: post.author ?? undefined }}
          communityId={communityId}
          spaceId={spaceId}
          hue={hue}
        />
      ))}
    </div>
  );
}
