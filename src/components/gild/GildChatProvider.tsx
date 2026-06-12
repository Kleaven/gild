'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/browser';
import { getDmUnreadCount } from '@/app/actions/dm';

// ─── Context shape ───────────────────────────────────────────────────────────
// Mounted ONCE at the app shell so chat works everywhere:
//   openChat()            → drawer in inbox/list mode
//   openChatWithUser(id)  → drawer on a specific thread
// Plus app-wide presence (who's online right now) and the unread badge count,
// kept live by a realtime subscription on incoming DMs.

type GildChatContextValue = {
  isChatOpen: boolean;
  /** null while the drawer shows the conversation list. */
  activeRecipientId: string | null;
  openChat: () => void;
  openChatWithUser: (userId: string) => void;
  closeChat: () => void;
  /** Unread DMs across all threads — the nav badge. */
  unreadCount: number;
  refreshUnread: () => void;
  /** User ids currently online (app-wide presence channel). */
  onlineUserIds: Set<string>;
};

const GildChatContext = createContext<GildChatContextValue | null>(null);

const EMPTY_SET = new Set<string>();

type ProviderProps = {
  children: ReactNode;
  /** Session user — required for presence tracking + DM subscription. */
  currentUser?: { id: string; name: string; avatarUrl: string | null } | null;
};

export function GildChatProvider({ children, currentUser = null }: ProviderProps) {
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(EMPTY_SET);

  // Refs so the realtime callback sees current drawer state without resubscribing.
  const openStateRef = useRef({ isChatOpen, activeRecipientId });
  openStateRef.current = { isChatOpen, activeRecipientId };

  const openChat = useCallback(() => {
    setActiveRecipientId(null);
    setIsChatOpen(true);
  }, []);

  const openChatWithUser = useCallback((userId: string) => {
    setActiveRecipientId(userId);
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    // Recipient is kept for the exit animation; next open overwrites it.
  }, []);

  const refreshUnread = useCallback(() => {
    getDmUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  const userId = currentUser?.id ?? null;
  const userName = currentUser?.name ?? null;
  const userAvatar = currentUser?.avatarUrl ?? null;

  // ── Initial unread count ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    refreshUnread();
  }, [userId, refreshUnread]);

  // ── App-wide presence ─────────────────────────────────────────────────────
  // One global channel: everyone signed in tracks themselves; everyone reads
  // the same roster. This is what makes the online dot truthful in chat and
  // the members table (previously hardcoded offline).
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel('presence:gild-global');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        for (const entries of Object.values(state)) {
          for (const entry of entries as unknown as { user_id?: string }[]) {
            if (entry.user_id) ids.add(entry.user_id);
          }
        }
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            name: userName,
            avatar_url: userAvatar,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userName, userAvatar]);

  // ── Live unread badge + toast on incoming DMs ─────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dm-inbox:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const senderId = (payload.new as { sender_id?: string }).sender_id;
          const { isChatOpen: open, activeRecipientId: active } = openStateRef.current;
          // Thread already on screen → the drawer handles read state; no noise.
          if (open && active === senderId) return;

          setUnreadCount((c) => c + 1);
          toast('New message', {
            description: 'Someone sent you a direct message.',
            action: senderId
              ? { label: 'Open', onClick: () => openChatWithUser(senderId) }
              : undefined,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, openChatWithUser]);

  const value = useMemo<GildChatContextValue>(
    () => ({
      isChatOpen,
      activeRecipientId,
      openChat,
      openChatWithUser,
      closeChat,
      unreadCount,
      refreshUnread,
      onlineUserIds,
    }),
    [isChatOpen, activeRecipientId, openChat, openChatWithUser, closeChat, unreadCount, refreshUnread, onlineUserIds],
  );

  return <GildChatContext.Provider value={value}>{children}</GildChatContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
// No-op fallback outside the provider so trigger components never crash.

const NOOP_VALUE: GildChatContextValue = {
  isChatOpen: false,
  activeRecipientId: null,
  openChat: () => {},
  openChatWithUser: () => {},
  closeChat: () => {},
  unreadCount: 0,
  refreshUnread: () => {},
  onlineUserIds: EMPTY_SET,
};

export function useGildChat(): GildChatContextValue {
  return useContext(GildChatContext) ?? NOOP_VALUE;
}
