'use client';

import { useOptimistic, useTransition, useState } from 'react';
import type { FeedPost } from '@/lib/feed';
import { createPost, deletePost, pinPost } from '@/app/actions';
import PostForm from './PostForm';
import PostList from './PostList';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OptimisticAuthor = {
  display_name: string;
  avatar_url: string | null;
};

/** FeedPost augmented with a local _optimistic flag (not in DB type). */
type OptimisticFeedPost = FeedPost & { _optimistic?: true };

type FeedAction =
  | { type: 'add'; post: OptimisticFeedPost }
  | { type: 'remove'; postId: string }
  | { type: 'pin'; postId: string; pin: boolean };

function feedReducer(
  state: OptimisticFeedPost[],
  action: FeedAction,
): OptimisticFeedPost[] {
  switch (action.type) {
    case 'add':
      return [action.post, ...state];
    case 'remove':
      return state.filter((p) => p.id !== action.postId);
    case 'pin':
      return state.map((p) =>
        p.id === action.postId ? { ...p, is_pinned: action.pin } : p,
      );
    default:
      return state;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  initialPosts: FeedPost[];
  communityId: string;
  spaceId: string;
  spaceName: string;
  spaceType: string;
  author: OptimisticAuthor;
  hue?: number;
  canPin?: boolean;
};

// ─── FeedClient ───────────────────────────────────────────────────────────────

export default function FeedClient({
  initialPosts,
  communityId,
  spaceId,
  spaceName,
  spaceType,
  author,
  hue,
  canPin = false,
}: Props) {
  const [, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const [optimisticPosts, dispatch] = useOptimistic<
    OptimisticFeedPost[],
    FeedAction
  >(initialPosts as OptimisticFeedPost[], feedReducer);

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async function handleCreate(title: string, body: string): Promise<void> {
    const tempId = crypto.randomUUID();
    const optimisticPost: OptimisticFeedPost = {
      id: tempId,
      title: title || null,
      body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      author_id: null,
      community_id: communityId,
      space_id: spaceId,
      like_count: 0,
      comment_count: 0,
      is_pinned: false,
      is_locked: false,
      hot_score: 0,
      search_vector: null,
      author: {
        display_name: author.display_name,
        avatar_url: author.avatar_url,
      },
      space: {
        name: spaceName,
        type: spaceType as FeedPost['space']['type'],
      },
      viewer_has_voted: false,
      _optimistic: true,
    };

    setFormError(null);

    startTransition(async () => {
      dispatch({ type: 'add', post: optimisticPost });
      try {
        await createPost({ communityId, spaceId, title: title || undefined, body });
        // revalidatePath in server action drives router.refresh, replacing optimistic state
      } catch (err) {
        dispatch({ type: 'remove', postId: tempId });
        setFormError(err instanceof Error ? err.message : 'Failed to create post');
      }
    });
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  function handleDelete(postId: string) {
    const snapshot = optimisticPosts.find((p) => p.id === postId);
    if (!snapshot) return;

    startTransition(async () => {
      dispatch({ type: 'remove', postId });
      try {
        await deletePost(postId);
      } catch {
        // Restore the removed post on failure
        dispatch({ type: 'add', post: snapshot });
      }
    });
  }

  // ─── PIN ───────────────────────────────────────────────────────────────────

  function handlePin(postId: string, pin: boolean) {
    startTransition(async () => {
      dispatch({ type: 'pin', postId, pin });
      try {
        await pinPost(postId, pin);
      } catch {
        dispatch({ type: 'pin', postId, pin: !pin });
      }
    });
  }

  return (
    <>
      <PostForm
        communityId={communityId}
        spaceId={spaceId}
        onSubmit={handleCreate}
        externalError={formError}
        onClearError={() => setFormError(null)}
      />
      <PostList
        posts={optimisticPosts as FeedPost[]}
        communityId={communityId}
        spaceId={spaceId}
        hue={hue}
        canPin={canPin}
        onDelete={handleDelete}
        onPin={handlePin}
      />
    </>
  );
}
