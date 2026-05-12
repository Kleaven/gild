import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export type PresenceState = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  online_at: string;
};

export function useRealtimePresence(channelId: string, currentUser: PresenceState) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`presence:${channelId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flatMap((s) => s as PresenceState[]);
        
        // Deduplicate by user_id
        const uniqueUsers = Array.from(new Map(users.map(u => [u.user_id, u])).values());
        setOnlineUsers(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(currentUser);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUser.user_id, supabase]);

  return onlineUsers;
}
