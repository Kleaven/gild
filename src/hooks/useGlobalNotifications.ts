'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

export function useGlobalNotifications(communityId: string) {
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`community_notifs:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `community_id=eq.${communityId}`,
        },
        (payload: any) => {
          const newPost = payload.new;
          // Don't toast if we are already in the space feed for this post
          if (pathname.includes(`/s/${newPost.space_id}`)) return;

          toast('New post shared', {
            description: newPost.title || 'A member shared a new post.',
            action: {
              label: 'View',
              onClick: () => window.location.href = `/c/${communityId}/s/${newPost.space_id}/p/${newPost.id}`,
            },
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          // Comments don't have community_id in the table directly, 
          // but we can subscribe to all and filter on client or check RLS.
          // For now, let's stick to posts which have community_id.
        },
        (payload: any) => {
          // Future: comment notifications
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, pathname]);
}
