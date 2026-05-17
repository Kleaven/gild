'use client';

import { useRouter } from 'next/navigation';
import type { FeedPost } from '@/lib/feed';
import { useRealtimePosts } from '@/hooks';
import { StudioPostCard } from '@/components/gild';

type Props = {
  posts: FeedPost[];
  communitySlug: string;
  spaceId: string;
  spaceName: string;
  /** Auth user id — used to decide whether to show delete on each card. */
  currentUserId: string;
  hue?: number;
  canPin?: boolean;
  onDelete: (postId: string) => void;
  onPin: (postId: string, pin: boolean) => void;
  onVote: (postId: string, optionId: string) => void;
};

// PostList renders the optimistic feed and subscribes to new posts via Realtime.
// On INSERT event: router.refresh() re-fetches the Server Component so
// initialPosts (and thus the optimistic base) gets the real FeedPost.
export default function PostList({
  posts,
  communitySlug,
  spaceId,
  spaceName,
  currentUserId,
  hue,
  canPin = false,
  onDelete,
  onPin,
  onVote,
}: Props) {
  const router = useRouter();

  useRealtimePosts(communitySlug, spaceId, () => {
    router.refresh();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed oklch(0.90 0.01 250)', borderRadius: 12, color: 'oklch(0.50 0.02 250)', fontSize: 13 }}>
          No posts in #{spaceName} yet — be the first.
        </div>
      ) : (
        posts.map((post) => {
          // Show delete only for the post's author (or if canPin = moderator/owner)
          const isOwner = post.author_id === currentUserId;
          const canDelete = isOwner || canPin;

          return (
            <StudioPostCard
              key={post.id}
              post={{ ...post, author: post.author ?? undefined }}
              communitySlug={communitySlug}
              spaceId={spaceId}
              hue={hue}
              canPin={canPin}
              onDelete={canDelete ? onDelete : undefined}
              onPin={onPin}
              onVote={onVote}
            />
          );
        })
      )}
    </div>
  );
}
