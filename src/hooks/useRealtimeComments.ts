'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import { env } from '@/lib/env';

// ─── RealtimeCommentPayload ───────────────────────────────────────────────────
// Derived from the comments table Row — only fields present in the INSERT payload.
// author, vote counts, and reply_count are NOT included — callers must
// router.refresh() to get a fully hydrated CommentNode.

type CommentRow = Database['public']['Tables']['comments']['Row'];
export type RealtimeCommentPayload = Pick<
  CommentRow,
  'id' | 'body' | 'author_id' | 'created_at' | 'post_id'
>;

// ─── useRealtimeComments ──────────────────────────────────────────────────────
// Subscribes to INSERT events on the comments table filtered by postId.
// Browser client created inside useEffect — never at module level.
// Cleanup removes the channel on unmount or when postId changes.

export function useRealtimeComments(
  postId: string,
  onNewComment: (comment: RealtimeCommentPayload) => void,
): void {
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          onNewComment(payload.new as RealtimeCommentPayload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);
}
