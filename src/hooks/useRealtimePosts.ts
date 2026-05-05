'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import { env } from '@/lib/env';

// ─── RealtimePostPayload ──────────────────────────────────────────────────────
// Derived from the posts table Row — only fields present in the INSERT payload.
// author, vote counts, and space metadata are NOT included — callers must
// router.refresh() to get a fully hydrated FeedPost.

type PostRow = Database['public']['Tables']['posts']['Row'];
export type RealtimePostPayload = Pick<
  PostRow,
  'id' | 'title' | 'author_id' | 'created_at' | 'space_id'
>;

// ─── useRealtimePosts ─────────────────────────────────────────────────────────
// Subscribes to INSERT events on the posts table filtered by spaceId.
// Browser client created inside useEffect — never at module level.
// Cleanup removes the channel on unmount or when deps change.

export function useRealtimePosts(
  communityId: string,
  spaceId: string,
  onNewPost: (post: RealtimePostPayload) => void,
): void {
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    const channel = supabase
      .channel(`posts:${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `space_id=eq.${spaceId}`,
        },
        (payload) => {
          onNewPost(payload.new as RealtimePostPayload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, spaceId]);
}
