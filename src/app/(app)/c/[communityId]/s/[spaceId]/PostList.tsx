'use client';

import { useRouter } from 'next/navigation';
import type { FeedPost } from '@/lib/feed';
import { useRealtimePosts } from '@/hooks';
import { StudioPostCard } from '@/components/gild';

type Props = {
  posts: FeedPost[];
  communityId: string;
  spaceId: string;
  hue?: number;
  canPin?: boolean;
  onDelete: (postId: string) => void;
  onPin: (postId: string, pin: boolean) => void;
};

// PostList renders the optimistic feed and subscribes to new posts via Realtime.
// On INSERT event: router.refresh() re-fetches the Server Component so
// initialPosts (and thus the optimistic base) contains the full FeedPost.
export default function PostList({
  posts,
  communityId,
  spaceId,
  hue,
  canPin = false,
  onDelete,
  onPin,
}: Props) {
  const router = useRouter();

  useRealtimePosts(communityId, spaceId, () => {
    router.refresh();
  });

  if (posts.length === 0) {
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
      {posts.map((post) => (
        <StudioPostCard
          key={post.id}
          post={{ ...post, author: post.author ?? undefined }}
          communityId={communityId}
          spaceId={spaceId}
          hue={hue}
          canPin={canPin}
          onDelete={onDelete}
          onPin={onPin}
        />
      ))}
    </div>
  );
}
