'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import type { DirectMessage } from '@/lib/dm';
import { env } from '@/lib/env';

/**
 * Subscribes to direct_messages INSERTs delivered to the current user from
 * a specific counterpart. Sub-50ms append path: realtime → onNewMessage →
 * caller pushes to local state. No router.refresh() — that would yank focus
 * out of the composer mid-typing.
 *
 * Outgoing messages handled optimistically by the caller; we don't subscribe
 * to messages where the current user is the sender because the optimistic
 * append + INSERT-result reconciliation already covers that.
 *
 * Why a single subscription per drawer-open (not per-counterpart globally):
 *   The drawer focuses one conversation at a time. Subscribing globally to
 *   "anything addressed to me" would force us to filter client-side AND
 *   handle out-of-conversation notifications — a separate feature (notif
 *   badges) handled elsewhere.
 */
export function useDirectMessages(
  currentUserId: string,
  otherUserId: string | null,
  onNewMessage: (msg: DirectMessage) => void,
): void {
  useEffect(() => {
    if (!otherUserId) return;

    const supabase = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    // Filter at the realtime layer — Postgres-side equality on sender_id,
    // RLS will still filter receiver_id = me so we're double-safe.
    const channel = supabase
      .channel(`dm:${currentUserId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${otherUserId}`,
        },
        (payload) => {
          const row = payload.new as DirectMessage;
          // Defensive check: realtime filter is server-side but RLS could
          // theoretically deliver an unrelated row if a future policy
          // change widens the predicate. Confirm we're the receiver.
          if (row.receiver_id === currentUserId) {
            onNewMessage(row);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, onNewMessage]);
}
